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
from tkinter import messagebox

APP = "Mon fil, mes choix • Filtre DNS"
OPEN = "# DEBUT MON_FIL_MES_CHOIX_DNS — zone gérée par l'application"
CLOSE = "# FIN MON_FIL_MES_CHOIX_DNS"
HOST_RE = re.compile(r"(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$", re.I)
DATA_DIR = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "MonFilMesChoix"
CUSTOM = DATA_DIR / "domaines.txt"
HOSTS = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32" / "drivers" / "etc" / "hosts"
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
    """Interface V9 — présentation uniquement ; les règles hosts restent inchangées."""

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

        self._build_header()
        self._build_overview()
        self._build_rules()
        self._build_help()
        self.refresh()

    def _on_mousewheel(self, event):
        # Let the editor scroll independently when the pointer is over it.
        px, py = self.root.winfo_pointerxy()
        target = self.root.winfo_containing(px, py)
        if target is self.editor or target is getattr(self, "editor_scroll", None):
            return
        self.canvas.yview_scroll(-int(event.delta / 120), "units")

    def _brand(self, parent, size=60):
        """Tiny vector interpretation of the black/red flag emblem."""
        c = tk.Canvas(parent, bg=parent.cget("bg"), width=size, height=size,
                      highlightthickness=0, bd=0)
        c.create_oval(2, 2, size-2, size-2, fill="#f8f8f8", outline="#d7dce3", width=2)
        c.create_oval(7, 7, size-7, size-7, fill="#111318", outline="#111318")
        c.create_oval(11, 11, size-11, size-11, fill="#f8f8f8", outline="#f8f8f8")
        s = size / 60
        pts = [(13,29),(22,19),(36,23),(50,21),(48,35),(38,30),(25,35),(14,35)]
        c.create_polygon(*[v*s for p in pts for v in p], fill=self.RED, outline=self.RED)
        pts = [(14,38),(27,36),(39,32),(46,37),(38,43),(30,42),(25,51),(20,44)]
        c.create_polygon(*[v*s for p in pts for v in p], fill="#16191e", outline="#16191e")
        return c

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
        self._brand(self.sidebar, 60).pack(anchor="w", pady=(1, 13))
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
        self._label(self.sidebar, "V9  •  MON FIL, MES CHOIX", 9, self.MUTED).pack(side="bottom", anchor="w", pady=(15, 0))

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
        self._label(hero, "Bloquez les domaines sélectionnés, sans modifier vos serveurs DNS.",
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
        self._label(stat_card, "DOMAINES DANS VOTRE LISTE", 10, self.MUTED, True).pack(anchor="w")
        self.domain_count = self._label(stat_card, "0", 23, self.TEXT, True)
        self.domain_count.pack(anchor="w", pady=(9, 4))
        self._label(stat_card, "Seuls les sites définis ci-dessous sont concernés.",
                    10, self.MUTED).pack(anchor="w")
        actions = self._card(self.overview_section)
        actions.pack(fill="x", pady=(10, 0))
        self._label(actions, "Actions rapides", 15, self.TEXT, True).pack(anchor="w", pady=(0, 11))
        buttons = tk.Frame(actions, bg=self.CARD)
        buttons.pack(fill="x")
        self._button(buttons, "ACTIVER LE FILTRE", self.enable, self.RED).pack(side="left", fill="x", expand=True, padx=(0, 8))
        self._button(buttons, "DÉSACTIVER", self.disable, self.CARD2).pack(side="left", fill="x", expand=True, padx=(0, 8))
        self._button(buttons, "ENREGISTRER", self.save, "#2a3949").pack(side="left", fill="x", expand=True)
        self._label(actions, "Une autorisation administrateur peut être nécessaire pour appliquer les changements.",
                    10, self.MUTED).pack(anchor="w", pady=(12, 0))

    def _build_rules(self):
        self.rules_section = self._card(self.content)
        self.rules_section.pack(fill="both", expand=True, pady=(0, 18))
        self._label(self.rules_section, "Liste des domaines", 18, self.TEXT, True).pack(anchor="w")
        self._label(self.rules_section, "Un domaine par ligne • commentaires commençant par # autorisés",
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
            value = defaults()
        self.editor.insert("1.0", value)
        self.editor.bind("<KeyRelease>", lambda _: self._update_count())
        self._label(self.rules_section, "Conseil : enregistrez la liste, puis réactivez le filtre pour appliquer les nouveaux domaines.",
                    10, self.MUTED).pack(anchor="w", pady=(10, 0))

    def _build_help(self):
        self.help_section = self._card(self.content)
        self.help_section.pack(fill="x", pady=(0, 18))
        self._label(self.help_section, "Comment ça marche ?", 16, self.TEXT, True).pack(anchor="w", pady=(0, 9))
        self._label(self.help_section,
                    "1. Ajoutez les domaines à masquer, puis cliquez sur Enregistrer.\n"
                    "2. Activez le filtre et autorisez Windows si nécessaire.\n"
                    "3. Pour annuler, cliquez sur Désactiver : seules nos règles sont retirées.",
                    11, self.TEXT).pack(anchor="w")
        self._label(self.help_section,
                    "Le filtrage par fichier hosts ne bloque ni les noms de personnes dans les articles, ni tous les sous-domaines. "
                    "Pour masquer des contenus dans une page, utilisez le script Tampermonkey. "
                    "La sauvegarde du hosts est conservée dans votre profil utilisateur.",
                    10, self.MUTED, wraplength=520).pack(anchor="w", pady=(13, 0))
        self._label(self.content, "MON FIL, MES CHOIX  •  FILTRAGE LOCAL ET RÉVERSIBLE", 9, self.MUTED).pack(anchor="w", pady=(0, 7))

    def _update_count(self):
        valid, bad = normalize(self.editor.get("1.0", "end"))
        self.domain_count.config(text=str(len(valid)) + ("  •  erreurs à corriger" if bad else ""))

    def refresh(self):
        enabled = active()
        self.status.config(text="● Protection active" if enabled else "○ Protection désactivée",
                           fg=self.GREEN if enabled else self.MUTED)
        self._update_count()

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
            messagebox.showinfo("Liste enregistrée", f"{len(parsed)} domaine(s) prêts à être filtrés.")
        return parsed

    def enable(self):
        domains = self.save(show_message=False)
        if domains is None:
            return
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
