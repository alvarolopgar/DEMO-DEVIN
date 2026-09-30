import { businessToday } from "@/lib/businessDate";
import {
  DocumentType,
  OnboardingFormErrors,
  OnboardingFormValues,
} from "@/types/onboarding";

// Spanish ID documents: DNI/NIE control-letter check (mod 23)
const CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

export function normalizeDocumentNumber(documentNumber: string): string {
  return documentNumber.replace(/[\s-]/g, "").toUpperCase();
}

export function isValidDni(normalized: string): boolean {
  if (!/^\d{8}[A-Z]$/.test(normalized)) {
    return false;
  }
  const number = parseInt(normalized.slice(0, 8), 10);
  return normalized[8] === CONTROL_LETTERS[number % 23];
}

export function isValidNie(normalized: string): boolean {
  if (!/^[XYZ]\d{7}[A-Z]$/.test(normalized)) {
    return false;
  }
  const prefix = { X: "0", Y: "1", Z: "2" }[normalized[0]];
  const number = parseInt(prefix + normalized.slice(1, 8), 10);
  return normalized[8] === CONTROL_LETTERS[number % 23];
}

export function isOfAge(birthDateIso: string, todayIso: string): boolean {
  const [y, m, d] = birthDateIso.split("-").map(Number);
  const annivYear = y + 18;
  const daysInMonth = new Date(annivYear, m, 0).getDate();
  const annivDay = Math.min(d, daysInMonth);
  const anniv = `${annivYear}-${String(m).padStart(2, "0")}-${String(annivDay).padStart(2, "0")}`;
  return anniv <= todayIso;
}

// Mirrors SubmitOnboardingValidator (backend): same rules and same messages (NFR-002-06)
export function validateOnboardingForm(
  values: OnboardingFormValues,
  todayIso: string = businessToday(),
): OnboardingFormErrors {
  const errors: OnboardingFormErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "El nombre es obligatorio.";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "Los apellidos son obligatorios.";
  }
  if (!values.documentType) {
    errors.documentType = "El tipo de documento es obligatorio.";
  }
  if (!values.documentNumber.trim()) {
    errors.documentNumber = "El número de documento es obligatorio.";
  } else if (values.documentType) {
    const normalized = normalizeDocumentNumber(values.documentNumber);
    const valid =
      values.documentType === DocumentType.Dni
        ? isValidDni(normalized)
        : values.documentType === DocumentType.Nie
          ? isValidNie(normalized)
          : normalized.length > 0;
    if (!valid) {
      errors.documentNumber = "El número de documento no es válido.";
    }
  }
  if (!values.birthDate) {
    errors.birthDate = "La fecha de nacimiento es obligatoria.";
  } else if (!isOfAge(values.birthDate, todayIso)) {
    errors.birthDate = "Debes ser mayor de edad para darte de alta.";
  }
  if (!values.email.trim()) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) {
    errors.email = "El correo electrónico no es válido.";
  }
  if (!values.mobilePhone.trim()) {
    errors.mobilePhone = "El teléfono móvil es obligatorio.";
  } else if (!/^[67]\d{8}$/.test(values.mobilePhone.trim())) {
    errors.mobilePhone = "El teléfono móvil debe tener 9 dígitos y empezar por 6 o 7.";
  }
  if (!values.acceptsPrivacyPolicy) {
    errors.acceptsPrivacyPolicy = "Debes aceptar la política de protección de datos.";
  }

  return errors;
}
