# -*- coding: utf-8 -*-
"""Mon fil, mes choix DNS : Windows system hostname-resolution filter.

Safe-by-default: changes ONLY a clearly delimited portion of the system hosts
file, after Windows UAC consent. Does not change network adapters or DNS servers.
"""
import ctypes
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tkinter as tk
from tkinter import messagebox, filedialog
from collections import OrderedDict
from tkinter import ttk
import threading
import blocklists

APP = "Mon fil, mes choix • Filtre DNS"
OPEN = "# DEBUT MON_FIL_MES_CHOIX_DNS — zone gérée par l'application"
CLOSE = "# FIN MON_FIL_MES_CHOIX_DNS"
HOST_RE = re.compile(r"(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$", re.I)
DATA_DIR = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "MonFilMesChoix"
CUSTOM = DATA_DIR / "domaines.txt"
HOSTS = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32" / "drivers" / "etc" / "hosts"
SELECTION_FILE = DATA_DIR / "selection_v14.json"
DEFAULT_FILTERS = Path(getattr(sys, "_MEIPASS", Path(__file__).parent)) / "selection_v14.json"
AD_PREFS = DATA_DIR / "publicites_options.json"
ALLOW_FILE = DATA_DIR / "domaines_autorises.txt"

PROFILE_FORMAT = "mon-fil-mes-choix-preferences"
PROFILE_VERSION = 1


def validate_profile(obj, valid_ids):
    if not isinstance(obj, dict) or obj.get("format") != PROFILE_FORMAT or obj.get("version") != PROFILE_VERSION:
        raise ValueError("Ce fichier n’est pas une sauvegarde compatible Mon fil, mes choix.")
    values = obj.get("excluded_ids")
    domains = obj.get("custom_domains")
    if not isinstance(values, list) or len(values) > 303 or any(type(x) is not int or x not in valid_ids for x in values):
        raise ValueError("La sélection du fichier est invalide.")
    if not isinstance(domains, list) or len(domains) > 1000 or any(not isinstance(x,str) for x in domains):
        raise ValueError("Les domaines du fichier sont invalides.")
    text = "\n".join(domains)
    clean, invalid = normalize(text)
    if invalid or len(clean) != len(set(domains)):
        raise ValueError("Le fichier contient des domaines invalides ou en double.")
    return set(values), clean


def catalog():
    """303 public entries, not a list of 303 DNS-addressable people."""
    items = json.loads(DEFAULT_FILTERS.read_text(encoding="utf-8"))["entries"]
    if len(items) != 303 or len({int(x["id"]) for x in items}) != len(items):
        raise ValueError("Répertoire incomplet ou identifiants dupliqués.")
    return items


def selection_load():
    try:
        data = json.loads(SELECTION_FILE.read_text(encoding="utf-8"))
        return {int(i) for i in data.get("excluded", [])}
    except (OSError, ValueError, TypeError):
        return set()


def selection_save(excluded):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temp = SELECTION_FILE.with_suffix(".tmp")
    temp.write_text(json.dumps({"version": 14, "excluded": sorted(excluded)}, ensure_ascii=False), encoding="utf-8")
    temp.replace(SELECTION_FILE)


def selection_domains(entries, excluded):
    return sorted({x["domain"] for x in entries if x["id"] not in excluded and x["domain"]})


def ads_flags():
    try:
        obj = json.loads(AD_PREFS.read_text(encoding="utf-8"))
        return {source: bool(obj.get(source, False)) for source in blocklists.SOURCES}
    except (OSError, ValueError, TypeError):
        return {source: False for source in blocklists.SOURCES}


def save_ads_flags(flags):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = AD_PREFS.with_suffix('.tmp')
    tmp.write_text(json.dumps(flags, ensure_ascii=False), encoding='utf-8')
    tmp.replace(AD_PREFS)


def allowed_domains():
    try:
        return set(normalize(ALLOW_FILE.read_text(encoding="utf-8"))[0])
    except OSError:
        return set()


def all_filter_domains(manual, entries, excluded, flags, data_dir=DATA_DIR):
    blocked = set(manual) | set(selection_domains(entries, excluded)) | blocklists.enabled_domains(data_dir, flags)
    allowed = allowed_domains()
    # hosts matches exact hostnames, so exceptions can safely remove exact names.
    return sorted(blocked - allowed)


def group_catalog(entries):
    groups = OrderedDict()
    for item in entries:
        groups.setdefault(item["group"], []).append(item)
    return groups


def initial_custom_domains():
    """Old installation stored 9 defaults in CUSTOM; migrate only the extras."""
    try:
        current = CUSTOM.read_text(encoding="utf-8")
    except OSError:
        return ""
    recognized, invalid = normalize(current)
    defaults_set = {e["domain"] for e in catalog() if e["domain"]}
    custom = [x for x in recognized if x not in defaults_set]
    return "\n".join(custom + invalid) + ("\n" if custom or invalid else "")

BG, PANEL, FG, DIM, GREEN = "#0e1522", "#192639", "#f0f6ff", "#aebbc9", "#54dfb6"


def defaults():
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
    obj = json.loads((base / "domaines_v1.json").read_text(encoding="utf-8"))
    return "\n".join(x["host"] for x in obj) + "\n"


def normalize(raw):
    entries = set()
    invalid = []
    for line in raw.splitlines():
        item = line.strip().lower()
        if not item or item.startswith("#"):
            continue
        if item.startswith("*."):
            item = item[2:]
        if not HOST_RE.fullmatch(item) or item.endswith(".local") or item == "localhost":
            invalid.append(line)
            continue
        entries.add(item)
    return sorted(entries), invalid


