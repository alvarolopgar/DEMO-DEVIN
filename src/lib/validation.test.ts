import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateClaimForm } from "@/lib/validation";

type FormValues = Parameters<typeof validateClaimForm>[0];

const FUTURE_DATE_ERROR = "La fecha del siniestro no puede ser futura.";

function validValues(overrides: Partial<FormValues> = {}): FormValues {
  return {
    policyNumber: "POL-2024-001234",
    claimDate: "2024-01-15",
    vehiclePlate: "1234 ABC",
    insuredName: "Juan García López",
    phone: "612345678",
    address: "Calle Mayor 10, 2ºA",
    postalCode: "28001",
    description: "Colisión en intersección",
    ...overrides,
  };
}

function validateAt(utcNow: string, claimDate: string) {
  vi.setSystemTime(new Date(utcNow));
  return validateClaimForm(validValues({ claimDate }));
}

describe("validateClaimForm – fecha del siniestro en Europe/Madrid", () => {
  const originalTz = process.env.TZ;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTz;
  });

  it("AC-001-06a: rechaza el día siguiente al día actual en Madrid", () => {
    expect(validateAt("2026-01-15T12:00:00Z", "2026-01-16").claimDate).toBe(FUTURE_DATE_ERROR);
    expect(validateAt("2026-07-01T12:00:00Z", "2026-07-02").claimDate).toBe(FUTURE_DATE_ERROR);
  });

  it("AC-001-06a: rechaza mañana (Madrid) aunque el navegador esté en America/New_York", () => {
    process.env.TZ = "America/New_York";
    expect(validateAt("2026-01-15T12:00:00Z", "2026-01-16").claimDate).toBe(FUTURE_DATE_ERROR);
  });

  it("AC-001-06b: acepta hoy justo después de medianoche en Madrid (invierno, UTC+1)", () => {
    expect(validateAt("2026-01-15T23:30:00Z", "2026-01-16").claimDate).toBeUndefined();
  });

  it("AC-001-06c: acepta hoy justo después de medianoche en Madrid (verano, UTC+2)", () => {
    expect(validateAt("2026-06-30T22:30:00Z", "2026-07-01").claimDate).toBeUndefined();
  });

  it("AC-001-06d: a las 23:59:59 de Madrid hoy es válido y mañana es futuro", () => {
    expect(validateAt("2026-01-15T22:59:59Z", "2026-01-15").claimDate).toBeUndefined();
    expect(validateAt("2026-01-15T22:59:59Z", "2026-01-16").claimDate).toBe(FUTURE_DATE_ERROR);
  });

  it("AC-001-06d: a las 00:00:00 de Madrid (verano) hoy es válido y mañana es futuro", () => {
    expect(validateAt("2026-06-30T22:00:00Z", "2026-07-01").claimDate).toBeUndefined();
    expect(validateAt("2026-06-30T22:00:00Z", "2026-07-02").claimDate).toBe(FUTURE_DATE_ERROR);
  });

  it("AC-001-06e: acepta hoy, ayer y fechas pasadas", () => {
    expect(validateAt("2026-01-15T12:00:00Z", "2026-01-15").claimDate).toBeUndefined();
    expect(validateAt("2026-01-15T12:00:00Z", "2026-01-14").claimDate).toBeUndefined();
    expect(validateAt("2026-01-15T12:00:00Z", "2000-01-01").claimDate).toBeUndefined();
  });
});

describe("validateClaimForm – campos y formatos", () => {
  it("AC-001-01: no devuelve errores con datos válidos", () => {
    expect(validateClaimForm(validValues())).toEqual({});
  });

  it.each([
    ["policyNumber", "El número de póliza es obligatorio."],
    ["claimDate", "La fecha del siniestro es obligatoria."],
    ["vehiclePlate", "La matrícula del vehículo es obligatoria."],
    ["insuredName", "El nombre del asegurado es obligatorio."],
    ["phone", "El teléfono es obligatorio."],
    ["address", "La dirección es obligatoria."],
    ["postalCode", "El código postal es obligatorio."],
    ["description", "La descripción es obligatoria."],
  ] as const)("AC-001-04: %s vacío es obligatorio", (field, message) => {
    expect(validateClaimForm(validValues({ [field]: "" }))[field]).toBe(message);
  });

  it.each(["policyNumber", "vehiclePlate", "insuredName", "phone", "address", "description"] as const)(
    "AC-001-05: %s con solo espacios es inválido",
    (field) => {
      expect(validateClaimForm(validValues({ [field]: "   " }))[field]).toBeDefined();
    },
  );

  it.each(["28001", "00000", "08001"])("AC-001-07a: acepta el código postal %s", (postalCode) => {
    expect(validateClaimForm(validValues({ postalCode })).postalCode).toBeUndefined();
  });

  it.each(["1234", "123456", "ABCDE", "28 01", "2800A"])(
    "AC-001-07b: rechaza el código postal %s",
    (postalCode) => {
      expect(validateClaimForm(validValues({ postalCode })).postalCode).toBe(
        "El código postal debe tener exactamente 5 dígitos.",
      );
    },
  );

  it("AC-001-09: devuelve todos los errores a la vez", () => {
    const errors = validateClaimForm({
      policyNumber: "",
      claimDate: "",
      vehiclePlate: "",
      insuredName: "",
      phone: "",
      address: "",
      postalCode: "",
      description: "",
    });
    expect(Object.keys(errors)).toHaveLength(8);
  });
});
