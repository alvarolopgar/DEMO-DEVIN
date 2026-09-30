#!/usr/bin/env python3
"""Gate SDD `spec-conformance`.

Comprobaciones:
  (a) Un cambio en backend/** o src/** debe ir acompañado de un cambio en specs/** (solo con --base).
  (b) Cada AC de cada spec.md "en implementación" tiene >= 1 test y ningún test referencia un AC
      inexistente. Una spec está "en implementación" cuando su trace-map.json mapea rutas de código
      ("code" no vacío) o algún test ya cita uno de sus AC; hasta entonces es una spec previa al
      desarrollo y no se exige test por AC (ver C-002-10).
      También: cada REQ tiene >= 1 AC, cada AC referencia REQ existentes y cada spec tiene plan.md.
  (c) Lint de specs/*/contracts/openapi.yaml con Redocly (recommended-strict).
  (d) traceability.md regenerado coincide con el commiteado.

Uso:
  python3 scripts/sdd/check_spec_conformance.py [--base origin/<rama>] [--skip-openapi-lint]
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys

from sdd_lib import REPO_ROOT, SPECS_DIR, ac_mentions_in_tests, collect_tests, load_specs, load_trace_map

CODE_PREFIXES = ("backend/", "src/")


def changed_files(base: str) -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base}...HEAD"],
        cwd=REPO_ROOT, capture_output=True, text=True, check=True,
    )
    return [line for line in result.stdout.splitlines() if line]


def check_spec_changed(base: str) -> list[str]:
    files = changed_files(base)
    code = [f for f in files if f.startswith(CODE_PREFIXES)]
    specs = [f for f in files if f.startswith("specs/")]
    if code and not specs:
        return [
            "El PR cambia código sin cambiar ninguna spec en specs/ (Art. 1 de la constitución). "
            f"Ficheros de código: {', '.join(code[:10])}{' …' if len(code) > 10 else ''}"
        ]
    return []


def check_acceptance_coverage() -> list[str]:
    errors: list[str] = []
    specs = load_specs()
    if not specs:
        return ["No hay ninguna spec en specs/*/spec.md"]

    defined: set[str] = set()
    for spec in specs:
        defined.update(spec.acs)
        if not (spec.dir / "plan.md").exists():
            errors.append(f"{spec.id}: falta plan.md")
        for ac in sorted(spec.referenced_acs - set(spec.acs)):
            errors.append(f"{spec.id}: spec.md referencia {ac}, que no está definido como '### {ac} – …'")
        for ac in spec.acs.values():
            if not ac.reqs:
                errors.append(f"{spec.id}: {ac.id} no indica ningún REQ")
            for req in ac.reqs:
                if req not in spec.reqs:
                    errors.append(f"{spec.id}: {ac.id} referencia {req}, que no existe")
        covered_reqs = {req for ac in spec.acs.values() for req in ac.reqs}
        for req in spec.reqs:
            if req not in covered_reqs:
                errors.append(f"{spec.id}: {req} no tiene ningún AC")
        for req, paths in load_trace_map(spec).get("code", {}).items():
            if req not in spec.reqs:
                errors.append(f"{spec.id}/trace-map.json: {req} no existe en spec.md")
            for path in paths:
                if not (REPO_ROOT / path).exists():
                    errors.append(f"{spec.id}/trace-map.json: {path} no existe")

    tests = collect_tests()
    tested = {ac for t in tests for ac in t.acs}
    under_implementation: set[str] = set()
    for spec in specs:
        spec_acs = set(spec.acs)
        if load_trace_map(spec).get("code") or spec_acs & tested:
            under_implementation.update(spec_acs)
    for ac in sorted((defined & under_implementation) - tested):
        errors.append(f"{ac} no tiene ningún test asociado")

    for ac, files in sorted(ac_mentions_in_tests().items()):
        if ac not in defined:
            errors.append(f"{ac} aparece en tests ({', '.join(sorted(files))}) pero no existe en ninguna spec.md")

    all_reqs = {req for spec in specs for req in spec.reqs}
    for test in tests:
        for req in sorted(test.reqs - all_reqs):
            errors.append(f"{test.label} referencia {req}, que no existe")
    return errors


def lint_openapi() -> list[str]:
    contracts = sorted(SPECS_DIR.glob("*/contracts/openapi.yaml"))
    if not contracts:
        return []
    command = ["npx", "--no-install", "redocly", "lint", *[c.relative_to(REPO_ROOT).as_posix() for c in contracts]]
    env = {**os.environ, "REDOCLY_SUPPRESS_UPDATE_NOTICE": "true", "REDOCLY_TELEMETRY": "off"}
    result = subprocess.run(command, cwd=REPO_ROOT, capture_output=True, text=True, env=env)
    output = (result.stdout + result.stderr).strip()
    print(output)
    return [] if result.returncode == 0 else ["redocly lint falló para los contratos OpenAPI"]


def check_traceability() -> list[str]:
    result = subprocess.run(
        [sys.executable, str(REPO_ROOT / "scripts/sdd/generate_traceability.py"), "--check"],
        cwd=REPO_ROOT, capture_output=True, text=True,
    )
    if result.returncode != 0:
        return [result.stderr.strip() or "traceability.md desactualizado"]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base", help="ref base del PR (p. ej. origin/main) para la comprobación (a)")
    parser.add_argument("--skip-openapi-lint", action="store_true")
    args = parser.parse_args()

    steps = []
    if args.base:
        steps.append(("(a) cambios de código acompañados de spec", lambda: check_spec_changed(args.base)))
    steps.append(("(b) cobertura AC ↔ tests", check_acceptance_coverage))
    if not args.skip_openapi_lint:
        steps.append(("(c) lint OpenAPI", lint_openapi))
    steps.append(("(d) traceability.md al día", check_traceability))

    failed = False
    for name, step in steps:
        errors = step()
        print(f"{'OK  ' if not errors else 'FAIL'} {name}")
        for error in errors:
            print(f"     - {error}")
        failed = failed or bool(errors)

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
