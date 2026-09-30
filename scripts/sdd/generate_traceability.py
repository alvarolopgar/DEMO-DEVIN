#!/usr/bin/env python3
"""Genera specs/<id>/traceability.md a partir de spec.md, trace-map.json y los tests etiquetados.

Uso:
  python3 scripts/sdd/generate_traceability.py          # escribe los ficheros
  python3 scripts/sdd/generate_traceability.py --check  # falla si difieren de lo commiteado
"""

from __future__ import annotations

import argparse
import sys

from sdd_lib import REPO_ROOT, Spec, TestCase, collect_tests, load_specs, load_trace_map

HEADER = "<!-- GENERADO por scripts/sdd/generate_traceability.py – NO EDITAR A MANO -->"


def _join(items: list[str], empty: str = "—") -> str:
    return "<br>".join(items) if items else empty


def render(spec: Spec, tests: list[TestCase]) -> str:
    trace = load_trace_map(spec)
    jira_cfg = trace.get("jira", {})
    jira_base = str(trace.get("jiraBaseUrl", ""))
    code_cfg = trace.get("code", {})
    figma_cfg = trace.get("figma", {})
    figma_url = str(figma_cfg.get("fileUrl", ""))
    frames = figma_cfg.get("frames", {})

    has_jira = bool(jira_base or jira_cfg.get("default") or jira_cfg.get("byReq"))
    story = str(spec.front_matter.get("jira", "") or spec.id)
    aliases = [str(a) for a in spec.front_matter.get("jira_aliases", [])]
    title = str(spec.front_matter.get("title", spec.id))

    tests_by_ac: dict[str, list[TestCase]] = {ac: [] for ac in spec.acs}
    for test in tests:
        for ac in sorted(test.acs):
            if ac in tests_by_ac:
                tests_by_ac[ac].append(test)

    acs_by_req: dict[str, list[str]] = {req: [] for req in spec.reqs}
    for ac in spec.acs.values():
        for req in ac.reqs:
            acs_by_req.setdefault(req, []).append(ac.id)

    def jira_link(key: str) -> str:
        return f"[{key}]({jira_base}{key})" if jira_base else key

    def figma_link(ui: str) -> str:
        node = frames.get(ui)
        return f"[{ui}]({figma_url}?node-id={node})" if node and figma_url else ui

    lines = [
        HEADER,
        f"# Trazabilidad – {spec.id} {title} ({story})",
        "",
        f"Historia canónica: **{story}**" + (f" (alias Jira: {', '.join(jira_link(a) for a in aliases)})" if aliases else "") + ".",
        f"Fuentes: `spec.md` (REQ, AC, UI), `trace-map.json` (código{', Jira' if has_jira else ''}, Figma) y los tests etiquetados",
        "(`[Trait(\"AC\", ...)]` en xUnit, títulos `AC-xxx-yy: ...` en Vitest).",
        "",
        f"## REQ → AC → Test → Código{' → Jira' if has_jira else ''} → Figma",
        "",
        f"| REQ | Requisito | AC | Nº tests | Código{' | Jira' if has_jira else ''} | Figma |",
        "|---|---|---|---|---|---|" + ("---|" if has_jira else ""),
    ]
    for req, text in spec.reqs.items():
        acs = acs_by_req.get(req, [])
        n_tests = len({t.label for ac in acs for t in tests_by_ac.get(ac, [])})
        code = [f"`{p}`" for p in code_cfg.get(req, [])]
        uis = sorted(ui for ui, (_, ui_acs) in spec.uis.items() if set(ui_acs) & set(acs))
        row = f"| {req} | {text} | {_join(acs)} | {n_tests} | {_join(code)} |"
        if has_jira:
            jira = [jira_link(k) for k in [*jira_cfg.get("default", []), *jira_cfg.get("byReq", {}).get(req, [])]]
            row += f" {_join(jira)} |"
        lines.append(f"{row} {_join([figma_link(u) for u in uis])} |")

    lines += ["", "## AC → Tests", "", "| AC | Título | REQ | Nº tests | Tests |", "|---|---|---|---|---|"]
    for ac_id, ac in spec.acs.items():
        labels = sorted({t.label for t in tests_by_ac[ac_id]})
        lines.append(f"| {ac_id} | {ac.title} | {', '.join(ac.reqs)} | {len(labels)} | {_join(labels, '**SIN TEST**')} |")

    lines += ["", "## UI → Figma", "", "| UI | Estado | AC | Frame Figma |", "|---|---|---|---|"]
    for ui, (state, ui_acs) in spec.uis.items():
        node = frames.get(ui)
        frame = f"[{ui} {state}]({figma_url}?node-id={node})" if node and figma_url else "—"
        lines.append(f"| {ui} | {state} | {', '.join(ui_acs)} | {frame} |")

    total = sum(len(v) for v in tests_by_ac.values())
    covered = sum(1 for v in tests_by_ac.values() if v)
    lines += [
        "",
        "## Resumen",
        "",
        f"- REQ: {len(spec.reqs)} · AC: {len(spec.acs)} · AC con ≥ 1 test: {covered}/{len(spec.acs)}",
        f"- Enlaces AC → test: {total}",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="no escribe; falla si el fichero commiteado difiere")
    args = parser.parse_args()

    tests = collect_tests()
    stale: list[str] = []
    for spec in load_specs():
        target = spec.dir / "traceability.md"
        content = render(spec, tests)
        current = target.read_text(encoding="utf-8") if target.exists() else None
        if args.check:
            if current != content:
                stale.append(target.relative_to(REPO_ROOT).as_posix())
        elif current != content:
            target.write_text(content, encoding="utf-8")
            print(f"actualizado {target.relative_to(REPO_ROOT)}")

    if stale:
        print("traceability.md desactualizado (ejecuta python3 scripts/sdd/generate_traceability.py):", file=sys.stderr)
        for path in stale:
            print(f"  - {path}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
