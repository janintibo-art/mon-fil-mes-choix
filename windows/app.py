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
    def __init__(self):
        self.root = tk.Tk()
        self.root.title(APP)
        self.root.geometry("740x700")
        self.root.minsize(570, 600)
        self.root.configure(bg=BG)
        try:
            self.root.iconbitmap(default="")
        except tk.TclError:
            pass
        self.lbl("MON FIL, MES CHOIX / FILTRE DNS", 12, GREEN, True, pady=(22, 2))
        self.lbl("Choisissez les sites à masquer", 24, FG, True, pady=(0, 6))
        self.lbl("Windows : blocage par résolution locale des noms (fichier hosts).\nNe filtre ni les publications Facebook ni les noms de personnes.", 12, DIM, pady=(0, 14))
        self.status = self.lbl("", 13, GREEN, True, pady=(0, 14))
        self.lbl("DOMAINES À BLOQUER — UN PAR LIGNE", 11, FG, True, pady=(0, 6))
        frame = tk.Frame(self.root, bg=BG)
        frame.pack(fill="both", expand=True, padx=24)
        sc = tk.Scrollbar(frame)
        sc.pack(side="right", fill="y")
        self.editor = tk.Text(frame, bg=PANEL, fg=FG, insertbackground=FG, selectbackground="#285e66",
                              font=("Consolas", 12), padx=16, pady=14, borderwidth=0, yscrollcommand=sc.set)
        self.editor.pack(side="left", fill="both", expand=True)
        sc.configure(command=self.editor.yview)
        try:
            value = CUSTOM.read_text(encoding="utf-8")
        except OSError:
            value = defaults()
        self.editor.insert("1.0", value)
        row = tk.Frame(self.root, bg=BG)
        row.pack(fill="x", padx=24, pady=16)
        self.button(row, "Enregistrer", self.save, "#29405b").pack(side="left", expand=True, fill="x", padx=(0, 8))
        self.button(row, "Activer", self.enable, GREEN, fg="#0b1623").pack(side="left", expand=True, fill="x", padx=(0, 8))
        self.button(row, "Désactiver", self.disable, "#67374d").pack(side="left", expand=True, fill="x")
        self.lbl("La première activation demande les droits administrateur Windows (UAC).\nLe bouton Désactiver supprime uniquement les lignes ajoutées par l'application.\nLa liste inclut 9 domaines initiaux ; ajoutez les vôtres. Les sous-domaines\nautres que www ne sont pas couverts dans cette version Windows.", 10, DIM, pady=(0, 18))
        self.refresh()

    def lbl(self, content, size, color, bold=False, pady=0):
        label = tk.Label(self.root, text=content, bg=BG, fg=color,
                         font=("Segoe UI", size, "bold" if bold else "normal"),
                         wraplength=650, justify="left", anchor="w")
        label.pack(fill="x", padx=24, pady=pady)
        return label

    def button(self, parent, content, command, bg, fg=FG):
        return tk.Button(parent, text=content, command=command, bg=bg, fg=fg,
                         font=("Segoe UI", 11, "bold"), activebackground=bg,
                         activeforeground=fg, padx=5, pady=10, borderwidth=0, cursor="hand2")

    def refresh(self):
        self.status.config(text="● Filtre ACTIF" if active() else "○ Filtre INACTIF")

    def save(self):
        raw = self.editor.get("1.0", "end")
        parsed, invalid = normalize(raw)
        if invalid:
            messagebox.showerror("Domaines invalides", "Corrigez ces lignes :\n" + "\n".join(invalid[:12]))
            return None
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        CUSTOM.write_text("\n".join(parsed) + ("\n" if parsed else ""), encoding="utf-8")
        messagebox.showinfo("Liste enregistrée", f"{len(parsed)} domaine(s) prêts à être filtrés.")
        return parsed

    def enable(self):
        domains = self.save()
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
