import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import OnboardingForm from "@/components/OnboardingForm";
import { ApiError } from "@/lib/api";
import {
  createOnboardingDraft,
  getOnboardingRequest,
  submitOnboardingRequest,
} from "@/lib/onboardingApi";
import {
  DocumentType,
  OnboardingResponse,
  OnboardingStatus,
} from "@/types/onboarding";

vi.mock("@/lib/onboardingApi", () => ({
  createOnboardingDraft: vi.fn(),
  getOnboardingRequest: vi.fn(),
  submitOnboardingRequest: vi.fn(),
}));

const createDraftMock = vi.mocked(createOnboardingDraft);
const getRequestMock = vi.mocked(getOnboardingRequest);
const submitMock = vi.mocked(submitOnboardingRequest);

function response(status: OnboardingStatus, overrides = {}): OnboardingResponse {
  return {
    id: "req-1234",
    firstName: "María",
    lastName: "García López",
    documentType: DocumentType.Dni,
    documentNumber: "12345678Z",
    birthDate: "1990-05-12",
    email: "maria.garcia@example.com",
    mobilePhone: "612345678",
    acceptsPrivacyPolicy: true,
    acceptsMarketing: false,
    status,
    createdAt: "2026-09-30T10:00:00Z",
    updatedAt: "2026-09-30T10:00:00Z",
    ...overrides,
  };
}

function renderForm() {
  render(
    <FluentProvider theme={webLightTheme}>
      <OnboardingForm />
    </FluentProvider>,
  );
}

function type(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValidForm() {
  type(/^Nombre/, "María");
  type(/Apellidos/, "García López");
  type(/Fecha de nacimiento/, "1990-05-12");
  type(/Número de documento/, "12345678Z");
  type(/Correo electrónico/, "maria.garcia@example.com");
  type(/Teléfono móvil/, "612345678");

  fireEvent.click(screen.getByRole("combobox", { name: /Tipo de documento/ }));
  fireEvent.click(screen.getByRole("option", { name: "DNI" }));

  fireEvent.click(
    screen.getByRole("checkbox", { name: /política de protección de datos/ }),
  );
}

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.history.pushState({}, "", "/onboarding/new");
  });

  afterEach(() => {
    cleanup();
  });

  it("AC-002-20: muestra los errores junto a cada campo sin llamar al servicio", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    expect(screen.getByText("El nombre es obligatorio.")).toBeTruthy();
    expect(screen.getByText("Los apellidos son obligatorios.")).toBeTruthy();
    expect(screen.getByText("El tipo de documento es obligatorio.")).toBeTruthy();
    expect(screen.getByText("Debes aceptar la política de protección de datos.")).toBeTruthy();
    expect(createDraftMock).not.toHaveBeenCalled();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("AC-002-19: muestra estado de carga y deshabilita los controles al enviar", async () => {
    let resolveCreate: (v: OnboardingResponse) => void = () => {};
    createDraftMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    renderForm();
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    expect(await screen.findByText("Enviando solicitud...")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Enviar solicitud" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Guardar borrador" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    resolveCreate(response(OnboardingStatus.Borrador));
    submitMock.mockResolvedValue(response(OnboardingStatus.PendienteVerificacion));
    expect(await screen.findByText("Solicitud de alta registrada")).toBeTruthy();
  });

  it("AC-002-21: muestra los errores devueltos por el servicio manteniendo los datos", async () => {
    createDraftMock.mockResolvedValue(response(OnboardingStatus.Borrador));
    submitMock.mockRejectedValue(
      new ApiError("Conflicto", 409, [
        "Ya existe una solicitud de alta con ese documento de identidad.",
      ]),
    );
    renderForm();
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    expect(
      await screen.findByText(
        "Ya existe una solicitud de alta con ese documento de identidad.",
      ),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText(/^Nombre/) as HTMLInputElement).value,
    ).toBe("María");
  });

  it("AC-002-22: muestra la confirmación con identificador y estado", async () => {
    createDraftMock.mockResolvedValue(response(OnboardingStatus.Borrador));
    submitMock.mockResolvedValue(response(OnboardingStatus.PendienteVerificacion));
    renderForm();
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    expect(await screen.findByText("Solicitud de alta registrada")).toBeTruthy();
    expect(screen.getByText("ID: req-1234")).toBeTruthy();
    expect(screen.getAllByText("Estado: PendienteVerificacion")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Verificar identidad" })).toBeTruthy();
  });

  it("AC-002-23: guarda el borrador y muestra su identificador", async () => {
    createDraftMock.mockResolvedValue(
      response(OnboardingStatus.Borrador, { firstName: "María" }),
    );
    renderForm();
    type(/^Nombre/, "María");

    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

    expect(await screen.findByText("Borrador guardado")).toBeTruthy();
    expect(screen.getByText(/ID: req-1234/)).toBeTruthy();
    expect(createDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: "María" }),
    );
  });

  it("AC-002-26: reanuda un borrador cargando sus datos en el formulario", async () => {
    getRequestMock.mockResolvedValue(response(OnboardingStatus.Borrador));
    window.history.pushState({}, "", "/onboarding/new?id=req-1234");
    renderForm();

    await waitFor(() => {
      expect(getRequestMock).toHaveBeenCalledWith("req-1234");
    });

    await waitFor(() => {
      expect(
        (screen.getByLabelText(/^Nombre/) as HTMLInputElement).value,
      ).toBe("María");
    });
    expect(
      (screen.getByLabelText(/Número de documento/) as HTMLInputElement).value,
    ).toBe("12345678Z");
    expect(
      (screen.getByLabelText(/Correo electrónico/) as HTMLInputElement).value,
    ).toBe("maria.garcia@example.com");
  });
});
