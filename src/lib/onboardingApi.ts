import { ApiError } from "@/lib/api";
import { OnboardingResponse, SaveOnboardingDraftRequest } from "@/types/onboarding";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const BASE_PATH = `${API_BASE_URL}/onboarding-requests`;

type HttpMethod = "GET" | "POST" | "PATCH";

interface ValidationProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  errors?: {
    validationErrors?: string[];
    [key: string]: string[] | undefined;
  };
}

async function request(
  path: string,
  method: HttpMethod,
  body?: unknown,
): Promise<OnboardingResponse> {
  const response = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : null,
  });

  if (response.ok) {
    return response.json();
  }

  let detail = "Error inesperado al procesar la solicitud.";
  let validationErrors: string[] | undefined;
  try {
    const problem = (await response.json()) as ValidationProblemDetails;
    validationErrors = problem.errors?.validationErrors;
    if (validationErrors && validationErrors.length > 0) {
      detail = validationErrors[0];
    } else if (problem.detail) {
      detail = problem.detail;
    }
  } catch {
    // keep the generic message when the body isn't ProblemDetails JSON
  }

  throw new ApiError(detail, response.status, validationErrors);
}

export async function createOnboardingDraft(
  draft: SaveOnboardingDraftRequest,
): Promise<OnboardingResponse> {
  return request(BASE_PATH, "POST", draft);
}

export async function getOnboardingRequest(id: string): Promise<OnboardingResponse> {
  return request(`${BASE_PATH}/${id}`, "GET");
}

export async function updateOnboardingDraft(
  id: string,
  draft: SaveOnboardingDraftRequest,
): Promise<OnboardingResponse> {
  return request(`${BASE_PATH}/${id}`, "PATCH", draft);
}

export async function submitOnboardingRequest(id: string): Promise<OnboardingResponse> {
  return request(`${BASE_PATH}/${id}/submit`, "POST");
}

export async function verifyOnboardingRequest(id: string): Promise<OnboardingResponse> {
  return request(`${BASE_PATH}/${id}/verify`, "POST");
}

export async function completeOnboardingRequest(id: string): Promise<OnboardingResponse> {
  return request(`${BASE_PATH}/${id}/complete`, "POST");
}
