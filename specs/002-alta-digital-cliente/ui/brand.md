# Identidad gráfica – Alta digital de cliente (SPEC-002)

> Fuente: identidad extraída de la web pública de Banco Sabadell
> (`https://www.bancsabadell.com/bsnacional/es/particulares/`, consultada el 2026-09-30),
> por encargo del usuario (C-002-09). La web usa el sistema de diseño propietario **Galatea Gamma v2**
> (componentes `bs-*`, tokens `--bs-token-*`, servido desde `apps.cdn.aws.bancsabadell.com`),
> que no está disponible públicamente como librería. Estos tokens son la referencia de marca para
> los estados de esta spec; la implementación los mapeará sobre el theme de Fluent UI v9 (ADR-002-04).

## 1. Paleta de color

Valores observados en el HTML/CSS publicado de la web y en el logotipo embebido.

| Token | Valor | Uso observado en la web | Uso previsto en la UI |
|---|---|---|---|
| `brand.primary` | `#006DFF` | Logotipo (marca "S"), botones primarios, enlaces, iconos (`--bs-token-color-primary-500`) | Acción primaria "Solicitar alta", enlaces, iconos, spinner de Loading |
| `brand.primary-hover` | `#0051DB` | Estado `:focus-visible` (anillo de foco) | Hover/focus de la acción primaria, indicador de foco accesible |
| `brand.accent-teal` | `#007096` | Bordes decorativos de módulos | Acento secundario, separadores |
| `brand.accent-cyan` | `#45B5DA` | Bordes decorativos de módulos | Acento claro, ilustraciones |
| `neutral.text` | `#000000` | Texto principal | Texto de cuerpo y títulos |
| `neutral.text-secondary` | `#666666` | Texto secundario / sombras | Etiquetas de apoyo, placeholders |
| `neutral.border` | `#D8D8D8`–`#E0E0E0` | Bordes y separadores | Bordes de campos y tarjetas |
| `neutral.bg` | `#FAFAFA` | Fondo de página (`--bs-token-color-grey-50`) | Fondo de pantalla |
| `neutral.bg-section` | `#F3F4F5` | Fondo de secciones | Fondo de bloques del formulario |
| `neutral.surface` | `#FFFFFF` | Tarjetas, overlays | Tarjeta contenedora del formulario |
| `semantic.error` | `#D92D20`* | — | Mensajes de error por campo y avisos (UI-002-02, UI-002-05) |
| `semantic.success` | `#067647`* | — | Icono y mensaje de confirmación (UI-002-04) |

\* Los colores de error/éxito no se pudieron observar en la página consultada; se documentan los valores
habituales de Fluent UI v9 como referencia provisional hasta que diseño confirme los de Galatea.

## 2. Tipografía

| Token | Valor | Procedencia |
|---|---|---|
| `font.family` | `"SBSansInterface", Arial, Helvetica, sans-serif` | La web carga su fuente corporativa desde el bundle Galatea (no distribuible); los fallbacks `Arial`/`Verdana` están observados en el CSS publicado. |
| `font.family-fallback` | `Arial, Helvetica, sans-serif` | Observado (`font-family:Arial`, `font-family:Verdana`) |

Si la fuente corporativa no está disponible en el entorno de la demo, se usa la pila de fallback;
la decisión es de diseño (C-002-09).

## 3. Logotipo

- Marca "S" en `#006DFF` + palabra "Banco Sabadell" (versión positiva sobre fondo claro).
- Referencia: `https://www.bancsabadell.com/cs/StaticBS/logo-sabadell.svg` (logotipo público embebido
  en la cabecera de la web).
- En la demo se usa solo la marca de color con el texto "Banco Sabadell" en `font.family`.

## 4. Reglas de uso

1. **Fondos claros**: la UI es sobre `neutral.bg`/`neutral.surface`; no hay modo oscuro en esta spec.
2. **Acción primaria**: fondo `brand.primary`, texto `#FFFFFF` (contraste ≈ 5,1:1, cumple AA para
   texto grande y controles; verificar ≥ 4,5:1 en textos de cuerpo, NFR-002-04).
3. **Foco accesible**: anillo `brand.primary-hover` (observado en `:focus-visible` de la web).
4. **Errores**: `semantic.error` solo para mensajes de validación; nunca como color de marca.
5. **Acentos** `accent-teal`/`accent-cyan`: solo decorativos (bordes, ilustraciones), nunca para texto
   de cuerpo ni acciones.
6. **Ningún color fuera de esta tabla** sin actualizar primero este documento (NFR-002-09).

## 5. Mapeo a Fluent UI v9 (implementación)

| Token de marca | Token Fluent UI |
|---|---|
| `brand.primary` | `tokens.colorBrandBackground` |
| `brand.primary-hover` | `tokens.colorBrandBackgroundHover` / `colorStrokeFocus2` |
| `neutral.bg` | `tokens.colorNeutralBackground2` |
| `neutral.surface` | `tokens.colorNeutralBackground1` |
| `neutral.text` | `tokens.colorNeutralForeground1` |
| `neutral.border` | `tokens.colorNeutralStroke1` |
| `semantic.error` | `tokens.colorPaletteRedForeground1` / `colorPaletteRedBackground1` |
| `semantic.success` | `tokens.colorPaletteGreenForeground1` / `colorPaletteGreenBackground1` |
