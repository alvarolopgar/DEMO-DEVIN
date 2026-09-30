"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Dropdown,
  Field,
  Input,
  Option,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Card,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Filled,
  DismissCircle24Filled,
  Save24Regular,
  Send24Regular,
} from "@fluentui/react-icons";
import {
  DocumentType,
  OnboardingFormErrors,
  OnboardingFormValues,
  OnboardingResponse,
  OnboardingStatus,
  SaveOnboardingDraftRequest,
} from "@/types/onboarding";
import {
  createOnboardingDraft,
  getOnboardingRequest,
  updateOnboardingDraft,
  submitOnboardingRequest,
  verifyOnboardingRequest,
  completeOnboardingRequest,
} from "@/lib/onboardingApi";
import { ApiError } from "@/lib/api";
import { validateOnboardingForm } from "@/lib/onboardingValidation";

// Brand tokens from specs/002-alta-digital-cliente/ui/brand.md (Banco Sabadell)
const BRAND = {
  primary: "#006DFF",
  primaryHover: "#0051DB",
  accent: "#007096",
  background: "#FAFAFA",
  error: "#D92D20",
  success: "#067647",
  fontFamily: '"SBSansInterface", Arial, sans-serif',
};

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: DocumentType.Dni, label: "DNI" },
  { value: DocumentType.Nie, label: "NIE" },
  { value: DocumentType.Pasaporte, label: "Pasaporte" },
];

type View = "form" | "submitted" | "verified" | "rejected" | "completed" | "expired";

const EMPTY_VALUES: OnboardingFormValues = {
  firstName: "",
  lastName: "",
  documentType: "",
  documentNumber: "",
  birthDate: "",
  email: "",
  mobilePhone: "",
  acceptsPrivacyPolicy: false,
  acceptsMarketing: false,
};

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: BRAND.background,
    fontFamily: BRAND.fontFamily,
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottom: `3px solid ${BRAND.primary}`,
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: BRAND.primary,
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground2,
    margin: 0,
  },
  content: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "24px 32px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    gap: "12px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  card: {
    padding: "24px",
  },
  resumeRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  resumeField: {
    flexGrow: 1,
    minWidth: "260px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: "15px",
    color: BRAND.accent,
    margin: "8px 0 4px 0",
    gridColumn: "1 / -1",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  primaryButton: {
    backgroundColor: BRAND.primary,
    ":hover": {
      backgroundColor: BRAND.primaryHover,
    },
  },
  centerContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "48px 24px",
    textAlign: "center",
  },
  successIcon: {
    color: BRAND.success,
    fontSize: "48px",
  },
  errorIcon: {
    color: BRAND.error,
    fontSize: "48px",
  },
  infoIcon: {
    color: BRAND.accent,
    fontSize: "48px",
  },
  viewTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
  },
  muted: {
    margin: 0,
    color: tokens.colorNeutralForeground3,
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
});

function viewForStatus(status: OnboardingStatus): View {
  switch (status) {
    case OnboardingStatus.Borrador:
      return "form";
    case OnboardingStatus.PendienteVerificacion:
      return "submitted";
    case OnboardingStatus.Verificada:
      return "verified";
    case OnboardingStatus.Rechazada:
      return "rejected";
    case OnboardingStatus.ClienteCreado:
      return "completed";
    case OnboardingStatus.Caducada:
      return "expired";
  }
}

