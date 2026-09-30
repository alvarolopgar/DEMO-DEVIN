"""Utilidades compartidas del flujo SDD: lectura de specs, tests y trazabilidad."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SPECS_DIR = REPO_ROOT / "specs"

AC_ID = r"AC-\d{3}-\d{2}[a-z]?"
REQ_ID = r"REQ-\d{3}-\d{2}"
UI_ID = r"UI-\d{3}-\d{2}"

AC_RE = re.compile(AC_ID)
REQ_RE = re.compile(REQ_ID)
UI_RE = re.compile(UI_ID)
AC_HEADING_RE = re.compile(rf"^###\s+({AC_ID})\s+[–-]\s+(.+?)\s*$", re.MULTILINE)
REQ_ROW_RE = re.compile(rf"^\|\s*({REQ_ID})\s*\|\s*(.+?)\s*\|\s*$", re.MULTILINE)
UI_ROW_RE = re.compile(rf"^\|\s*({UI_ID})\s*\|\s*([^|]+?)\s*\|[^|]*\|\s*([^|]*?)\s*\|\s*$", re.MULTILINE)
FRONT_MATTER_RE = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)

CS_TRAIT_RE = re.compile(r'\[Trait\("(AC|REQ)",\s*"([^"]+)"\)\]')
CS_METHOD_RE = re.compile(r"public\s+(?:async\s+)?[\w<>\[\],\s]+?\s+(\w+)\s*\(")
CS_CLASS_RE = re.compile(r"\bclass\s+(\w+)")
TS_TITLE_RE = re.compile(rf"""(["'`])({AC_ID})\b((?:(?!\1)[^\n])*)\1""")

BACKEND_TEST_GLOB = "backend/tests/**/*.cs"
FRONTEND_TEST_GLOBS = ("src/**/*.test.ts", "src/**/*.test.tsx")


@dataclass
class AcceptanceCriterion:
    id: str
    title: str
    reqs: list[str]


@dataclass
class Spec:
    dir: Path
    front_matter: dict[str, object]
    reqs: dict[str, str]
    acs: dict[str, AcceptanceCriterion]
    referenced_acs: set[str]
    uis: dict[str, tuple[str, list[str]]]

    @property
    def id(self) -> str:
        return self.dir.name

    @property
    def number(self) -> str:
        return self.id.split("-", 1)[0]


@dataclass
class TestCase:
    file: str
    name: str
    acs: set[str] = field(default_factory=set)
    reqs: set[str] = field(default_factory=set)

    @property
    def label(self) -> str:
        return f"`{self.file}` › {self.name}"


def _parse_front_matter(text: str) -> dict[str, object]:
    match = FRONT_MATTER_RE.match(text)
    result: dict[str, object] = {}
    if not match:
        return result
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, raw = line.split(":", 1)
        raw = raw.strip()
        if raw.startswith("["):
            result[key.strip()] = json.loads(raw)
        else:
            result[key.strip()] = raw.strip('"')
    return result


def parse_spec(spec_dir: Path) -> Spec:
    text = (spec_dir / "spec.md").read_text(encoding="utf-8")
    acs: dict[str, AcceptanceCriterion] = {}
    headings = list(AC_HEADING_RE.finditer(text))
    for index, match in enumerate(headings):
        end = headings[index + 1].start() if index + 1 < len(headings) else len(text)
        body = text[match.end():end]
        req_line = next((line for line in body.splitlines() if line.startswith("REQ:")), "")
        acs[match.group(1)] = AcceptanceCriterion(match.group(1), match.group(2), REQ_RE.findall(req_line))
    uis = {
        m.group(1): (m.group(2), AC_RE.findall(m.group(3)))
        for m in UI_ROW_RE.finditer(text)
    }
    return Spec(
        dir=spec_dir,
        front_matter=_parse_front_matter(text),
        reqs={m.group(1): m.group(2) for m in REQ_ROW_RE.finditer(text)},
        acs=acs,
        referenced_acs=set(AC_RE.findall(text)),
        uis=uis,
    )


def load_specs() -> list[Spec]:
    return [parse_spec(p.parent) for p in sorted(SPECS_DIR.glob("*/spec.md"))]


def load_trace_map(spec: Spec) -> dict[str, object]:
    path = spec.dir / "trace-map.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _relative(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def collect_backend_tests() -> list[TestCase]:
    tests: list[TestCase] = []
    for path in sorted(REPO_ROOT.glob(BACKEND_TEST_GLOB)):
        if "/bin/" in path.as_posix() or "/obj/" in path.as_posix():
            continue
        text = path.read_text(encoding="utf-8")
        class_match = CS_CLASS_RE.search(text)
        class_name = class_match.group(1) if class_match else path.stem
        pending = TestCase(_relative(path), "")
        for line in text.splitlines():
            for kind, value in CS_TRAIT_RE.findall(line):
                (pending.acs if kind == "AC" else pending.reqs).add(value)
            method = CS_METHOD_RE.search(line)
            if method and (pending.acs or pending.reqs):
                pending.name = f"{class_name}.{method.group(1)}"
                tests.append(pending)
                pending = TestCase(_relative(path), "")
    return tests


def collect_frontend_tests() -> list[TestCase]:
    tests: list[TestCase] = []
    for pattern in FRONTEND_TEST_GLOBS:
        for path in sorted(REPO_ROOT.glob(pattern)):
            text = path.read_text(encoding="utf-8")
            for match in TS_TITLE_RE.finditer(text):
                title = f"{match.group(2)}{match.group(3)}"
                tests.append(TestCase(_relative(path), title, set(AC_RE.findall(title))))
    return tests


def collect_tests() -> list[TestCase]:
    return collect_backend_tests() + collect_frontend_tests()


def ac_mentions_in_tests() -> dict[str, set[str]]:
    """Todas las apariciones de IDs AC en ficheros de test (atributos, títulos y comentarios)."""
    mentions: dict[str, set[str]] = {}
    paths = [p for p in REPO_ROOT.glob(BACKEND_TEST_GLOB) if "/bin/" not in p.as_posix() and "/obj/" not in p.as_posix()]
    for pattern in FRONTEND_TEST_GLOBS:
        paths.extend(REPO_ROOT.glob(pattern))
    for path in sorted(paths):
        for ac in AC_RE.findall(path.read_text(encoding="utf-8")):
            mentions.setdefault(ac, set()).add(_relative(path))
    return mentions
