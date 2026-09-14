#!/usr/bin/env python3
"""
🔍 Language Statistics — анализатор языков программирования в проекте.

Сканирует директорию проекта, определяет используемые языки по расширениям файлов,
подсчитывает количество файлов, строк кода, пустых строк и строк комментариев.
"""

import os
import sys
import io
import argparse
from collections import defaultdict
from pathlib import Path

# Принудительно UTF-8 для Windows консоли
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ─── Маппинг расширений → язык ────────────────────────────────────────────────
EXTENSION_MAP = {
    # Web
    ".html": "HTML",
    ".htm": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".sass": "Sass",
    ".less": "LESS",
    # JavaScript / TypeScript
    ".js": "JavaScript",
    ".jsx": "JSX (React)",
    ".ts": "TypeScript",
    ".tsx": "TSX (React)",
    ".mjs": "JavaScript (ESM)",
    ".cjs": "JavaScript (CJS)",
    ".vue": "Vue",
    ".svelte": "Svelte",
    # Python
    ".py": "Python",
    ".pyw": "Python",
    ".pyx": "Cython",
    ".pxd": "Cython",
    # Java / JVM
    ".java": "Java",
    ".kt": "Kotlin",
    ".kts": "Kotlin Script",
    ".scala": "Scala",
    ".groovy": "Groovy",
    ".clj": "Clojure",
    # C / C++
    ".c": "C",
    ".h": "C/C++ Header",
    ".cpp": "C++",
    ".cxx": "C++",
    ".cc": "C++",
    ".hpp": "C++ Header",
    ".hxx": "C++ Header",
    # C#
    ".cs": "C#",
    ".csx": "C# Script",
    # Go
    ".go": "Go",
    # Rust
    ".rs": "Rust",
    # Ruby
    ".rb": "Ruby",
    ".erb": "ERB (Ruby)",
    # PHP
    ".php": "PHP",
    ".blade.php": "Blade (PHP)",
    # Swift / Objective-C
    ".swift": "Swift",
    ".m": "Objective-C",
    ".mm": "Objective-C++",
    # Dart / Flutter
    ".dart": "Dart",
    # Shell
    ".sh": "Shell (Bash)",
    ".bash": "Shell (Bash)",
    ".zsh": "Zsh",
    ".fish": "Fish",
    ".ps1": "PowerShell",
    ".psm1": "PowerShell",
    ".bat": "Batch",
    ".cmd": "Batch",
    # Data / Config
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".toml": "TOML",
    ".xml": "XML",
    ".ini": "INI",
    ".cfg": "Config",
    ".env": "Env",
    ".properties": "Properties",
    # SQL
    ".sql": "SQL",
    # Markdown / Docs
    ".md": "Markdown",
    ".rst": "reStructuredText",
    ".txt": "Plain Text",
    # Lua
    ".lua": "Lua",
    # R
    ".r": "R",
    ".R": "R",
    # Perl
    ".pl": "Perl",
    ".pm": "Perl",
    # Haskell
    ".hs": "Haskell",
    # Elixir / Erlang
    ".ex": "Elixir",
    ".exs": "Elixir Script",
    ".erl": "Erlang",
    # Docker / CI
    "Dockerfile": "Dockerfile",
    "Makefile": "Makefile",
    ".dockerignore": "Docker Config",
    ".gitignore": "Git Config",
    # Terraform / IaC
    ".tf": "Terraform",
    ".tfvars": "Terraform",
    # Jupyter
    ".ipynb": "Jupyter Notebook",
    # Assembly
    ".asm": "Assembly",
    ".s": "Assembly",
    # Zig
    ".zig": "Zig",
    # Nim
    ".nim": "Nim",
    # V
    ".v": "V / Verilog",
}