export default function OnboardingForm() {
  const styles = useStyles();

  const [view, setView] = useState<View>("form");
  const [busy, setBusy] = useState<string | null>(null);
  const [values, setValues] = useState<OnboardingFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<OnboardingFormErrors>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);
  const [request, setRequest] = useState<OnboardingResponse | null>(null);
  const [resumeId, setResumeId] = useState("");
  const [resumeError, setResumeError] = useState<string | null>(null);

  const setField = <K extends keyof OnboardingFormValues>(
    field: K,
    value: OnboardingFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const applyResponse = useCallback(
    (response: OnboardingResponse, draftBanner: boolean) => {
      setRequest(response);
      setDraftSaved(draftBanner);
      setServerErrors([]);
      if (response.status === OnboardingStatus.Borrador) {
        setValues({
          firstName: response.firstName ?? "",
          lastName: response.lastName ?? "",
          documentType: response.documentType ?? "",
          documentNumber: response.documentNumber ?? "",
          birthDate: response.birthDate ?? "",
          email: response.email ?? "",
          mobilePhone: response.mobilePhone ?? "",
          acceptsPrivacyPolicy: response.acceptsPrivacyPolicy ?? false,
          acceptsMarketing: response.acceptsMarketing,
        });
        setView("form");
      } else {
        setView(viewForStatus(response.status));
      }
    },
    [],
  );

  const showErrors = useCallback((err: unknown) => {
    if (err instanceof ApiError) {
      setServerErrors(
        err.validationErrors.length > 0 ? err.validationErrors : [err.message],
      );
    } else {
      setServerErrors(["Error de conexión. Inténtelo de nuevo."]);
    }
  }, []);

  const draftPayload = useCallback((): SaveOnboardingDraftRequest => {
    const payload: SaveOnboardingDraftRequest = {};
    if (values.firstName.trim()) payload.firstName = values.firstName.trim();
    if (values.lastName.trim()) payload.lastName = values.lastName.trim();
    if (values.documentType) {
      payload.documentType = values.documentType as DocumentType;
    }
    if (values.documentNumber.trim()) {
      payload.documentNumber = values.documentNumber.trim();
    }
    if (values.birthDate) payload.birthDate = values.birthDate;
    if (values.email.trim()) payload.email = values.email.trim();
    if (values.mobilePhone.trim()) payload.mobilePhone = values.mobilePhone.trim();
    if (values.acceptsPrivacyPolicy) payload.acceptsPrivacyPolicy = true;
    if (values.acceptsMarketing) payload.acceptsMarketing = true;
    return payload;
  }, [values]);

  const loadRequest = useCallback(
    async (id: string) => {
      setBusy("Cargando solicitud...");
      setResumeError(null);
      try {
        const response = await getOnboardingRequest(id);
        applyResponse(response, response.status === OnboardingStatus.Borrador);
      } catch (err) {
        if (err instanceof ApiError) {
          setResumeError(err.message);
        } else {
          setResumeError("Error de conexión. Inténtelo de nuevo.");
        }
      } finally {
        setBusy(null);
      }
    },
    [applyResponse],
  );

  // Reanudar borrador desde ?id=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setResumeId(id);
      void loadRequest(id);
    }
  }, [loadRequest]);

  const handleSaveDraft = useCallback(async () => {
    setServerErrors([]);
    setDraftSaved(false);
    setBusy("Guardando borrador...");
    try {
      const response = request
        ? await updateOnboardingDraft(request.id, draftPayload())
        : await createOnboardingDraft(draftPayload());
      applyResponse(response, true);
    } catch (err) {
      showErrors(err);
    } finally {
      setBusy(null);
    }
  }, [request, draftPayload, applyResponse, showErrors]);

  const handleSubmit = useCallback(async () => {
    setServerErrors([]);
    setDraftSaved(false);

    const validationErrors = validateOnboardingForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setBusy("Enviando solicitud...");
    try {
      const saved = request
        ? await updateOnboardingDraft(request.id, draftPayload())
        : await createOnboardingDraft(draftPayload());
      const submitted = await submitOnboardingRequest(saved.id);
      applyResponse(submitted, false);
    } catch (err) {
      showErrors(err);
    } finally {
      setBusy(null);
    }
  }, [values, request, draftPayload, applyResponse, showErrors]);

  const handleVerify = useCallback(async () => {
    if (!request) return;
    setServerErrors([]);
    setBusy("Verificando identidad...");
    try {
      applyResponse(await verifyOnboardingRequest(request.id), false);
    } catch (err) {
      showErrors(err);
    } finally {
      setBusy(null);
    }
  }, [request, applyResponse, showErrors]);

  const handleComplete = useCallback(async () => {
    if (!request) return;
    setServerErrors([]);
    setBusy("Completando alta...");
    try {
      applyResponse(await completeOnboardingRequest(request.id), false);
    } catch (err) {
      showErrors(err);
    } finally {
      setBusy(null);
    }
  }, [request, applyResponse, showErrors]);

  const resetForm = useCallback(() => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setServerErrors([]);
    setDraftSaved(false);
    setRequest(null);
    setResumeId("");
    setResumeError(null);
    setView("form");
  }, []);

  const disabled = busy !== null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Banco Sabadell</h1>
          <p className={styles.headerSubtitle}>Alta digital de cliente</p>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h2 className={styles.pageTitle}>Nueva solicitud de alta</h2>
          <Badge appearance="outline" color="informative" size="large">
            Estado: {request?.status ?? OnboardingStatus.Borrador}
          </Badge>
        </div>

        {serverErrors.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            {serverErrors.map((error, index) => (
              <MessageBar key={index} intent="error" style={{ marginBottom: "8px" }}>
                <MessageBarBody>
                  <MessageBarTitle>Error</MessageBarTitle>
                  {error}
                </MessageBarBody>
              </MessageBar>
            ))}
          </div>
        )}

        <Card className={styles.card}>
          {view === "form" && (
            <>
              <div className={styles.resumeRow}>
                <Field
                  label="Identificador de la solicitud"
                  className={styles.resumeField}
                  validationMessage={resumeError ?? undefined}
                  validationState={resumeError ? "error" : "none"}
                >
                  <Input
                    value={resumeId}
                    onChange={(_, data) => setResumeId(data.value)}
                    placeholder="Pega aquí el identificador de tu solicitud"
                    disabled={disabled}
                  />
                </Field>
                <Button
                  appearance="secondary"
                  disabled={disabled || !resumeId.trim()}
                  onClick={() => void loadRequest(resumeId.trim())}
                >
                  Reanudar
                </Button>
              </div>

              {draftSaved && request && (
                <MessageBar intent="success" style={{ marginBottom: "16px" }}>
                  <MessageBarBody>
                    <MessageBarTitle>Borrador guardado</MessageBarTitle>
                    ID: {request.id} — guarda este identificador y podrás continuar
                    más tarde.
                  </MessageBarBody>
                </MessageBar>
              )}

              {busy && (
                <div className={styles.loadingRow}>
                  <Spinner size="small" label={busy} labelPosition="after" />
                </div>
              )}

              <div className={styles.formGrid}>
                <div className={styles.sectionTitle}>Datos personales</div>

                <Field
                  label="Nombre"
                  required
                  validationMessage={errors.firstName}
                  validationState={errors.firstName ? "error" : "none"}
                >
                  <Input
                    value={values.firstName}
                    onChange={(_, data) => setField("firstName", data.value)}
                    placeholder="Tu nombre"
                    disabled={disabled}
                  />
                </Field>

                <Field
                  label="Apellidos"
                  required
                  validationMessage={errors.lastName}
                  validationState={errors.lastName ? "error" : "none"}
                >
                  <Input
                    value={values.lastName}
                    onChange={(_, data) => setField("lastName", data.value)}
                    placeholder="Tus apellidos"
                    disabled={disabled}
                  />
                </Field>

                <Field
                  label="Fecha de nacimiento"
                  required
                  validationMessage={errors.birthDate}
                  validationState={errors.birthDate ? "error" : "none"}
                >
                  <Input
                    type="date"
                    value={values.birthDate}
                    onChange={(_, data) => setField("birthDate", data.value)}
                    disabled={disabled}
                  />
                </Field>

                <div className={styles.sectionTitle}>Documento de identidad</div>

                <Field
                  label="Tipo de documento"
                  required
                  validationMessage={errors.documentType}
                  validationState={errors.documentType ? "error" : "none"}
                >
                  <Dropdown
                    placeholder="Selecciona el tipo"
                    value={
                      DOCUMENT_TYPE_OPTIONS.find(
                        (o) => o.value === values.documentType,
                      )?.label ?? ""
                    }
                    selectedOptions={values.documentType ? [values.documentType] : []}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        setField("documentType", data.optionValue);
                      }
                    }}
                    disabled={disabled}
                  >
                    {DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>

                <Field
                  label="Número de documento"
                  required
                  validationMessage={errors.documentNumber}
                  validationState={errors.documentNumber ? "error" : "none"}
                >
                  <Input
                    value={values.documentNumber}
                    onChange={(_, data) => setField("documentNumber", data.value)}
                    placeholder="Ej: 12345678Z"
                    disabled={disabled}
                  />
                </Field>

                <div className={styles.sectionTitle}>Contacto</div>

                <Field
                  label="Correo electrónico"
                  required
                  validationMessage={errors.email}
                  validationState={errors.email ? "error" : "none"}
                >
                  <Input
                    type="email"
                    value={values.email}
                    onChange={(_, data) => setField("email", data.value)}
                    placeholder="tu@email.com"
                    disabled={disabled}
                  />
                </Field>

                <Field
                  label="Teléfono móvil"
                  required
                  validationMessage={errors.mobilePhone}
                  validationState={errors.mobilePhone ? "error" : "none"}
                >
                  <Input
                    type="tel"
                    value={values.mobilePhone}
                    onChange={(_, data) => setField("mobilePhone", data.value)}
                    placeholder="Ej: 612 345 678"
                    disabled={disabled}
                  />
                </Field>

                <div className={styles.sectionTitle}>Consentimientos</div>

                <Field
                  required
                  className={styles.fullWidth}
                  validationMessage={errors.acceptsPrivacyPolicy}
                  validationState={errors.acceptsPrivacyPolicy ? "error" : "none"}
                >
                  <Checkbox
                    label="He leído y acepto la política de protección de datos"
                    checked={values.acceptsPrivacyPolicy}
                    onChange={(_, data) =>
                      setField("acceptsPrivacyPolicy", data.checked === true)
                    }
                    disabled={disabled}
                  />
                </Field>

                <div className={styles.fullWidth}>
                  <Checkbox
                    label="Acepto recibir comunicaciones comerciales (opcional)"
                    checked={values.acceptsMarketing}
                    onChange={(_, data) =>
                      setField("acceptsMarketing", data.checked === true)
                    }
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className={styles.buttonRow}>
                <Button
                  appearance="secondary"
                  icon={<Save24Regular />}
                  onClick={handleSaveDraft}
                  disabled={disabled}
                >
                  Guardar borrador
                </Button>
                <Button
                  appearance="primary"
                  className={styles.primaryButton}
                  onClick={handleSubmit}
                  disabled={disabled}
                >
                  Enviar solicitud
                </Button>
              </div>
            </>
          )}

          {view === "submitted" && request && (
            <div className={styles.centerContainer}>
              <Send24Regular
                className={styles.infoIcon}
                style={{ width: 48, height: 48 }}
              />
              <h3 className={styles.viewTitle}>Solicitud de alta registrada</h3>
              <p className={styles.muted}>ID: {request.id}</p>
              <Badge appearance="filled" color="informative" size="large">
                Estado: {request.status}
              </Badge>
              <p className={styles.muted}>
                Tu solicitud está pendiente de verificación de identidad.
              </p>
              <Button
                appearance="primary"
                className={styles.primaryButton}
                onClick={handleVerify}
                disabled={disabled}
              >
                Verificar identidad
              </Button>
            </div>
          )}

          {view === "verified" && request && (
            <div className={styles.centerContainer}>
              <CheckmarkCircle24Filled
                className={styles.successIcon}
                style={{ width: 48, height: 48 }}
              />
              <h3 className={styles.viewTitle}>Identidad verificada correctamente</h3>
              <p className={styles.muted}>ID: {request.id}</p>
              <Badge appearance="filled" color="success" size="large">
                Estado: {request.status}
              </Badge>
              <Button
                appearance="primary"
                className={styles.primaryButton}
                onClick={handleComplete}
                disabled={disabled}
              >
                Completar alta
              </Button>
            </div>
          )}

          {view === "rejected" && request && (
            <div className={styles.centerContainer}>
              <DismissCircle24Filled
                className={styles.errorIcon}
                style={{ width: 48, height: 48 }}
              />
              <h3 className={styles.viewTitle}>
                No hemos podido verificar tu identidad
              </h3>
              <p className={styles.muted}>ID: {request.id}</p>
              <Badge appearance="filled" color="danger" size="large">
                Estado: {request.status}
              </Badge>
              {request.rejectionReason && (
                <p className={styles.muted}>{request.rejectionReason}</p>
              )}
              <Button appearance="secondary" onClick={resetForm}>
                Volver al inicio
              </Button>
            </div>
          )}

          {view === "completed" && request && (
            <div className={styles.centerContainer}>
              <CheckmarkCircle24Filled
                className={styles.successIcon}
                style={{ width: 48, height: 48 }}
              />
              <h3 className={styles.viewTitle}>¡Ya eres cliente!</h3>
              <p className={styles.muted}>ID: {request.id}</p>
              <Badge appearance="filled" color="success" size="large">
                Estado: {request.status}
              </Badge>
              <Button appearance="secondary" onClick={resetForm}>
                Iniciar un alta nueva
              </Button>
            </div>
          )}

          {view === "expired" && (
            <div className={styles.centerContainer}>
              <DismissCircle24Filled
                className={styles.infoIcon}
                style={{ width: 48, height: 48 }}
              />
              <h3 className={styles.viewTitle}>La solicitud ha caducado</h3>
              <p className={styles.muted}>
                Las solicitudes incompletas caducan a los 30 días.
              </p>
              <Button appearance="secondary" onClick={resetForm}>
                Iniciar un alta nueva
              </Button>
            </div>
          )}

          {busy && view !== "form" && (
            <div
              className={styles.loadingRow}
              style={{ justifyContent: "center" }}
            >
              <Spinner size="small" label={busy} labelPosition="after" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