def read_hosts():
    # preserve Windows BOM if present and existing user modifications
    return HOSTS.read_text(encoding="utf-8-sig", errors="replace")


def strip_managed(content):
    if OPEN not in content:
        return content
    before, sep, after = content.partition(OPEN)
    if not sep or CLOSE not in after:
        raise ValueError("Marqueurs hosts incomplets. Restauration manuelle nécessaire.")
    _, _, tail = after.partition(CLOSE)
    return before.rstrip("\r\n") + "\n" + tail.lstrip("\r\n")


def active():
    try:
        return OPEN in read_hosts()
    except Exception:
        return False


def apply_hosts(domains):
    original = read_hosts()
    base = strip_managed(original)
    if domains:
        lines = [OPEN, "# Cette zone est réversible via l'application."]
        for domain in domains:
            # hosts file has no wildcard domains. Cover the apex and common www.
            lines.append(f"0.0.0.0 {domain}")
            lines.append(f"0.0.0.0 www.{domain}")
            lines.append(f":: {domain}")
            lines.append(f":: www.{domain}")
        lines.append(CLOSE)
        new = base.rstrip("\r\n") + "\n\n" + "\n".join(lines) + "\n"
    else:
        new = base.rstrip("\r\n") + "\n"
    if new != original:
        # atomic-style replacement not used: Windows hosts ACLs need preserving.
        # Backup original before first write, keeps the last unmodified copy.
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        backup = DATA_DIR / "hosts_sauvegarde_avant_modification.txt"
        if not backup.exists():
            backup.write_text(original, encoding="utf-8")
        HOSTS.write_text(new, encoding="utf-8", newline="\r\n")
        subprocess.run(["ipconfig", "/flushdns"], capture_output=True, check=False, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))


def is_admin():
    try:
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except Exception:
        return False


def elevate():
    # Called only after an explicit click on Activer/Désactiver.
    if getattr(sys, "frozen", False):
        exe, args = sys.executable, ""
    else:
        exe, args = sys.executable, '"' + str(Path(__file__).resolve()) + '"'
    value = ctypes.windll.shell32.ShellExecuteW(None, "runas", exe, args, None, 1)
    return int(value) > 32


