// =============================================================================
// KAN-5 – ClaimStatus Enum
// AC1: Estado inicial del siniestro es siempre "Draft"
// State Machine: Draft → Submitted → UnderReview → Approved | Rejected
// =============================================================================

namespace GestionSiniestros.Domain.Enums;

/// <summary>
/// Estados del ciclo de vida de un siniestro.
/// Transiciones válidas:
///   Draft       → Submitted
///   Submitted   → UnderReview
///   UnderReview → Approved | Rejected
/// </summary>
public enum ClaimStatus
{
    Draft = 0,
    Submitted = 1,
    UnderReview = 2,
    Approved = 3,
    Rejected = 4
}
