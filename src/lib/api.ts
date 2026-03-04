import { CreateClaimRequest, ClaimResponse, ValidationProblemDetails } from "@/types/claim";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5284/api";

export class ApiError extends Error {
  public status: number;
  public validationErrors: string[];

  constructor(message: string, status: number, validationErrors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

export async function createClaim(request: CreateClaimRequest): Promise<ClaimResponse> {
  const response = await fetch(`${API_BASE_URL}/claims`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const problemDetails: ValidationProblemDetails = await response.json();
      const errors = problemDetails.errors?.validationErrors || [];
      throw new ApiError(
        problemDetails.detail || "Error de validación",
        response.status,
        errors
      );
    }
    throw new ApiError("Error al crear el siniestro", response.status);
  }

  return response.json();
}
