import { FormErrors } from "@/types/claim";

export function validateClaimForm(values: {
  policyNumber: string;
  claimDate: string;
  vehiclePlate: string;
  insuredName: string;
  phone: string;
  address: string;
  postalCode: string;
  description: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!values.policyNumber.trim()) {
    errors.policyNumber = "El número de póliza es obligatorio.";
  }

  if (!values.claimDate) {
    errors.claimDate = "La fecha del siniestro es obligatoria.";
  } else {
    const selectedDate = new Date(values.claimDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      errors.claimDate = "La fecha del siniestro no puede ser futura.";
    }
  }

  if (!values.vehiclePlate.trim()) {
    errors.vehiclePlate = "La matrícula del vehículo es obligatoria.";
  }

  if (!values.insuredName.trim()) {
    errors.insuredName = "El nombre del asegurado es obligatorio.";
  }

  if (!values.phone.trim()) {
    errors.phone = "El teléfono es obligatorio.";
  }

  if (!values.address.trim()) {
    errors.address = "La dirección es obligatoria.";
  }

  if (!values.postalCode.trim()) {
    errors.postalCode = "El código postal es obligatorio.";
  } else if (!/^\d{5}$/.test(values.postalCode)) {
    errors.postalCode = "El código postal debe tener exactamente 5 dígitos.";
  }

  if (!values.description.trim()) {
    errors.description = "La descripción es obligatoria.";
  }

  return errors;
}
