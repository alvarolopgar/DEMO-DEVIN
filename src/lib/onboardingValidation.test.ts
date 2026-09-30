import { describe, expect, it } from "vitest";
import {
  isOfAge,
  isValidDni,
  isValidNie,
  normalizeDocumentNumber,
  validateOnboardingForm,
} from "@/lib/onboardingValidation";
import { DocumentType, OnboardingFormValues } from "@/types/onboarding";

// Frontend mirrors the backend rules and messages (NFR-002-06, Art.6 dual validation)

function validValues(overrides: Partial<OnboardingFormValues> = {}): OnboardingFormValues {
  return {
    firstName: "María",
    lastName: "García López",
    documentType: DocumentType.Dni,
    documentNumber: "12345678Z",
    birthDate: "1990-05-12",
    email: "maria.garcia@example.com",
    mobilePhone: "612345678",
    acceptsPrivacyPolicy: true,
    acceptsMarketing: false,
    ...overrides,
  };
}

const TODAY = "2026-09-30";

describe("validateOnboardingForm", () => {
  it("AC-002-01: no devuelve errores con datos válidos", () => {
    expect(validateOnboardingForm(validValues(), TODAY)).toEqual({});
  });

  it.each([
    ["firstName", "El nombre es obligatorio."],
    ["lastName", "Los apellidos son obligatorios."],
    ["documentType", "El tipo de documento es obligatorio."],
    ["documentNumber", "El número de documento es obligatorio."],
    ["birthDate", "La fecha de nacimiento es obligatoria."],
    ["email", "El correo electrónico es obligatorio."],
    ["mobilePhone", "El teléfono móvil es obligatorio."],
  ] as const)("AC-002-04: %s sin informar es obligatorio", (field, message) => {
    const errors = validateOnboardingForm(validValues({ [field]: "" }), TODAY);
    expect(errors[field]).toBe(message);
  });

  it("AC-002-05: un texto con solo espacios se considera no informado", () => {
    const errors = validateOnboardingForm(validValues({ firstName: "   " }), TODAY);
    expect(errors.firstName).toBe("El nombre es obligatorio.");
  });

  it("AC-002-06a: quien cumple 18 hoy puede darse de alta", () => {
    const errors = validateOnboardingForm(
      validValues({ birthDate: "2008-09-30" }),
      TODAY,
    );
    expect(errors.birthDate).toBeUndefined();
  });

  it("AC-002-06b: quien cumple 18 mañana no puede darse de alta", () => {
    const errors = validateOnboardingForm(
      validValues({ birthDate: "2008-10-01" }),
      TODAY,
    );
    expect(errors.birthDate).toBe("Debes ser mayor de edad para darte de alta.");
  });

  it.each(["2015-01-01", "2027-01-01"])(
    "AC-002-06c: rechaza la fecha %s por ser menor de edad",
    (birthDate) => {
      const errors = validateOnboardingForm(validValues({ birthDate }), TODAY);
      expect(errors.birthDate).toBe("Debes ser mayor de edad para darte de alta.");
    },
  );

  it("AC-002-06d: nacido 29-feb cumple 18 el 28-feb de año no bisiesto", () => {
    expect(
      validateOnboardingForm(validValues({ birthDate: "2008-02-29" }), "2026-02-28").birthDate,
    ).toBeUndefined();
    expect(
      validateOnboardingForm(validValues({ birthDate: "2008-02-29" }), "2026-02-27").birthDate,
    ).toBe("Debes ser mayor de edad para darte de alta.");
  });

  it.each(["12345678Z", "00000001R", "87654321X"])(
    "AC-002-07a: acepta el DNI %s",
    (documentNumber) => {
      const errors = validateOnboardingForm(validValues({ documentNumber }), TODAY);
      expect(errors.documentNumber).toBeUndefined();
    },
  );

  it("AC-002-07b: rechaza DNI con letra de control incorrecta", () => {
    const errors = validateOnboardingForm(
      validValues({ documentNumber: "12345678A" }),
      TODAY,
    );
    expect(errors.documentNumber).toBe("El número de documento no es válido.");
  });

  it.each(["1234567", "123456789", "12345678", "1234567Z", "1234A678Z", "123456780"])(
    "AC-002-07c: rechaza el DNI %s con formato inválido",
    (documentNumber) => {
      const errors = validateOnboardingForm(validValues({ documentNumber }), TODAY);
      expect(errors.documentNumber).toBe("El número de documento no es válido.");
    },
  );

  it.each(["X1234567L", "Z9876543A"])("AC-002-08a: acepta el NIE %s", (documentNumber) => {
    const errors = validateOnboardingForm(
      validValues({ documentType: DocumentType.Nie, documentNumber }),
      TODAY,
    );
    expect(errors.documentNumber).toBeUndefined();
  });

  it.each(["W1234567L", "X1234567A", "X123456L", "X12345678"])(
    "AC-002-08b: rechaza el NIE %s",
    (documentNumber) => {
      const errors = validateOnboardingForm(
        validValues({ documentType: DocumentType.Nie, documentNumber }),
        TODAY,
      );
      expect(errors.documentNumber).toBe("El número de documento no es válido.");
    },
  );

  it.each(["PAA123456", "AA-123456-B"])(
    "AC-002-09: el pasaporte %s no exige validación formal",
    (documentNumber) => {
      const errors = validateOnboardingForm(
        validValues({ documentType: DocumentType.Pasaporte, documentNumber }),
        TODAY,
      );
      expect(errors.documentNumber).toBeUndefined();
    },
  );

  it.each(["12345678z", "12345678 Z", "12345678-Z", "12345678Z "])(
    "AC-002-10: %s se normaliza antes de validar",
    (documentNumber) => {
      const errors = validateOnboardingForm(validValues({ documentNumber }), TODAY);
      expect(errors.documentNumber).toBeUndefined();
    },
  );

  it.each(["cliente@example.com", "nombre.apellido@banco.es", "cliente+tag@dominio.io"])(
    "AC-002-11a: acepta el correo %s",
    (email) => {
      const errors = validateOnboardingForm(validValues({ email }), TODAY);
      expect(errors.email).toBeUndefined();
    },
  );

  it.each(["cliente", "cliente@", "@dominio.com", "cliente@dominio", "cliente dominio.es"])(
    "AC-002-11b: rechaza el correo %s",
    (email) => {
      const errors = validateOnboardingForm(validValues({ email }), TODAY);
      expect(errors.email).toBe("El correo electrónico no es válido.");
    },
  );

  it.each(["612345678", "700123456"])(
    "AC-002-12a: acepta el móvil %s",
    (mobilePhone) => {
      const errors = validateOnboardingForm(validValues({ mobilePhone }), TODAY);
      expect(errors.mobilePhone).toBeUndefined();
    },
  );

  it.each(["512345678", "912345678", "61234567", "6123456789", "+34612345678", "61 234 56 78"])(
    "AC-002-12b: rechaza el móvil %s",
    (mobilePhone) => {
      const errors = validateOnboardingForm(validValues({ mobilePhone }), TODAY);
      expect(errors.mobilePhone).toBe(
        "El teléfono móvil debe tener 9 dígitos y empezar por 6 o 7.",
      );
    },
  );

  it("AC-002-13a: rechaza el envío sin aceptar la política de datos", () => {
    const errors = validateOnboardingForm(
      validValues({ acceptsPrivacyPolicy: false }),
      TODAY,
    );
    expect(errors.acceptsPrivacyPolicy).toBe(
      "Debes aceptar la política de protección de datos.",
    );
  });

  it("AC-002-14: devuelve todos los errores a la vez", () => {
    const errors = validateOnboardingForm(
      validValues({ firstName: "", lastName: " ", documentNumber: "", email: "cliente" }),
      TODAY,
    );
    expect(errors.firstName).toBe("El nombre es obligatorio.");
    expect(errors.lastName).toBe("Los apellidos son obligatorios.");
    expect(errors.documentNumber).toBe("El número de documento es obligatorio.");
    expect(errors.email).toBe("El correo electrónico no es válido.");
    expect(Object.keys(errors).length).toBeGreaterThanOrEqual(4);
  });
});

describe("document helpers", () => {
  it("normaliza espacios, guiones y minúsculas", () => {
    expect(normalizeDocumentNumber("  x-1234567 l ")).toBe("X1234567L");
  });

  it("isValidDni comprueba letra de control", () => {
    expect(isValidDni("12345678Z")).toBe(true);
    expect(isValidDni("12345678A")).toBe(false);
  });

  it("isValidNie aplica el prefijo X/Y/Z como 0/1/2", () => {
    expect(isValidNie("X1234567L")).toBe(true);
    expect(isValidNie("Y1234567L")).toBe(false);
  });

  it("isOfAge cumple años (29-feb → 28-feb)", () => {
    expect(isOfAge("2008-02-29", "2026-02-28")).toBe(true);
    expect(isOfAge("2008-02-29", "2026-02-27")).toBe(false);
  });
});
