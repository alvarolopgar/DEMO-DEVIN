export enum ClaimStatus {
  Draft = "Draft",
  Submitted = "Submitted",
  UnderReview = "UnderReview",
  Approved = "Approved",
  Rejected = "Rejected",
}

export enum ClaimType {
  Colision = "Colision",
  Robo = "Robo",
  Incendio = "Incendio",
  Cristales = "Cristales",
}

export interface CreateClaimRequest {
  policyNumber: string;
  claimDate: string;
  claimType: ClaimType;
  vehiclePlate: string;
  insuredName: string;
  phone: string;
  address: string;
  postalCode: string;
  description: string;
}

export interface ClaimResponse {
  id: string;
  policyNumber: string;
  claimDate: string;
  claimType: ClaimType;
  vehiclePlate: string;
  insuredName: string;
  phone: string;
  address: string;
  postalCode: string;
  description: string;
  status: ClaimStatus;
  createdAt: string;
}

export interface ValidationProblemDetails {
  title: string;
  status: number;
  detail: string;
  errors: Record<string, string[]>;
}

export interface FormErrors {
  policyNumber?: string;
  claimDate?: string;
  claimType?: string;
  vehiclePlate?: string;
  insuredName?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  description?: string;
}
