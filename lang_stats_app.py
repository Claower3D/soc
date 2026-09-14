#!/usr/bin/env python3
"""
🔍 Language Stats — десктопное приложение для анализа языков программирования.
Tkinter GUI с интерактивными графиками. Без внешних зависимостей.
"""

import os
import sys
import math
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from collections import defaultdict
from pathlib import Path
import threading

# ─── Цветовая палитра для языков ───────────────────────────────────────────────
LANG_COLORS = {
    "Python": "#3572A5",
    "JavaScript": "#F7DF1E",
    "TypeScript": "#3178C6",
    "TSX (React)": "#61DAFB",
    "JSX (React)": "#61DAFB",
    "HTML": "#E34F26",
    "CSS": "#563D7C",
    "SCSS": "#CF649A",
    "Java": "#B07219",
    "C": "#555555",
    "C++": "#F34B7D",
    "C#": "#178600",
    "Go": "#00ADD8",
    "Rust": "#DEA584",
    "Ruby": "#CC342D",
    "PHP": "#4F5D95",
    "Swift": "#FA7343",
    "Kotlin": "#A97BFF",
    "Dart": "#00B4AB",
    "Shell (Bash)": "#89E051",
    "PowerShell": "#012456",
    "SQL": "#E38C00",
    "Lua": "#000080",
    "R": "#198CE7",
    "Perl": "#0298C3",
    "Haskell": "#5E5086",
    "Elixir": "#6E4A7E",
    "Vue": "#41B883",
    "Svelte": "#FF3E00",
    "Markdown": "#083FA1",
    "JSON": "#A0A0A0",
    "YAML": "#CB171E",
    "TOML": "#9C4221",
    "XML": "#0060AC",
    "Dockerfile": "#384D54",
    "Docker Compose": "#384D54",
    "Docker Config": "#384D54",
    "Makefile": "#427819",
    "Git Config": "#F05032",
    "npm (Node.js)": "#CB3837",
    "TypeScript Config": "#3178C6",
    "Plain Text": "#888888",
}

# Запасные цвета
FALLBACK_COLORS = [
    "#E6194B", "#3CB44B", "#FFE119", "#4363D8", "#F58231",
    "#911EB4", "#42D4F4", "#F032E6", "#BFEF45", "#FABED4",
    "#469990", "#DCBEFF", "#9A6324", "#FFFAC8", "#800000",
    "#AAFFC3", "#808000", "#FFD8B1", "#000075", "#A9A9A9",
]

# ─── Маппинг расширений ───────────────────────────────────────────────────────
EXTENSION_MAP = {
    ".html": "HTML", ".htm": "HTML", ".css": "CSS", ".scss": "SCSS",
    ".sass": "Sass", ".less": "LESS",
    ".js": "JavaScript", ".jsx": "JSX (React)", ".ts": "TypeScript",
    ".tsx": "TSX (React)", ".mjs": "JavaScript (ESM)", ".cjs": "JavaScript (CJS)",
    ".vue": "Vue", ".svelte": "Svelte",
    ".py": "Python", ".pyw": "Python", ".pyx": "Cython",
    ".java": "Java", ".kt": "Kotlin", ".kts": "Kotlin Script",
    ".scala": "Scala", ".groovy": "Groovy", ".clj": "Clojure",
    ".c": "C", ".h": "C/C++ Header", ".cpp": "C++", ".cxx": "C++",
    ".cc": "C++", ".hpp": "C++ Header",
    ".cs": "C#", ".go": "Go", ".rs": "Rust",
    ".rb": "Ruby", ".erb": "ERB (Ruby)", ".php": "PHP",
    ".swift": "Swift", ".m": "Objective-C", ".dart": "Dart",
    ".sh": "Shell (Bash)", ".bash": "Shell (Bash)", ".zsh": "Zsh",
    ".ps1": "PowerShell", ".bat": "Batch", ".cmd": "Batch",
    ".json": "JSON", ".yaml": "YAML", ".yml": "YAML", ".toml": "TOML",
    ".xml": "XML", ".ini": "INI", ".cfg": "Config", ".properties": "Properties",
    ".sql": "SQL",
    ".md": "Markdown", ".rst": "reStructuredText", ".txt": "Plain Text",
    ".lua": "Lua", ".r": "R", ".R": "R",
    ".pl": "Perl", ".pm": "Perl", ".hs": "Haskell",
    ".ex": "Elixir", ".exs": "Elixir Script", ".erl": "Erlang",
    ".tf": "Terraform", ".ipynb": "Jupyter Notebook",
    ".asm": "Assembly", ".zig": "Zig", ".nim": "Nim",
}

