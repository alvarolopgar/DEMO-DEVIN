import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import ClaimForm from "@/components/ClaimForm";
import { ApiError, createClaim } from "@/lib/api";
import { ClaimResponse, ClaimStatus, ClaimType } from "@/types/claim";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, createClaim: vi.fn() };
});

const createClaimMock = vi.mocked(createClaim);

const CREATED: ClaimResponse = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  policyNumber: "POL-2024-001234",
  claimDate: "2024-01-15",
  claimType: ClaimType.Colision,
  vehiclePlate: "1234 ABC",
  insuredName: "Juan García López",
  phone: "612345678",
  address: "Calle Mayor 10, 2ºA",
  postalCode: "28001",
  description: "Colisión en intersección",
  status: ClaimStatus.Draft,
  createdAt: "2024-01-16T10:00:00Z",
};

const EXPECTED_REQUEST = {
  policyNumber: "POL-2024-001234",
  claimDate: "2024-01-15",
  claimType: ClaimType.Colision,
  vehiclePlate: "1234 ABC",
  insuredName: "Juan García López",
  phone: "612345678",
  address: "Calle Mayor 10, 2ºA",
  postalCode: "28001",
  description: "Colisión en intersección",
};

function renderForm() {
  render(
    <FluentProvider theme={webLightTheme}>
      <ClaimForm />
    </FluentProvider>,
  );
}

function type(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValidForm() {
  type(/Número de póliza/, EXPECTED_REQUEST.policyNumber);
  type(/Fecha del siniestro/, EXPECTED_REQUEST.claimDate);
  type(/Matrícula del vehículo/, EXPECTED_REQUEST.vehiclePlate);
  type(/Nombre del asegurado/, EXPECTED_REQUEST.insuredName);
  type(/Teléfono/, EXPECTED_REQUEST.phone);
  type(/Dirección/, EXPECTED_REQUEST.address);
  type(/Código postal/, EXPECTED_REQUEST.postalCode);
  type(/Descripción/, EXPECTED_REQUEST.description);
}

describe("ClaimForm", () => {
  beforeEach(() => {
    createClaimMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it.each(["Guardar borrador", "Enviar siniestro"])(
    "AC-001-12: '%s' crea el siniestro en Draft con la misma petición",
    async (action) => {
      createClaimMock.mockResolvedValue(CREATED);
      renderForm();
      fillValidForm();

      fireEvent.click(screen.getByRole("button", { name: action }));

      expect(await screen.findByText("Siniestro creado correctamente")).toBeTruthy();
      expect(createClaimMock).toHaveBeenCalledTimes(1);
      expect(createClaimMock).toHaveBeenCalledWith(EXPECTED_REQUEST);
      expect(screen.getAllByText(`Estado: ${ClaimStatus.Draft}`)).toHaveLength(2);
    },
  );

  it("AC-001-13: muestra los errores de validación sin llamar al servicio", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Enviar siniestro" }));

    expect(screen.getByText("El número de póliza es obligatorio.")).toBeTruthy();
    expect(screen.getByText("La descripción es obligatoria.")).toBeTruthy();
    expect(createClaimMock).not.toHaveBeenCalled();
  });

  it("AC-001-14: muestra la confirmación con el identificador asignado", async () => {
    createClaimMock.mockResolvedValue(CREATED);
    renderForm();
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Enviar siniestro" }));

    expect(await screen.findByText(`ID: ${CREATED.id}`)).toBeTruthy();
  });

  it("AC-001-15: muestra los errores devueltos por el servicio", async () => {
    createClaimMock.mockRejectedValue(
      new ApiError("Error de validación", 400, ["El código postal debe tener exactamente 5 dígitos."]),
    );
    renderForm();
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Enviar siniestro" }));

    expect(await screen.findByText("El código postal debe tener exactamente 5 dígitos.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enviar siniestro" })).toBeTruthy();
  });

  it("AC-001-17: muestra el estado de carga y evita el doble envío", async () => {
    let resolve: (value: ClaimResponse) => void = () => {};
    createClaimMock.mockReturnValue(new Promise<ClaimResponse>((r) => (resolve = r)));
    renderForm();
    fillValidForm();

    const submit = screen.getByRole("button", { name: "Enviar siniestro" });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(screen.getByText("Enviando siniestro...")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enviar siniestro" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Guardar borrador" })).toBeNull();
    expect(createClaimMock).toHaveBeenCalledTimes(1);

    resolve(CREATED);
    expect(await screen.findByText("Siniestro creado correctamente")).toBeTruthy();
  });
});