class GUI:
    """Interface V14 — selection all by default, DNS rules only for known domains."""

    BG = "#0a0d11"
    SIDE = "#10151c"
    CARD = "#171e27"
    CARD2 = "#1c2530"
    EDGE = "#293442"
    TEXT = "#f7f8fb"
    MUTED = "#aab6c4"
    RED = "#f02941"
    RED_DARK = "#5b202c"
    GREEN = "#49dca0"

    def __init__(self):
        self.root = tk.Tk()
        self.root.title(APP)
        self.root.geometry("1120x790")
        self.root.minsize(860, 610)
        self.root.configure(bg=self.BG)
        try:
            icon_path = Path(getattr(sys, "_MEIPASS", Path(__file__).parent)) / "assets" / "logo_windows.png"
            self._taskbar_icon = tk.PhotoImage(file=str(icon_path))
            self.root.iconphoto(True, self._taskbar_icon)
        except (OSError, tk.TclError):
            pass
        self.root.columnconfigure(1, weight=1)
        self.root.rowconfigure(0, weight=1)

        self.sidebar = tk.Frame(self.root, bg=self.SIDE, width=236, padx=17, pady=21)
        self.sidebar.grid(row=0, column=0, sticky="ns")
        self.sidebar.grid_propagate(False)
        self._build_sidebar()

        outer = tk.Frame(self.root, bg=self.BG)
        outer.grid(row=0, column=1, sticky="nsew")
        outer.grid_rowconfigure(0, weight=1)
        outer.grid_columnconfigure(0, weight=1)
        self.canvas = tk.Canvas(outer, bg=self.BG, highlightthickness=0, borderwidth=0)
        self.canvas.grid(row=0, column=0, sticky="nsew")
        scroll = tk.Scrollbar(outer, command=self.canvas.yview, width=10)
        scroll.grid(row=0, column=1, sticky="ns")
        self.canvas.configure(yscrollcommand=scroll.set)
        self.content = tk.Frame(self.canvas, bg=self.BG, padx=28, pady=23)
        self.content_window = self.canvas.create_window((0, 0), window=self.content, anchor="nw")
        self.content.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.bind("<Configure>", lambda e: self.canvas.itemconfigure(self.content_window, width=e.width))
        self.canvas.bind_all("<MouseWheel>", self._on_mousewheel)

        self.entries = catalog()
        self.groups = group_catalog(self.entries)
        self.excluded = selection_load()
        self.ads = ads_flags()
        self._build_header()
        self._build_overview()
        self._build_selection()
        self._build_transfer()
        self._build_rules()
        self._build_ads()
        self._build_allowlist()
        self._build_help()
        self.refresh()

    def _on_mousewheel(self, event):
        # Let the editor scroll independently when the pointer is over it.
        px, py = self.root.winfo_pointerxy()
        target = self.root.winfo_containing(px, py)
        if target is self.editor or target is getattr(self, "editor_scroll", None):
            return
        self.canvas.yview_scroll(-int(event.delta / 120), "units")

    def _brand(self, parent, size=88):
        """High-resolution PNG, bundled within the Windows executable."""
        asset = Path(getattr(sys, "_MEIPASS", Path(__file__).parent)) / "assets" / "logo_windows.png"
        try:
            original = tk.PhotoImage(file=str(asset))
            self._brand_image = original.subsample(3, 3)  # 256 -> 85 pixels
            return tk.Label(parent, image=self._brand_image, bg=parent.cget("bg"), bd=0)
        except (OSError, tk.TclError):
            return self._label(parent, "MON FIL", 18, self.RED, True)

    def _label(self, parent, text, size=11, color=None, bold=False, **kw):
        return tk.Label(parent, text=text, bg=parent.cget("bg"), fg=color or self.TEXT,
                        font=("Segoe UI", size, "bold" if bold else "normal"),
                        justify="left", anchor="w", **kw)

    def _button(self, parent, text, command, bg=None, fg=None, small=False):
        return tk.Button(parent, text=text, command=command, bg=bg or self.CARD2,
                         fg=fg or self.TEXT, font=("Segoe UI", 10 if small else 11, "bold"),
                         activebackground="#bf2037" if bg == self.RED else "#303c4b",
                         activeforeground="#ffffff", padx=15, pady=9 if small else 12,
                         relief="flat", bd=0, cursor="hand2", highlightthickness=0)

    def _card(self, parent, padx=19, pady=17):
        return tk.Frame(parent, bg=self.CARD, padx=padx, pady=pady,
                        highlightbackground=self.EDGE, highlightthickness=1)

    def _build_sidebar(self):
        self._brand(self.sidebar, 88).pack(anchor="w", pady=(1, 13))
        self._label(self.sidebar, "MON FIL,", 16, self.TEXT, True).pack(anchor="w")
        self._label(self.sidebar, "MES CHOIX", 16, self.RED, True).pack(anchor="w")
        self._label(self.sidebar, "FILTRE DNS  /  WINDOWS", 9, self.MUTED, True).pack(anchor="w", pady=(6, 28))
        for name, target in (("▣   Tableau de bord", "overview"),
                             ("☷   Liste des domaines", "rules"),
                             ("ⓘ   Comment ça marche", "help")):
            self._button(self.sidebar, name, lambda ref=target: self._scroll_to(ref),
                         self.RED_DARK if target == "overview" else self.SIDE,
                         self.TEXT, small=True).pack(fill="x", pady=3)
        self._label(self.sidebar, "RÉGLAGES LOCAUX", 9, self.MUTED, True).pack(anchor="w", pady=(30, 8))
        self._label(self.sidebar, "• Aucun compte requis\n• Aucune télémétrie ajoutée\n• Réversible à tout moment",
                    10, self.MUTED).pack(anchor="w")
        self._label(self.sidebar, "V25  •  MON FIL, MES CHOIX", 9, self.MUTED).pack(side="bottom", anchor="w", pady=(15, 0))

    def _scroll_to(self, section):
        widget = getattr(self, section + "_section")
        self.root.update_idletasks()
        full = self.canvas.bbox("all")
        if full and full[3] > 0:
            y = max(0, widget.winfo_rooty() - self.content.winfo_rooty())
            self.canvas.yview_moveto(min(1, y / full[3]))

    def _build_header(self):
        hero = tk.Frame(self.content, bg=self.BG)
        hero.pack(fill="x", pady=(3, 20))
        self._label(hero, "VOTRE NAVIGATION, VOS RÈGLES", 10, self.RED, True).pack(anchor="w")
        self._label(hero, "Mon fil, mes choix", 28, self.TEXT, True).pack(anchor="w", pady=(6, 1))
        self._label(hero, "303 fiches sélectionnées par défaut • seuls les domaines vérifiés sont bloquables par hosts.",
                    12, self.MUTED).pack(anchor="w")

    def _build_overview(self):
        self.overview_section = tk.Frame(self.content, bg=self.BG)
        self.overview_section.pack(fill="x", pady=(0, 19))
        row = tk.Frame(self.overview_section, bg=self.BG)
        row.pack(fill="x")
        state_card = self._card(row)
        state_card.pack(side="left", fill="both", expand=True, padx=(0, 10))
        self._label(state_card, "ÉTAT DE LA PROTECTION", 10, self.MUTED, True).pack(anchor="w")
        self.status = self._label(state_card, "● Vérification…", 22, self.GREEN, True)
        self.status.pack(anchor="w", pady=(9, 4))
        self._label(state_card, "Filtrage local via le fichier hosts de Windows.",
                    10, self.MUTED).pack(anchor="w")
        stat_card = self._card(row)
        stat_card.pack(side="left", fill="both", expand=True)
        self._label(stat_card, "DOMAINES BLOQUABLES", 10, self.MUTED, True).pack(anchor="w")
        self.domain_count = self._label(stat_card, "0", 23, self.TEXT, True)
        self.domain_count.pack(anchor="w", pady=(9, 4))
        self._label(stat_card, "9 domaines initiaux + listes publicitaires facultatives.",
                    10, self.MUTED).pack(anchor="w")
        actions = self._card(self.overview_section)
        actions.pack(fill="x", pady=(10, 0))
        self._label(actions, "Pour commencer", 17, self.TEXT, True).pack(anchor="w", pady=(0, 6))
        self._label(actions,
                    "1. Vos choix sont déjà préparés.\n"
                    "2. Activez la protection avec le bouton ci-dessous.\n"
                    "3. Vous pouvez l'arrêter à tout moment.\n"
                    "Les réglages détaillés se trouvent plus bas sur cette page.",
                    11, self.MUTED).pack(anchor="w", pady=(0, 12))
        self._label(actions, "Actions rapides", 15, self.TEXT, True).pack(anchor="w", pady=(0, 11))
        buttons = tk.Frame(actions, bg=self.CARD)
        buttons.pack(fill="x")
        self._button(buttons, "ACTIVER LE FILTRE", self.enable, self.RED).pack(side="left", fill="x", expand=True, padx=(0, 8))
        self._button(buttons, "DÉSACTIVER", self.disable, self.CARD2).pack(side="left", fill="x", expand=True, padx=(0, 8))
        self._button(buttons, "ENREGISTRER", self.save, "#2a3949").pack(side="left", fill="x", expand=True)
        self._button(actions, "VÉRIFIER MA PROTECTION", self.show_diagnostic, self.CARD2).pack(anchor="w", pady=(12, 0))
        self._button(actions, "UN SITE NE FONCTIONNE PLUS ?", self.recovery_assistant, self.RED).pack(anchor="w", pady=(10, 0))
        self._label(actions, "Une autorisation administrateur peut être nécessaire pour appliquer les changements.",
                    10, self.MUTED).pack(anchor="w", pady=(12, 0))

    def _build_selection(self):
        self.selection_section = self._card(self.content)
        self.selection_section.pack(fill="x", pady=(0, 18))
        self._label(self.selection_section, "Choisir les groupes et les 303 entrées", 17, self.TEXT, True).pack(anchor="w")
        self._label(self.selection_section,
                    "Toutes les entrées sont cochées au départ. Le filtrage Windows agit uniquement sur les domaines connus.",
                    10, self.MUTED, wraplength=630).pack(anchor="w", pady=(5, 9))
        self.selection_count = self._label(self.selection_section, "", 11, self.GREEN, True)
        self.selection_count.pack(anchor="w", pady=(0, 12))
        row = tk.Frame(self.selection_section, bg=self.CARD)
        row.pack(fill="x")
        self._button(row, "GÉRER LES GROUPES", self.manage_groups, self.RED).pack(side="left", padx=(0, 8))
        self._button(row, "TOUT COCHER", lambda: self.change_all(True), self.CARD2).pack(side="left", padx=(0, 8))
        self._button(row, "TOUT DÉCOCHER", lambda: self.change_all(False), self.CARD2).pack(side="left")

    def _build_transfer(self):
        panel = self._card(self.content)
        panel.pack(fill="x", pady=(0, 18))
        self._label(panel, "Retrouver mes choix sur un autre appareil", 17, self.TEXT, True).pack(anchor="w")
        self._label(panel, "Sauvegardez vos cases cochées et vos domaines personnels, ou récupérez ceux d’un autre appareil. Les listes publicitaires restent sur chaque appareil.", 10, self.MUTED, wraplength=640).pack(anchor="w", pady=(5, 12))
        row = tk.Frame(panel, bg=self.CARD)
        row.pack(fill="x")
        self._button(row, "SAUVEGARDER MES CHOIX", self.export_profile, self.RED).pack(side="left", padx=(0, 10))
        self._button(row, "RÉCUPÉRER MES CHOIX", self.import_profile, self.CARD2).pack(side="left")

    def export_profile(self):
        path = filedialog.asksaveasfilename(title="Sauvegarder mes choix", defaultextension=".json", initialfile="mes-choix.json", filetypes=[("Fichier de sauvegarde", "*.json")])
        if not path: return
        try:
            manual, invalid = normalize(self.editor.get("1.0", "end"))
            if invalid: raise ValueError("Corrigez les domaines invalides avant de sauvegarder.")
            obj = {"format": PROFILE_FORMAT, "version": PROFILE_VERSION,
                   "excluded_ids": sorted(self.excluded), "custom_domains": manual}
            Path(path).write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
            messagebox.showinfo("C’est enregistré", "Vos choix ont bien été sauvegardés. Vous pouvez envoyer ce fichier sur votre autre appareil.")
        except (OSError, ValueError) as exc:
            messagebox.showerror("Sauvegarde impossible", str(exc))

    def import_profile(self):
        path = filedialog.askopenfilename(title="Récupérer mes choix", filetypes=[("Fichier de sauvegarde", "*.json")])
        if not path: return
        try:
            if Path(path).stat().st_size > 100000: raise ValueError("Ce fichier est trop volumineux.")
            excluded, manual = validate_profile(json.loads(Path(path).read_text(encoding="utf-8")), {x["id"] for x in self.entries})
        except (OSError, ValueError, UnicodeError) as exc:
            messagebox.showerror("Fichier non reconnu", str(exc)); return
        if not messagebox.askyesno("Remplacer mes choix ?", f"Cette sauvegarde contient {303-len(excluded)} choix sélectionnés et {len(manual)} domaines personnels.\n\nRemplacer vos choix actuels ? Le filtre Windows ne sera pas activé automatiquement."):
            return
        self.excluded = excluded
        selection_save(self.excluded)
        self.editor.delete("1.0", "end")
        self.editor.insert("1.0", "\n".join(manual))
        self.save()
        self._label_selection_count(); self._update_count()
        messagebox.showinfo("Choix récupérés", "Vos choix sont prêts. Si la protection est active, appliquez les nouvelles règles avec le bouton Activer.")

    def _selection_changed(self):
        selection_save(self.excluded)
        self._update_count()
        self._label_selection_count()

    def _label_selection_count(self):
        chosen = len(self.entries) - len(self.excluded)
        dns = len(selection_domains(self.entries, self.excluded))
        self.selection_count.config(text=f"{chosen} / 303 entrées sélectionnées  •  {dns} domaine(s) relié(s) à ces entrées")

    def change_all(self, on):
        self.excluded = set() if on else {x["id"] for x in self.entries}
        self._selection_changed()

    def manage_groups(self):
        dlg = tk.Toplevel(self.root)
        dlg.title("Groupes • Mon fil, mes choix")
        dlg.geometry("730x690")
        dlg.configure(bg=self.BG)
        dlg.transient(self.root)
        dlg.grab_set()
        title = tk.Frame(dlg, bg=self.BG, padx=20, pady=15)
        title.pack(fill="x")
        self._label(title, "Gérer les groupes", 22, self.TEXT, True).pack(anchor="w")
        self._label(title, "Décochez un groupe, ou ouvrez-le pour choisir les entrées une par une.",
                    10, self.MUTED).pack(anchor="w")
        main = tk.Frame(dlg, bg=self.BG)
        main.pack(fill="both", expand=True)
        canvas = tk.Canvas(main, bg=self.BG, highlightthickness=0)
        scroll = tk.Scrollbar(main, command=canvas.yview)
        scroll.pack(side="right", fill="y")
        canvas.pack(side="left", fill="both", expand=True)
        canvas.config(yscrollcommand=scroll.set)
        list_frame = tk.Frame(canvas, bg=self.BG, padx=20, pady=8)
        window = canvas.create_window((0,0), window=list_frame, anchor="nw")
        list_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.bind("<Configure>", lambda e: canvas.itemconfigure(window, width=e.width))
        variables = {}
        def update_indicators():
            for name, items in self.groups.items():
                chosen = sum(x["id"] not in self.excluded for x in items)
                variables[name][1].configure(text=f"{chosen} / {len(items)} sélectionnées")
                variables[name][0].set(chosen == len(items))
        def toggle_group(name):
            items=self.groups[name]
            on=bool(variables[name][0].get())
            for item in items:
                if on: self.excluded.discard(item["id"])
                else: self.excluded.add(item["id"])
            self._selection_changed()
            update_indicators()
        for name, items in self.groups.items():
            panel = self._card(list_frame, 14, 12)
            panel.pack(fill="x", pady=5)
            line = tk.Frame(panel, bg=self.CARD)
            line.pack(fill="x")
            value = tk.BooleanVar(value=all(item["id"] not in self.excluded for item in items))
            tk.Checkbutton(line, text=name, variable=value, command=lambda n=name: toggle_group(n),
                           bg=self.CARD, fg=self.TEXT, activebackground=self.CARD, activeforeground=self.TEXT,
                           selectcolor=self.SIDE, font=("Segoe UI", 11, "bold"), anchor="w").pack(side="left", fill="x", expand=True)
            counter = self._label(panel, "", 10, self.MUTED)
            counter.pack(side="left")
            self._button(panel, "Choisir les entrées", lambda n=name: self.manage_entries(n, update_indicators),
                         self.CARD2, small=True).pack(side="right")
            variables[name] = (value, counter)
        update_indicators()
        self._button(dlg, "FERMER", dlg.destroy, self.RED).pack(anchor="e", padx=20, pady=15)

    def manage_entries(self, group, callback):
        dlg = tk.Toplevel(self.root)
        dlg.title("Entrées • " + group)
        dlg.geometry("680x730")
        dlg.configure(bg=self.BG)
        dlg.transient(self.root)
        dlg.grab_set()
        head = tk.Frame(dlg, bg=self.BG, padx=18, pady=13)
        head.pack(fill="x")
        self._label(head, group, 17, self.TEXT, True, wraplength=610).pack(anchor="w")
        self._label(head, "Sans domaine DNS : aucune règle hosts. Pour les noms et mots-clés, installez le module navigateur depuis le site.", 10, self.MUTED).pack(anchor="w")
        container = tk.Frame(dlg, bg=self.BG)
        container.pack(fill="both", expand=True)
        canvas = tk.Canvas(container, bg=self.BG, highlightthickness=0)
        scrollbar = tk.Scrollbar(container, command=canvas.yview)
        scrollbar.pack(side="right", fill="y")
        canvas.pack(side="left", fill="both", expand=True)
        canvas.config(yscrollcommand=scrollbar.set)
        inner = tk.Frame(canvas, bg=self.BG, padx=18, pady=10)
        win = canvas.create_window((0,0), window=inner, anchor="nw")
        inner.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.bind("<Configure>", lambda e: canvas.itemconfigure(win, width=e.width))
        def toggle(entry_id, variable):
            if variable.get(): self.excluded.discard(entry_id)
            else: self.excluded.add(entry_id)
            self._selection_changed()
            callback()
        for entry in self.groups[group]:
            sel = tk.BooleanVar(value=entry["id"] not in self.excluded)
            label = entry["name"] + ("  •  " + entry["domain"] if entry["domain"] else "  •  sans domaine DNS (navigateur seulement)")
            tk.Checkbutton(inner, text=label, variable=sel, command=lambda i=entry["id"],v=sel: toggle(i,v),
                           bg=self.BG, fg=self.TEXT, activebackground=self.BG, activeforeground=self.TEXT,
                           selectcolor=self.SIDE, font=("Segoe UI", 10), wraplength=560,
                           justify="left", anchor="w").pack(fill="x", pady=4)
        self._button(dlg, "FERMER", dlg.destroy, self.RED).pack(anchor="e", padx=18, pady=14)

    def _build_rules(self):
        self.rules_section = self._card(self.content)
        self.rules_section.pack(fill="both", expand=True, pady=(0, 18))
        self._label(self.rules_section, "Domaines personnels supplémentaires", 18, self.TEXT, True).pack(anchor="w")
        self._label(self.rules_section, "Facultatif : un domaine par ligne. Les domaines associés aux groupes s’ajoutent automatiquement.",
                    10, self.MUTED).pack(anchor="w", pady=(3, 12))
        editor_row = tk.Frame(self.rules_section, bg=self.CARD)
        editor_row.pack(fill="both", expand=True)
        self.editor_scroll = tk.Scrollbar(editor_row)
        self.editor_scroll.pack(side="right", fill="y")
        self.editor = tk.Text(editor_row, bg="#0e141b", fg=self.TEXT, insertbackground=self.TEXT,
                              selectbackground="#6d2633", font=("Consolas", 12),
                              padx=17, pady=15, relief="flat", bd=0, height=10,
                              wrap="none", yscrollcommand=self.editor_scroll.set)
        self.editor.pack(side="left", fill="both", expand=True)
        self.editor_scroll.configure(command=self.editor.yview)
        try:
            value = CUSTOM.read_text(encoding="utf-8")
        except OSError:
            value = ""
        self.editor.insert("1.0", initial_custom_domains())
        self.editor.bind("<KeyRelease>", lambda _: self._update_count())
        self._label(self.rules_section, "Enregistrez, puis cliquez sur Activer / Réappliquer pour mettre les règles Windows à jour.",
                    10, self.MUTED).pack(anchor="w", pady=(10, 0))

    def _build_ads(self):
        """Optional advertising sources and user-added domains, at bottom of dashboard."""
        self.ads_section = self._card(self.content)
        self.ads_section.pack(fill="x", pady=(0, 18))
        self._label(self.ads_section, "Publicités et autres blocages (facultatif)", 18, self.TEXT, True).pack(anchor="w")
        self._label(self.ads_section,
                    "Téléchargement manuel des listes : aucun téléchargement automatique, aucun filtrage publicitaire activé par défaut.",
                    10, self.MUTED, wraplength=640).pack(anchor="w", pady=(4, 12))
        self.ads_status = self._label(self.ads_section, "", 10, self.GREEN)
        self.ads_status.pack(anchor="w", pady=(0, 9))
        self.ads_vars = {}
        for source,(label,url) in blocklists.SOURCES.items():
            row = tk.Frame(self.ads_section, bg=self.CARD)
            row.pack(fill="x", pady=5)
            variable = tk.BooleanVar(value=self.ads.get(source, False))
            self.ads_vars[source]=variable
            check = tk.Checkbutton(row,text=label,variable=variable,
                    command=lambda name=source,v=variable:self._toggle_ads(name,v.get()),
                    bg=self.CARD,fg=self.TEXT,activebackground=self.CARD,activeforeground=self.TEXT,
                    selectcolor=self.SIDE,font=("Segoe UI",11),anchor="w")
            check.pack(side="left",fill="x",expand=True)
            self._button(row, "TÉLÉCHARGER / ACTUALISER", lambda name=source:self._download_ads(name),
                         self.CARD2,small=True).pack(side="right")
            self._label(self.ads_section, f"{len(blocklists.cached(DATA_DIR,source))} domaines téléchargés • {url}",
                        9,self.MUTED,wraplength=650).pack(anchor="w")
        self._label(self.ads_section,
                    "Par sécurité, les listes sont limitées aux 10 000 premiers domaines valides par source sur Windows. "
                    "Le filtrage hosts peut ralentir Windows avec une très grande liste. Réappliquez après un téléchargement.",
                    10,self.MUTED,wraplength=650).pack(anchor="w",pady=(9,13))
        self._label(self.ads_section,"Ajouter un autre domaine à bloquer",14,self.TEXT,True).pack(anchor="w")
        self._label(self.ads_section,"Exemple : publicite.exemple.com  (un domaine, pas un mot-clé ou une page Facebook)",
                    10,self.MUTED).pack(anchor="w",pady=(0,8))
        entry_row=tk.Frame(self.ads_section,bg=self.CARD)
        entry_row.pack(fill="x")
        self.ads_custom=tk.Entry(entry_row,bg="#0e141b",fg=self.TEXT,insertbackground=self.TEXT,
                                font=("Segoe UI",11),relief="flat")
        self.ads_custom.pack(side="left",fill="x",expand=True,ipady=11,padx=(0,10))
        self._button(entry_row,"AJOUTER",self._add_ads_custom,self.RED,small=True).pack(side="right")
        self._label(self.ads_section,
                    "Les règles personnelles se retrouvent aussi dans l’éditeur ci-dessus. Pour appliquer sur Windows, cliquez Activer / Réappliquer.",
                    10,self.MUTED,wraplength=640).pack(anchor="w",pady=(10,0))
        self._ads_status()

    def _ads_status(self):
        count=len(blocklists.enabled_domains(DATA_DIR,self.ads))
        self.ads_status.configure(text=f"Publicité : {count} domaines sélectionnés • " +
                                  ("listes activées" if any(self.ads.values()) else "option désactivée"))
        self._update_count()

    def _toggle_ads(self,source,on):
        if on and not blocklists.cached(DATA_DIR,source):
            messagebox.showinfo("Liste absente", "Téléchargez d’abord la liste, puis activez-la.")
            self.ads_vars[source].set(False)
            return
        self.ads[source]=bool(on)
        save_ads_flags(self.ads)
        self._ads_status()

    def _download_ads(self,source):
        label,url=blocklists.SOURCES[source]
        if not messagebox.askyesno("Téléchargement facultatif", f"Télécharger la liste depuis :\n{url}\n\nCela contacte le fournisseur. Continuer ?"):
            return
        self.ads_status.configure(text="Téléchargement en cours... (connexion HTTPS)")
        def task():
            try:
                count,truncated=blocklists.fetch_source(DATA_DIR,source,normalize)
                def success():
                    self._ads_status()
                    messagebox.showinfo("Liste téléchargée", f"{label} : {count} domaines stockés. " +
                                        ("Limite de 10 000 atteinte. " if truncated else "")+
                                        "Cochez cette liste, puis cliquez Activer / Réappliquer pour l’appliquer.")
                self.root.after(0,success)
            except Exception as error:
                self.root.after(0,lambda message=str(error):messagebox.showerror("Téléchargement impossible",message))
                self.root.after(0,self._ads_status)
        threading.Thread(target=task,daemon=True).start()

    def _add_ads_custom(self):
        value=self.ads_custom.get().strip()
        parsed,bad=normalize(value)
        if bad or len(parsed)!=1:
            messagebox.showwarning("Domaine invalide", "Entrez un domaine valide, par exemple publicite.exemple.com")
            return
        current,_=normalize(self.editor.get("1.0","end"))
        if parsed[0] not in current:
            self.editor.insert("end",("\n" if self.editor.get("1.0","end").strip() else "")+parsed[0]+"\n")
        self.ads_custom.delete(0,"end")
        self.save(show_message=False)
        self._update_count()
        messagebox.showinfo("Domaine ajouté", "Domaine enregistré. Cliquez Activer / Réappliquer pour l’appliquer.")

    def _build_allowlist(self):
        panel=self._card(self.content)
        panel.pack(fill="x",pady=(0,18))
        self._label(panel,"Toujours autoriser un domaine",17,self.TEXT,True).pack(anchor="w")
        self._label(panel,"Option facultative : retire ce domaine de nos règles hosts à la prochaine activation. Windows ne fournit pas ici d'historique des sites bloqués.",10,self.MUTED,wraplength=620).pack(anchor="w",pady=(5,10))
        self.allow_editor=tk.Text(panel,height=4,bg=self.CARD2,fg=self.TEXT,insertbackground=self.TEXT,
                                  font=("Consolas",11),relief="flat",padx=10,pady=8)
        self.allow_editor.pack(fill="x")
        try:self.allow_editor.insert("1.0",ALLOW_FILE.read_text(encoding="utf-8"))
        except OSError:pass
        def save_allow():
            names,invalid=normalize(self.allow_editor.get("1.0","end"))
            if invalid:
                messagebox.showerror("Domaine invalide","Vérifiez : "+", ".join(invalid[:6]));return
            if not messagebox.askyesno("Autoriser ces domaines ?", "Enregistrer "+str(len(names))+" exception(s) ? Les règles hosts seront réappliquées lorsque vous cliquerez sur Activer / Réappliquer."):return
            DATA_DIR.mkdir(parents=True,exist_ok=True)
            ALLOW_FILE.write_text("\n".join(names),encoding="utf-8")
            self._update_count()
            messagebox.showinfo("Exceptions sauvegardées","Vos domaines autorisés sont enregistrés. Cliquez sur Activer / Réappliquer pour les appliquer.")
        self._button(panel,"ENREGISTRER MES EXCEPTIONS",save_allow,self.CARD2).pack(anchor="w",pady=(11,0))

    def _build_help(self):
        self.help_section = self._card(self.content)
        self.help_section.pack(fill="x", pady=(0, 18))
        self._label(self.help_section, "Comment ça marche ?", 16, self.TEXT, True).pack(anchor="w", pady=(0, 9))
        self._label(self.help_section,
                    "1. Tous les groupes et leurs entrées sont cochés au premier démarrage.\n"
                    "2. Choisissez les groupes / entrées, ajoutez des domaines personnels au besoin.\n"
                    "3. Activez / réappliquez le filtre et autorisez Windows si nécessaire.\n"
                    "4. Pour annuler, Désactiver retire uniquement nos règles hosts.",
                    11, self.TEXT).pack(anchor="w")
        self._label(self.help_section,
                    "Le filtrage par fichier hosts ne bloque ni les noms de personnes dans les articles, ni tous les sous-domaines. "
                    "Pour masquer des contenus dans une page, utilisez le script Tampermonkey. "
                    "La sauvegarde du hosts est conservée dans votre profil utilisateur.",
                    10, self.MUTED, wraplength=520).pack(anchor="w", pady=(13, 0))
        self._label(self.content, "MON FIL, MES CHOIX  •  FILTRAGE LOCAL ET RÉVERSIBLE", 9, self.MUTED).pack(anchor="w", pady=(0, 7))

    def _update_count(self):
        valid, bad = normalize(self.editor.get("1.0", "end"))
        self.domain_count.config(text=str(len(all_filter_domains(valid,self.entries,self.excluded,self.ads))) + ("  •  erreurs à corriger" if bad else ""))

    def recovery_assistant(self):
        """Beginner-safe choices. Never change a rule without confirmation."""
        dialog = tk.Toplevel(self.root)
        dialog.title("Aide : un site ne fonctionne plus")
        dialog.geometry("540x440")
        dialog.minsize(480, 390)
        dialog.configure(bg=self.BG)
        dialog.transient(self.root)
        dialog.grab_set()
        body = tk.Frame(dialog, bg=self.BG, padx=23, pady=20)
        body.pack(fill="both", expand=True)
        self._label(body, "Un site ne fonctionne plus ?", 20, self.TEXT, True).pack(anchor="w")
        self._label(body, "Choisissez ce que vous souhaitez faire. Vos listes seront conservées.",
                    11, self.MUTED, wraplength=480).pack(anchor="w", pady=(8, 17))

        def stop_for_test():
            dialog.destroy()
            if messagebox.askyesno("Tester sans protection", "Arrêter la protection pour tester le site ? Vos réglages seront conservés et vous pourrez la réactiver ensuite."):
                self.disable()

        def allow_domain():
            dialog.destroy()
            self.recovery_allow_domain()

        self._button(body, "1  ARRÊTER POUR TESTER", stop_for_test, self.RED).pack(fill="x", pady=5)
        self._button(body, "2  AUTORISER UN DOMAINE", allow_domain, self.CARD2).pack(fill="x", pady=5)
        self._button(body, "3  VÉRIFIER MA PROTECTION", lambda: self.show_diagnostic(), self.CARD2).pack(fill="x", pady=5)
        self._button(body, "FERMER", dialog.destroy, self.SIDE).pack(fill="x", pady=(14, 0))

    def recovery_allow_domain(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("Autoriser un domaine")
        dialog.geometry("530x330")
        dialog.configure(bg=self.BG)
        dialog.transient(self.root)
        dialog.grab_set()
        body = tk.Frame(dialog, bg=self.BG, padx=22, pady=18)
        body.pack(fill="both", expand=True)
        self._label(body, "Quel domaine voulez-vous autoriser ?", 16, self.TEXT, True).pack(anchor="w")
        self._label(body, "Exemple : exemple.fr (pas une adresse https:// complète).",
                    10, self.MUTED).pack(anchor="w", pady=(5, 14))
        field = tk.Entry(body, bg=self.CARD2, fg=self.TEXT, insertbackground=self.TEXT,
                         font=("Segoe UI", 12), relief="flat")
        field.pack(fill="x", ipady=11)
        field.focus_set()
        def confirm():
            raw = field.get().strip()
            parsed, bad = normalize(raw)
            if bad or len(parsed) != 1 or parsed[0] != raw.lower():
                messagebox.showwarning("Domaine non reconnu", "Entrez seulement un domaine, par exemple exemple.fr.", parent=dialog)
                return
            domain = parsed[0]
            if not messagebox.askyesno("Autoriser ce domaine ?", "Autoriser " + domain + " ? Vous pourrez annuler ce choix depuis les exceptions.", parent=dialog):
                return
            allow = allowed_domains()
            allow.add(domain)
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            ALLOW_FILE.write_text("\n".join(sorted(allow)) + "\n", encoding="utf-8")
            self.allow_editor.delete("1.0", "end")
            self.allow_editor.insert("1.0", "\n".join(sorted(allow)))
            dialog.destroy()
            if messagebox.askyesno("Exception enregistrée", "Votre exception est sauvegardée. Réappliquer la protection maintenant ?"):
                self.enable()
        self._button(body, "AUTORISER CE DOMAINE", confirm, self.RED).pack(fill="x", pady=(16, 8))
        self._button(body, "ANNULER", dialog.destroy, self.CARD2).pack(fill="x")

    def show_diagnostic(self):
        """Read-only checks. Does not modify the Windows hosts file."""
        try:
            content = read_hosts()
            readable = True
            markers = OPEN in content and CLOSE in content
            incomplete = (OPEN in content) != (CLOSE in content)
        except OSError:
            readable, markers, incomplete = False, False, False
        selected = len(self.entries) - len(self.excluded)
        domains, invalid = normalize(self.editor.get("1.0", "end"))
        count = len(all_filter_domains(domains, self.entries, self.excluded, self.ads))
        report = (
            f"Protection : {'activée' if markers else 'désactivée ou inaccessible'}\n"
            f"Fichier système : {'lisible' if readable else 'non accessible'}\n"
            f"Choix : {selected} / 303\n"
            f"Domaines préparés : {count}\n"
            f"Domaines incorrects dans la saisie : {len(invalid)}\n"
            f"Droits administrateur : {'oui' if is_admin() else 'non (normal pour la consultation)'}\n"
            + ("\nAttention : la zone gérée dans hosts est incomplète.\n" if incomplete else "")
            + "\nDiagnostic local uniquement : aucun site Internet n'est contacté."
        )
        messagebox.showinfo("Vérifier ma protection", report)

    def refresh(self):
        enabled = active()
        self.status.config(text="● Protection active" if enabled else "○ Protection désactivée",
                           fg=self.GREEN if enabled else self.MUTED)
        self._update_count()
        self._label_selection_count()

    def save(self, show_message=True):
        raw = self.editor.get("1.0", "end")
        parsed, invalid = normalize(raw)
        if invalid:
            messagebox.showerror("Domaines invalides", "Corrigez ces lignes :\n" + "\n".join(invalid[:12]))
            return None
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        CUSTOM.write_text("\n".join(parsed) + ("\n" if parsed else ""), encoding="utf-8")
        self._update_count()
        if show_message:
            messagebox.showinfo("Liste enregistrée", f"{len(parsed)} domaine(s) personnels enregistrés.\nLes domaines des groupes sélectionnés s’ajoutent lors de l’activation.")
        return parsed

    def enable(self):
        domains = self.save(show_message=False)
        if domains is None:
            return
        domains = all_filter_domains(domains,self.entries,self.excluded,self.ads)
        if not domains:
            messagebox.showwarning("Liste vide", "Ajoutez un domaine avant d'activer.")
            return
        if not is_admin():
            if messagebox.askyesno("Autorisation Windows", "L'application doit être relancée en administrateur pour modifier le fichier hosts. Continuer ?"):
                if elevate():
                    self.root.destroy()
            return
        try:
            apply_hosts(domains)
            self.refresh()
            messagebox.showinfo("Activé", f"Filtrage de {len(domains)} domaine(s) (et www) activé.")
        except Exception as e:
            messagebox.showerror("Activation impossible", str(e))

    def disable(self):
        if not is_admin():
            if messagebox.askyesno("Autorisation Windows", "Relancer en administrateur pour retirer uniquement nos lignes du fichier hosts ?"):
                if elevate():
                    self.root.destroy()
            return
        try:
            apply_hosts([])
            self.refresh()
            messagebox.showinfo("Désactivé", "Les lignes de filtrage ont été retirées du fichier hosts.")
        except Exception as e:
            messagebox.showerror("Restauration impossible", str(e))

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    GUI().run()