FILENAME_MAP = {
    "Dockerfile": "Dockerfile", "Makefile": "Makefile",
    "Gemfile": "Ruby (Bundler)", "Rakefile": "Ruby (Rake)",
    "Procfile": "Procfile", "Jenkinsfile": "Groovy (Jenkins)",
    ".gitignore": "Git Config", ".dockerignore": "Docker Config",
    "requirements.txt": "pip (Python)", "Pipfile": "Pipenv (Python)",
    "pyproject.toml": "Python Project", "package.json": "npm (Node.js)",
    "tsconfig.json": "TypeScript Config",
    "docker-compose.yml": "Docker Compose", "docker-compose.yaml": "Docker Compose",
}

SKIP_DIRS = {
    ".git", ".svn", ".hg", "node_modules", "__pycache__", ".venv", "venv",
    "env", ".tox", ".mypy_cache", ".pytest_cache", "dist", "build", "out",
    "target", ".next", ".nuxt", ".idea", ".vscode", ".vs", "vendor",
    "bower_components", "coverage", ".nyc_output",
}

COMMENT_PREFIXES = {
    "Python": ("#",), "JavaScript": ("//",), "TypeScript": ("//",),
    "JSX (React)": ("//",), "TSX (React)": ("//",), "Java": ("//",),
    "C": ("//",), "C++": ("//",), "C#": ("//",), "Go": ("//",),
    "Rust": ("//",), "Ruby": ("#",), "PHP": ("//", "#"),
    "Swift": ("//",), "Kotlin": ("//",), "Dart": ("//",),
    "Shell (Bash)": ("#",), "PowerShell": ("#",), "YAML": ("#",),
    "TOML": ("#",), "SQL": ("--",), "Lua": ("--",), "R": ("#",),
    "Perl": ("#",), "Haskell": ("--",), "Makefile": ("#",), "Dockerfile": ("#",),
}


# ─── Логика сканирования ──────────────────────────────────────────────────────

def identify_language(filepath: Path) -> str | None:
    name = filepath.name
    if name in FILENAME_MAP:
        return FILENAME_MAP[name]
    ext = filepath.suffix.lower()
    return EXTENSION_MAP.get(ext)


def count_lines(filepath: Path, language: str) -> dict:
    result = {"total": 0, "code": 0, "blank": 0, "comment": 0}
    comment_prefixes = COMMENT_PREFIXES.get(language, ())
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                result["total"] += 1
                stripped = line.strip()
                if not stripped:
                    result["blank"] += 1
                elif comment_prefixes and any(stripped.startswith(p) for p in comment_prefixes):
                    result["comment"] += 1
                else:
                    result["code"] += 1
    except (OSError, UnicodeDecodeError):
        pass
    return result


def scan_project(root: str, progress_callback=None) -> dict:
    stats = defaultdict(lambda: {"files": 0, "total": 0, "code": 0, "blank": 0, "comment": 0})
    root_path = Path(root).resolve()
    file_count = 0
    for dirpath, dirnames, filenames in os.walk(root_path):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for filename in filenames:
            filepath = Path(dirpath) / filename
            language = identify_language(filepath)
            if language is None:
                continue
            lines = count_lines(filepath, language)
            entry = stats[language]
            entry["files"] += 1
            entry["total"] += lines["total"]
            entry["code"] += lines["code"]
            entry["blank"] += lines["blank"]
            entry["comment"] += lines["comment"]
            file_count += 1
            if progress_callback and file_count % 20 == 0:
                progress_callback(file_count)
    return dict(stats)