# Файлы без расширения, определяемые по имени
FILENAME_MAP = {
    "Dockerfile": "Dockerfile",
    "Makefile": "Makefile",
    "Vagrantfile": "Ruby (Vagrant)",
    "Gemfile": "Ruby (Bundler)",
    "Rakefile": "Ruby (Rake)",
    "Procfile": "Procfile",
    "Jenkinsfile": "Groovy (Jenkins)",
    ".gitignore": "Git Config",
    ".dockerignore": "Docker Config",
    ".editorconfig": "EditorConfig",
    ".eslintrc": "ESLint Config",
    ".prettierrc": "Prettier Config",
    "requirements.txt": "pip (Python)",
    "Pipfile": "Pipenv (Python)",
    "pyproject.toml": "Python Project",
    "package.json": "npm (Node.js)",
    "tsconfig.json": "TypeScript Config",
    "docker-compose.yml": "Docker Compose",
    "docker-compose.yaml": "Docker Compose",
    ".env": "Env",
}

# Директории, которые нужно пропустить
SKIP_DIRS = {
    ".git", ".svn", ".hg",
    "node_modules", "__pycache__", ".venv", "venv", "env",
    ".tox", ".mypy_cache", ".pytest_cache",
    "dist", "build", "out", "target", ".next", ".nuxt",
    ".idea", ".vscode", ".vs",
    "vendor", "bower_components",
    "coverage", ".nyc_output",
    "eggs", "*.egg-info",
}

# ─── Однострочные комментарии по языку ─────────────────────────────────────────
COMMENT_PREFIXES = {
    "Python": ("#",),
    "JavaScript": ("//",),
    "TypeScript": ("//",),
    "JSX (React)": ("//",),
    "TSX (React)": ("//",),
    "Java": ("//",),
    "C": ("//",),
    "C++": ("//",),
    "C#": ("//",),
    "Go": ("//",),
    "Rust": ("//",),
    "Ruby": ("#",),
    "PHP": ("//", "#"),
    "Swift": ("//",),
    "Kotlin": ("//",),
    "Dart": ("//",),
    "Shell (Bash)": ("#",),
    "PowerShell": ("#",),
    "YAML": ("#",),
    "TOML": ("#",),
    "SQL": ("--",),
    "Lua": ("--",),
    "R": ("#",),
    "Perl": ("#",),
    "Haskell": ("--",),
    "Elixir": ("#",),
    "Makefile": ("#",),
    "Dockerfile": ("#",),
}


def identify_language(filepath: Path) -> str | None:
    """Определяет язык по имени файла или расширению."""
    name = filepath.name

    # Сначала проверяем по полному имени файла
    if name in FILENAME_MAP:
        return FILENAME_MAP[name]

    # Затем по расширению
    ext = filepath.suffix.lower()
    if ext in EXTENSION_MAP:
        return EXTENSION_MAP[ext]

    return None


def count_lines(filepath: Path, language: str) -> dict:
    """Подсчитывает строки кода, пустые и строки комментариев."""
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


def scan_project(root: str) -> dict:
    """Сканирует проект и собирает статистику по языкам."""
    stats = defaultdict(lambda: {"files": 0, "total": 0, "code": 0, "blank": 0, "comment": 0})
    root_path = Path(root).resolve()

    for dirpath, dirnames, filenames in os.walk(root_path):
        # Убираем пропускаемые директории
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

    return dict(stats)


def format_number(n: int) -> str:
    """Форматирует число с разделителями."""
    return f"{n:,}".replace(",", " ")


def print_bar(value: int, max_value: int, width: int = 25) -> str:
    """Генерирует ASCII progress bar."""
    if max_value == 0:
        return " " * width
    filled = int(value / max_value * width)
    return "█" * filled + "░" * (width - filled)


