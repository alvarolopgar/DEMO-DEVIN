import FluentWrapper from "@/components/FluentProvider";
import ClaimForm from "@/components/ClaimForm";

export const metadata = {
  title: "Nuevo Siniestro Auto - Gestión de Siniestros",
  description: "Crear nuevo siniestro de auto - KAN-5",
};

export default function NewClaimPage() {
  return (
    <FluentWrapper>
      <ClaimForm />
    </FluentWrapper>
  );
}
