// Types mirroring the onboarding contract (specs/002-alta-digital-cliente/contracts/openapi.yaml)

export enum DocumentType {
  Dni = "Dni",
  Nie = "Nie",
  Pasaporte = "Pasaporte",
}

export enum OnboardingStatus {
  Borrador = "Borrador",
  PendienteVerificacion = "PendienteVerificacion",
  Verificada = "Verificada",
  Rechazada = "Rechazada",
  ClienteCreado = "ClienteCreado",
  Caducada = "Caducada",
}

export interface SaveOnboardingDraftRequest {
  firstName?: string;
  lastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  birthDate?: string;
  email?: string;
  mobilePhone?: string;
  acceptsPrivacyPolicy?: boolean;
  acceptsMarketing?: boolean;
}

export interface OnboardingResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  birthDate?: string;
  email?: string;
  mobilePhone?: string;
  acceptsPrivacyPolicy?: boolean;
  acceptsMarketing: boolean;
  status: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  verifiedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
}

export interface OnboardingFormValues {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  email: string;
  mobilePhone: string;
  acceptsPrivacyPolicy: boolean;
  acceptsMarketing: boolean;
}

export interface OnboardingFormErrors {
  firstName?: string;
  lastName?: string;
  documentType?: string;
  documentNumber?: string;
  birthDate?: string;
  email?: string;
  mobilePhone?: string;
  acceptsPrivacyPolicy?: string;
}
