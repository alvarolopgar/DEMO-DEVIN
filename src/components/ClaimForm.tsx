"use client";

import React, { useState, useCallback } from "react";
import {
  Badge,
  Button,
  Dropdown,
  Field,
  Input,
  Option,
  Spinner,
  Textarea,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Card,
  CardHeader,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Filled,
} from "@fluentui/react-icons";
import { ClaimType, ClaimResponse, FormErrors } from "@/types/claim";
import { createClaim, ApiError } from "@/lib/api";
import { validateClaimForm } from "@/lib/validation";

const CLAIM_TYPE_OPTIONS: { value: ClaimType; label: string }[] = [
  { value: ClaimType.Colision, label: "Colisión" },
  { value: ClaimType.Robo, label: "Robo" },
  { value: ClaimType.Incendio, label: "Incendio" },
  { value: ClaimType.Cristales, label: "Cristales" },
];

type FormState = "default" | "loading" | "success" | "error";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#c8102e",
    color: "#ffffff",
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: 600,
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "14px",
    opacity: 0.9,
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
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  fullWidth: {
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
  successContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "48px 24px",
    textAlign: "center",
  },
  successIcon: {
    color: "#107c10",
    fontSize: "48px",
  },
  errorIcon: {
    color: "#c8102e",
  },
  loadingOverlay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "48px 24px",
  },
});