def get_color(lang: str, index: int) -> str:
    if lang in LANG_COLORS:
        return LANG_COLORS[lang]
    return FALLBACK_COLORS[index % len(FALLBACK_COLORS)]


# ─── GUI ───────────────────────────────────────────────────────────────────────

class LangStatsApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🔍 Language Stats — Анализатор языков проекта")
        self.root.geometry("1200x800")
        self.root.minsize(1000, 650)
        self.root.configure(bg="#1E1E2E")

        self.stats = {}
        self.project_path = ""

        self._setup_styles()
        self._build_ui()

    def _setup_styles(self):
        style = ttk.Style()
        style.theme_use("clam")

        # Основные цвета
        self.BG = "#1E1E2E"
        self.BG2 = "#282840"
        self.BG3 = "#313150"
        self.FG = "#CDD6F4"
        self.FG2 = "#A6ADC8"
        self.ACCENT = "#89B4FA"
        self.ACCENT2 = "#A6E3A1"
        self.BORDER = "#45475A"

        style.configure("Main.TFrame", background=self.BG)
        style.configure("Card.TFrame", background=self.BG2)
        style.configure("Title.TLabel", background=self.BG, foreground=self.FG,
                         font=("Segoe UI", 18, "bold"))
        style.configure("Subtitle.TLabel", background=self.BG, foreground=self.FG2,
                         font=("Segoe UI", 10))
        style.configure("CardTitle.TLabel", background=self.BG2, foreground=self.ACCENT,
                         font=("Segoe UI", 12, "bold"))
        style.configure("CardValue.TLabel", background=self.BG2, foreground=self.FG,
                         font=("Segoe UI", 24, "bold"))
        style.configure("CardUnit.TLabel", background=self.BG2, foreground=self.FG2,
                         font=("Segoe UI", 9))
        style.configure("Accent.TButton", font=("Segoe UI", 11, "bold"))

        # Treeview
        style.configure("Stats.Treeview",
                         background=self.BG2,
                         foreground=self.FG,
                         fieldbackground=self.BG2,
                         borderwidth=0,
                         font=("Consolas", 10),
                         rowheight=28)
        style.configure("Stats.Treeview.Heading",
                         background=self.BG3,
                         foreground=self.ACCENT,
                         font=("Segoe UI", 10, "bold"),
                         borderwidth=0)
        style.map("Stats.Treeview",
                   background=[("selected", "#45475A")],
                   foreground=[("selected", "#FFFFFF")])

    def _build_ui(self):
        # ─── Шапка ─────────────────────────────────────────────────
        header = tk.Frame(self.root, bg=self.BG, pady=10)
        header.pack(fill="x", padx=20)

        title_frame = tk.Frame(header, bg=self.BG)
        title_frame.pack(side="left")

        tk.Label(title_frame, text="📊 Language Stats",
                 bg=self.BG, fg=self.FG, font=("Segoe UI", 20, "bold")).pack(anchor="w")
        self.subtitle_label = tk.Label(title_frame, text="Выберите папку проекта для анализа",
                                        bg=self.BG, fg=self.FG2, font=("Segoe UI", 10))
        self.subtitle_label.pack(anchor="w")

        btn_frame = tk.Frame(header, bg=self.BG)
        btn_frame.pack(side="right")

        self.scan_btn = tk.Button(btn_frame, text="📂  Выбрать проект",
                                   bg=self.ACCENT, fg="#1E1E2E",
                                   font=("Segoe UI", 11, "bold"),
                                   relief="flat", padx=20, pady=8,
                                   cursor="hand2", activebackground="#B4D0FB",
                                   command=self._on_select_folder)
        self.scan_btn.pack(side="right", padx=(10, 0))

        self.rescan_btn = tk.Button(btn_frame, text="🔄  Пересканировать",
                                     bg=self.BG3, fg=self.FG,
                                     font=("Segoe UI", 10),
                                     relief="flat", padx=15, pady=8,
                                     cursor="hand2", activebackground="#45475A",
                                     command=self._on_rescan)
        self.rescan_btn.pack(side="right")

        # ─── Карточки сводки ───────────────────────────────────────
        self.cards_frame = tk.Frame(self.root, bg=self.BG)
        self.cards_frame.pack(fill="x", padx=20, pady=(5, 10))

        self.card_langs = self._make_card(self.cards_frame, "Языков", "—", "обнаружено")
        self.card_files = self._make_card(self.cards_frame, "Файлов", "—", "проанализировано")
        self.card_code = self._make_card(self.cards_frame, "Строк кода", "—", "без пустых и комментариев")
        self.card_total = self._make_card(self.cards_frame, "Всего строк", "—", "включая пустые")

        # ─── Основная область ──────────────────────────────────────
        main_pane = tk.Frame(self.root, bg=self.BG)
        main_pane.pack(fill="both", expand=True, padx=20, pady=(0, 15))

        # Левая панель — графики
        left = tk.Frame(main_pane, bg=self.BG)
        left.pack(side="left", fill="both", expand=False)

        # Круговая диаграмма
        pie_frame = tk.Frame(left, bg=self.BG2, highlightbackground=self.BORDER, highlightthickness=1)
        pie_frame.pack(fill="x", pady=(0, 10))
        tk.Label(pie_frame, text="  Распределение по языкам", bg=self.BG2, fg=self.ACCENT,
                 font=("Segoe UI", 11, "bold"), anchor="w").pack(fill="x", padx=10, pady=(8, 0))

        self.pie_canvas = tk.Canvas(pie_frame, width=380, height=300, bg=self.BG2,
                                     highlightthickness=0)
        self.pie_canvas.pack(padx=10, pady=(0, 10))

        # Легенда
        legend_frame = tk.Frame(left, bg=self.BG2, highlightbackground=self.BORDER, highlightthickness=1)
        legend_frame.pack(fill="both", expand=True)
        tk.Label(legend_frame, text="  Легенда", bg=self.BG2, fg=self.ACCENT,
                 font=("Segoe UI", 11, "bold"), anchor="w").pack(fill="x", padx=10, pady=(8, 0))

        legend_scroll_frame = tk.Frame(legend_frame, bg=self.BG2)
        legend_scroll_frame.pack(fill="both", expand=True, padx=10, pady=(5, 10))

        self.legend_canvas = tk.Canvas(legend_scroll_frame, bg=self.BG2, highlightthickness=0)
        legend_sb = ttk.Scrollbar(legend_scroll_frame, orient="vertical", command=self.legend_canvas.yview)
        self.legend_inner = tk.Frame(self.legend_canvas, bg=self.BG2)

        self.legend_inner.bind("<Configure>",
                                lambda e: self.legend_canvas.configure(scrollregion=self.legend_canvas.bbox("all")))
        self.legend_canvas.create_window((0, 0), window=self.legend_inner, anchor="nw")
        self.legend_canvas.configure(yscrollcommand=legend_sb.set)
        self.legend_canvas.pack(side="left", fill="both", expand=True)
        legend_sb.pack(side="right", fill="y")

        # Правая панель — таблица + бар-чарт
        right = tk.Frame(main_pane, bg=self.BG)
        right.pack(side="left", fill="both", expand=True, padx=(10, 0))

        # Горизонтальный бар-чарт
        bar_frame = tk.Frame(right, bg=self.BG2, highlightbackground=self.BORDER, highlightthickness=1)
        bar_frame.pack(fill="x", pady=(0, 10))
        tk.Label(bar_frame, text="  Строки кода по языкам (Top 8)", bg=self.BG2, fg=self.ACCENT,
                 font=("Segoe UI", 11, "bold"), anchor="w").pack(fill="x", padx=10, pady=(8, 0))
        self.bar_canvas = tk.Canvas(bar_frame, height=240, bg=self.BG2, highlightthickness=0)
        self.bar_canvas.pack(fill="x", padx=10, pady=(5, 10))

        # Таблица
        table_frame = tk.Frame(right, bg=self.BG2, highlightbackground=self.BORDER, highlightthickness=1)
        table_frame.pack(fill="both", expand=True)
        tk.Label(table_frame, text="  Детальная статистика", bg=self.BG2, fg=self.ACCENT,
                 font=("Segoe UI", 11, "bold"), anchor="w").pack(fill="x", padx=10, pady=(8, 0))

        tree_container = tk.Frame(table_frame, bg=self.BG2)
        tree_container.pack(fill="both", expand=True, padx=10, pady=(5, 10))

        columns = ("lang", "files", "code", "blank", "comment", "total", "pct")
        self.tree = ttk.Treeview(tree_container, columns=columns, show="headings",
                                  style="Stats.Treeview", selectmode="browse")

        self.tree.heading("lang", text="Язык")
        self.tree.heading("files", text="Файлы")
        self.tree.heading("code", text="Код")
        self.tree.heading("blank", text="Пустые")
        self.tree.heading("comment", text="Комментарии")
        self.tree.heading("total", text="Всего")
        self.tree.heading("pct", text="%")

        self.tree.column("lang", width=160, minwidth=120)
        self.tree.column("files", width=70, anchor="e", minwidth=60)
        self.tree.column("code", width=90, anchor="e", minwidth=70)
        self.tree.column("blank", width=80, anchor="e", minwidth=60)
        self.tree.column("comment", width=100, anchor="e", minwidth=70)
        self.tree.column("total", width=90, anchor="e", minwidth=70)
        self.tree.column("pct", width=60, anchor="e", minwidth=50)

        tree_sb = ttk.Scrollbar(tree_container, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=tree_sb.set)
        self.tree.pack(side="left", fill="both", expand=True)
        tree_sb.pack(side="right", fill="y")

        # Статусбар
        self.status_var = tk.StringVar(value="Готов к работе")
        status_bar = tk.Label(self.root, textvariable=self.status_var,
                               bg=self.BG3, fg=self.FG2,
                               font=("Segoe UI", 9), anchor="w", padx=10, pady=4)
        status_bar.pack(fill="x", side="bottom")

        # placeholder на графиках
        self._draw_placeholder()

    def _make_card(self, parent, title, value, unit):
        card = tk.Frame(parent, bg=self.BG2, highlightbackground=self.BORDER, highlightthickness=1,
                         padx=15, pady=10)
        card.pack(side="left", fill="x", expand=True, padx=(0, 10))

        tk.Label(card, text=title, bg=self.BG2, fg=self.ACCENT,
                 font=("Segoe UI", 10, "bold")).pack(anchor="w")
        val_label = tk.Label(card, text=value, bg=self.BG2, fg=self.FG,
                              font=("Segoe UI", 22, "bold"))
        val_label.pack(anchor="w")
        tk.Label(card, text=unit, bg=self.BG2, fg=self.FG2,
                 font=("Segoe UI", 8)).pack(anchor="w")

        return val_label

    def _draw_placeholder(self):
        self.pie_canvas.delete("all")
        cx, cy, r = 190, 150, 100
        self.pie_canvas.create_oval(cx - r, cy - r, cx + r, cy + r,
                                     outline=self.BORDER, width=2, dash=(4, 4))
        self.pie_canvas.create_text(cx, cy, text="Нет данных",
                                     fill=self.FG2, font=("Segoe UI", 12))

        self.bar_canvas.delete("all")
        self.bar_canvas.create_text(self.bar_canvas.winfo_reqwidth() // 2, 120,
                                     text="Нет данных",
                                     fill=self.FG2, font=("Segoe UI", 12))

    def _on_select_folder(self):
        folder = filedialog.askdirectory(title="Выберите корневую папку проекта")
        if folder:
            self.project_path = folder
            self._run_scan()

    def _on_rescan(self):
        if self.project_path:
            self._run_scan()
        else:
            self._on_select_folder()

    def _run_scan(self):
        self.scan_btn.config(state="disabled")
        self.rescan_btn.config(state="disabled")
        self.status_var.set(f"⏳ Сканирование: {self.project_path} ...")
        self.subtitle_label.config(text=f"Сканирование: {self.project_path}")

        def scan_thread():
            stats = scan_project(self.project_path,
                                  lambda n: self.root.after(0, lambda: self.status_var.set(
                                      f"⏳ Проанализировано файлов: {n}...")))
            self.root.after(0, lambda: self._on_scan_done(stats))

        threading.Thread(target=scan_thread, daemon=True).start()

    def _on_scan_done(self, stats):
        self.stats = stats
        self.scan_btn.config(state="normal")
        self.rescan_btn.config(state="normal")

        if not stats:
            self.status_var.set("⚠ Не найдено файлов с известными языками.")
            self._draw_placeholder()
            return

        sorted_langs = sorted(stats.items(), key=lambda x: x[1]["code"], reverse=True)
        total_files = sum(s["files"] for s in stats.values())
        total_code = sum(s["code"] for s in stats.values())
        total_blank = sum(s["blank"] for s in stats.values())
        total_lines = sum(s["total"] for s in stats.values())

        # Обновить карточки
        self.card_langs.config(text=str(len(stats)))
        self.card_files.config(text=f"{total_files:,}".replace(",", " "))
        self.card_code.config(text=f"{total_code:,}".replace(",", " "))
        self.card_total.config(text=f"{total_lines:,}".replace(",", " "))

        self.subtitle_label.config(text=f"📁 {self.project_path}")
        self.status_var.set(
            f"✅ Готово — {len(stats)} языков, {total_files} файлов, "
            f"{total_code:,} строк кода".replace(",", " "))

        # Рисуем графики
        self._draw_pie(sorted_langs, total_code)
        self._draw_bar(sorted_langs[:8])
        self._fill_table(sorted_langs, total_code)
        self._fill_legend(sorted_langs, total_code)

    def _draw_pie(self, sorted_langs, total_code):
        self.pie_canvas.delete("all")
        cx, cy = 150, 150
        r_outer, r_inner = 120, 55

        if total_code == 0:
            return

        start_angle = 90  # начинаем сверху
        for i, (lang, data) in enumerate(sorted_langs):
            extent = (data["code"] / total_code) * 360
            if extent < 0.5:
                continue
            color = get_color(lang, i)

            # Рисуем сектор как arc
            self.pie_canvas.create_arc(
                cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer,
                start=start_angle, extent=-extent,
                fill=color, outline=self.BG2, width=2, style="pieslice"
            )
            start_angle -= extent

        # Внутренний круг (donut hole)
        self.pie_canvas.create_oval(cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner,
                                     fill=self.BG2, outline=self.BG2)

        # Текст в центре
        self.pie_canvas.create_text(cx, cy - 10, text=f"{total_code:,}".replace(",", " "),
                                     fill=self.FG, font=("Segoe UI", 14, "bold"))
        self.pie_canvas.create_text(cx, cy + 12, text="строк кода",
                                     fill=self.FG2, font=("Segoe UI", 9))

        # Подписи процентов — топ-3
        start_angle = 90
        for i, (lang, data) in enumerate(sorted_langs[:3]):
            extent = (data["code"] / total_code) * 360
            mid_angle = math.radians(start_angle - extent / 2)
            label_r = r_outer + 30
            lx = cx + label_r * math.cos(mid_angle)
            ly = cy - label_r * math.sin(mid_angle)
            pct = data["code"] / total_code * 100
            self.pie_canvas.create_text(lx, ly, text=f"{pct:.1f}%",
                                         fill=self.FG, font=("Segoe UI", 9, "bold"))
            start_angle -= extent

    def _draw_bar(self, top_langs):
        self.bar_canvas.delete("all")
        self.bar_canvas.update_idletasks()
        w = self.bar_canvas.winfo_width() or 600
        h = 240

        if not top_langs:
            return

        max_code = max(d["code"] for _, d in top_langs) or 1
        bar_h = 22
        gap = 6
        y_start = 10
        label_w = 130
        value_w = 70
        bar_area = w - label_w - value_w - 30

        for i, (lang, data) in enumerate(top_langs):
            y = y_start + i * (bar_h + gap)
            color = get_color(lang, i)
            bar_w = max(2, int((data["code"] / max_code) * bar_area))

            # Название языка
            self.bar_canvas.create_text(label_w - 5, y + bar_h // 2,
                                         text=lang, anchor="e",
                                         fill=self.FG, font=("Segoe UI", 9))
            # Полоса
            self.bar_canvas.create_rectangle(label_w, y, label_w + bar_w, y + bar_h,
                                              fill=color, outline="")
            # Значение
            val_text = f"{data['code']:,}".replace(",", " ")
            self.bar_canvas.create_text(label_w + bar_w + 8, y + bar_h // 2,
                                         text=val_text, anchor="w",
                                         fill=self.FG2, font=("Consolas", 9))

    def _fill_table(self, sorted_langs, total_code):
        for item in self.tree.get_children():
            self.tree.delete(item)

        for lang, data in sorted_langs:
            pct = (data["code"] / total_code * 100) if total_code > 0 else 0
            self.tree.insert("", "end", values=(
                f"  {lang}",
                f"{data['files']:,}".replace(",", " "),
                f"{data['code']:,}".replace(",", " "),
                f"{data['blank']:,}".replace(",", " "),
                f"{data['comment']:,}".replace(",", " "),
                f"{data['total']:,}".replace(",", " "),
                f"{pct:.1f}%"
            ))

        # Итого
        total_files = sum(s["files"] for s in self.stats.values())
        total_code_sum = sum(s["code"] for s in self.stats.values())
        total_blank = sum(s["blank"] for s in self.stats.values())
        total_comment = sum(s["comment"] for s in self.stats.values())
        total_lines = sum(s["total"] for s in self.stats.values())
        self.tree.insert("", "end", values=(
            "  ━━ ИТОГО",
            f"{total_files:,}".replace(",", " "),
            f"{total_code_sum:,}".replace(",", " "),
            f"{total_blank:,}".replace(",", " "),
            f"{total_comment:,}".replace(",", " "),
            f"{total_lines:,}".replace(",", " "),
            "100%"
        ))

    def _fill_legend(self, sorted_langs, total_code):
        for w in self.legend_inner.winfo_children():
            w.destroy()

        for i, (lang, data) in enumerate(sorted_langs):
            color = get_color(lang, i)
            pct = (data["code"] / total_code * 100) if total_code > 0 else 0

            row = tk.Frame(self.legend_inner, bg=self.BG2)
            row.pack(fill="x", pady=1)

            # Цветной квадрат
            sq = tk.Canvas(row, width=14, height=14, bg=self.BG2, highlightthickness=0)
            sq.pack(side="left", padx=(0, 6), pady=2)
            sq.create_rectangle(1, 1, 13, 13, fill=color, outline="")

            tk.Label(row, text=f"{lang}", bg=self.BG2, fg=self.FG,
                     font=("Segoe UI", 9), anchor="w").pack(side="left")
            tk.Label(row, text=f"{pct:.1f}%", bg=self.BG2, fg=self.FG2,
                     font=("Consolas", 9), anchor="e").pack(side="right", padx=(5, 0))


def main():
    root = tk.Tk()

    # Иконка (если есть)
    try:
        root.iconbitmap(default="")
    except Exception:
        pass

    app = LangStatsApp(root)

    # Если передан аргумент — сразу сканировать
    if len(sys.argv) > 1:
        path = os.path.abspath(sys.argv[1])
        if os.path.isdir(path):
            app.project_path = path
            root.after(300, app._run_scan)

    root.mainloop()


if __name__ == "__main__":
    main()