def print_stats(stats: dict, root: str) -> None:
    """Выводит красивую статистику в консоль."""
    if not stats:
        print("  ⚠  Не найдено файлов с известными языками программирования.")
        return

    # Сортировка по количеству строк кода (убывание)
    sorted_langs = sorted(stats.items(), key=lambda x: x[1]["code"], reverse=True)

    total_files = sum(s["files"] for s in stats.values())
    total_code = sum(s["code"] for s in stats.values())
    total_blank = sum(s["blank"] for s in stats.values())
    total_comment = sum(s["comment"] for s in stats.values())
    total_lines = sum(s["total"] for s in stats.values())
    max_code = max(s["code"] for s in stats.values()) if stats else 0

    # Ширина колонки языка
    max_lang_len = max(len(lang) for lang in stats)
    lang_width = max(max_lang_len, 12)

    print()
    print(f"  ╔{'═' * 96}╗")
    print(f"  ║{'🔍  СТАТИСТИКА ЯЗЫКОВ ПРОГРАММИРОВАНИЯ':^96}║")
    print(f"  ╠{'═' * 96}╣")
    print(f"  ║  📁 Проект: {root:<81}║")
    print(f"  ║  📊 Всего языков: {len(stats):<75}║")
    print(f"  ╠{'═' * 96}╣")

    # Заголовок таблицы
    header = (
        f"  ║  {'Язык':<{lang_width}}  │ {'Файлы':>7} │ {'Код':>8} │ "
        f"{'Пустые':>8} │ {'Коммент.':>8} │ {'Всего':>8} │ {'%':>5} │ {'Диаграмма':<25} ║"
    )
    print(header)
    print(f"  ║  {'─' * lang_width}──┼─{'─' * 7}─┼─{'─' * 8}─┼─{'─' * 8}─┼─{'─' * 8}─┼─{'─' * 8}─┼─{'─' * 5}─┼─{'─' * 25}─║")

    for lang, data in sorted_langs:
        pct = (data["code"] / total_code * 100) if total_code > 0 else 0
        bar = print_bar(data["code"], max_code)
        row = (
            f"  ║  {lang:<{lang_width}}  │ {format_number(data['files']):>7} │ "
            f"{format_number(data['code']):>8} │ {format_number(data['blank']):>8} │ "
            f"{format_number(data['comment']):>8} │ {format_number(data['total']):>8} │ "
            f"{pct:>5.1f} │ {bar} ║"
        )
        print(row)

    # Итого
    print(f"  ║  {'─' * lang_width}──┼─{'─' * 7}─┼─{'─' * 8}─┼─{'─' * 8}─┼─{'─' * 8}─┼─{'─' * 8}─┼─{'─' * 5}─┼─{'─' * 25}─║")
    total_pct = 100.0 if total_code > 0 else 0.0
    total_row = (
        f"  ║  {'ИТОГО':<{lang_width}}  │ {format_number(total_files):>7} │ "
        f"{format_number(total_code):>8} │ {format_number(total_blank):>8} │ "
        f"{format_number(total_comment):>8} │ {format_number(total_lines):>8} │ "
        f"{total_pct:>5.1f} │ {'█' * 25} ║"
    )
    print(total_row)
    print(f"  ╚{'═' * 96}╝")

    # ─── Топ-5 языков по доле кода ─────────────────────────────────────────
    print()
    print("  📈 Топ языков по доле кода:")
    print()
    top = sorted_langs[:5]
    for i, (lang, data) in enumerate(top, 1):
        pct = (data["code"] / total_code * 100) if total_code > 0 else 0
        emoji = ["🥇", "🥈", "🥉", "  4.", "  5."][i - 1]
        bar_width = int(pct / 2)
        print(f"    {emoji} {lang:<20} {pct:>5.1f}%  {'▓' * bar_width}")

    print()


def main():
    parser = argparse.ArgumentParser(
        description="🔍 Анализатор языков программирования в проекте"
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Путь к корню проекта (по умолчанию: текущая директория)"
    )
    args = parser.parse_args()

    root = os.path.abspath(args.path)
    if not os.path.isdir(root):
        print(f"  ❌ Ошибка: '{root}' не является директорией.")
        sys.exit(1)

    print(f"\n  ⏳ Сканирование проекта: {root} ...")
    stats = scan_project(root)
    print_stats(stats, root)


if __name__ == "__main__":
    main()