export default function ClaimForm() {
  const styles = useStyles();

  const [formState, setFormState] = useState<FormState>("default");
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [createdClaim, setCreatedClaim] = useState<ClaimResponse | null>(null);

  // Form fields
  const [policyNumber, setPolicyNumber] = useState("");
  const [claimDate, setClaimDate] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>(ClaimType.Colision);
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [insuredName, setInsuredName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = useCallback(() => {
    setPolicyNumber("");
    setClaimDate("");
    setClaimType(ClaimType.Colision);
    setVehiclePlate("");
    setInsuredName("");
    setPhone("");
    setAddress("");
    setPostalCode("");
    setDescription("");
    setErrors({});
    setServerErrors([]);
    setCreatedClaim(null);
    setFormState("default");
  }, []);

  const handleSubmit = useCallback(async () => {
    setServerErrors([]);

    const validationErrors = validateClaimForm({
      policyNumber,
      claimDate,
      vehiclePlate,
      insuredName,
      phone,
      address,
      postalCode,
      description,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormState("error");
      return;
    }

    setErrors({});
    setFormState("loading");

    try {
      const response = await createClaim({
        policyNumber,
        claimDate,
        claimType,
        vehiclePlate,
        insuredName,
        phone,
        address,
        postalCode,
        description,
      });

      setCreatedClaim(response);
      setFormState("success");
    } catch (err) {
      if (err instanceof ApiError) {
        setServerErrors(
          err.validationErrors.length > 0
            ? err.validationErrors
            : [err.message]
        );
      } else {
        setServerErrors(["Error de conexión. Inténtelo de nuevo."]);
      }
      setFormState("error");
    }
  }, [
    policyNumber,
    claimDate,
    claimType,
    vehiclePlate,
    insuredName,
    phone,
    address,
    postalCode,
    description,
  ]);

  return (
    <div className={styles.page}>
      {/* Header corporativo Generali */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Gestión de Siniestros</h1>
          <p className={styles.headerSubtitle}>Sistema de gestión - Auto</p>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h2 className={styles.pageTitle}>Nuevo Siniestro Auto</h2>
          <Badge appearance="outline" color="informative" size="large">
            Estado: Draft
          </Badge>
        </div>

        {/* Server errors */}
        {formState === "error" && serverErrors.length > 0 && (
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
          {formState === "loading" && (
            <div className={styles.loadingOverlay}>
              <Spinner size="large" label="Enviando siniestro..." />
            </div>
          )}

          {formState === "success" && createdClaim && (
            <div className={styles.successContainer}>
              <CheckmarkCircle24Filled
                className={styles.successIcon}
                style={{ width: 48, height: 48 }}
              />
              <h3 style={{ margin: 0, fontSize: "20px" }}>
                Siniestro creado correctamente
              </h3>
              <p style={{ margin: 0, color: tokens.colorNeutralForeground3 }}>
                ID: {createdClaim.id}
              </p>
              <Badge appearance="filled" color="informative" size="large">
                Estado: {createdClaim.status}
              </Badge>
              <Button appearance="primary" onClick={resetForm} style={{ marginTop: "16px" }}>
                Crear nuevo siniestro
              </Button>
            </div>
          )}

          {(formState === "default" || formState === "error") && (
            <>
              <CardHeader
                header={
                  <span style={{ fontWeight: 600, fontSize: "16px" }}>
                    Datos del siniestro
                  </span>
                }
                description="Complete todos los campos obligatorios"
              />

              <div className={styles.formGrid}>
                <Field
                  label="Número de póliza"
                  required
                  validationMessage={errors.policyNumber}
                  validationState={errors.policyNumber ? "error" : "none"}
                >
                  <Input
                    value={policyNumber}
                    onChange={(_, data) => setPolicyNumber(data.value)}
                    placeholder="Ej: POL-2024-001234"
                  />
                </Field>

                <Field
                  label="Fecha del siniestro"
                  required
                  validationMessage={errors.claimDate}
                  validationState={errors.claimDate ? "error" : "none"}
                >
                  <Input
                    type="date"
                    value={claimDate}
                    onChange={(_, data) => setClaimDate(data.value)}
                  />
                </Field>

                <Field label="Tipo de siniestro" required>
                  <Dropdown
                    value={CLAIM_TYPE_OPTIONS.find((o) => o.value === claimType)?.label}
                    selectedOptions={[claimType]}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        setClaimType(data.optionValue as ClaimType);
                      }
                    }}
                  >
                    {CLAIM_TYPE_OPTIONS.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>

                <Field
                  label="Matrícula del vehículo"
                  required
                  validationMessage={errors.vehiclePlate}
                  validationState={errors.vehiclePlate ? "error" : "none"}
                >
                  <Input
                    value={vehiclePlate}
                    onChange={(_, data) => setVehiclePlate(data.value)}
                    placeholder="Ej: 1234 ABC"
                  />
                </Field>

                <Field
                  label="Nombre del asegurado"
                  required
                  validationMessage={errors.insuredName}
                  validationState={errors.insuredName ? "error" : "none"}
                >
                  <Input
                    value={insuredName}
                    onChange={(_, data) => setInsuredName(data.value)}
                    placeholder="Nombre completo"
                  />
                </Field>

                <Field
                  label="Teléfono"
                  required
                  validationMessage={errors.phone}
                  validationState={errors.phone ? "error" : "none"}
                >
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(_, data) => setPhone(data.value)}
                    placeholder="Ej: 612 345 678"
                  />
                </Field>

                <Field
                  label="Dirección"
                  required
                  validationMessage={errors.address}
                  validationState={errors.address ? "error" : "none"}
                >
                  <Input
                    value={address}
                    onChange={(_, data) => setAddress(data.value)}
                    placeholder="Calle, número, piso"
                  />
                </Field>

                <Field
                  label="Código postal"
                  required
                  validationMessage={errors.postalCode}
                  validationState={errors.postalCode ? "error" : "none"}
                >
                  <Input
                    value={postalCode}
                    onChange={(_, data) => setPostalCode(data.value)}
                    placeholder="Ej: 28001"
                    maxLength={5}
                  />
                </Field>

                <Field
                  label="Descripción"
                  required
                  className={styles.fullWidth}
                  validationMessage={errors.description}
                  validationState={errors.description ? "error" : "none"}
                >
                  <Textarea
                    value={description}
                    onChange={(_, data) => setDescription(data.value)}
                    placeholder="Describa las circunstancias del siniestro..."
                    rows={4}
                    resize="vertical"
                  />
                </Field>
              </div>

              <div className={styles.buttonRow}>
                <Button appearance="secondary" disabled>
                  Guardar borrador
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleSubmit}
                  style={{ backgroundColor: "#c8102e", borderColor: "#c8102e" }}
                >
                  Enviar siniestro
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
