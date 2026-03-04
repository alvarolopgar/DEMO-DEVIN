// =============================================================================
// KAN-5 – ClaimType Enum
// AC2: Tipo de siniestro es campo obligatorio
// Valores: Colisión, Robo, Incendio, Cristales
// =============================================================================

namespace GestionSiniestros.Domain.Enums;

/// <summary>
/// Tipos de siniestro de auto soportados.
/// </summary>
public enum ClaimType
{
    Colision = 0,
    Robo = 1,
    Incendio = 2,
    Cristales = 3
}
