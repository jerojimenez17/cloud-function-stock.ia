# Specification: Add `arca` object to `CreateVoucherSchema`

## Requirements
- Update `CreateVoucherSchema` in `src/functions/createVoucher.ts` to include an `arca` object.
- The `arca` object must match the structure of the ARCA Billing fields in the `Business` model from the Prisma schema in the `POS-Template` project.
- Additionally, add `puntoVenta` to the `arca` object. It must be a natural number (positive integer).
- The corresponding Zod schema for `arca` will be:
  ```typescript
  arca: z.object({
    cuit: z.string().nullable().optional(),
    razonSocial: z.string().nullable().optional(),
    inicioActividades: z.union([z.string().datetime(), z.string()]).nullable().optional(),
    condicionIva: z.enum(["RESPONSABLE_INSCRIPTO", "MONOTRIBUTO"]).nullable().optional().default("MONOTRIBUTO"),
    address: z.string().nullable().optional(),
    cert: z.string().nullable().optional(),
    key: z.string().nullable().optional(),
    puntoVenta: z.number().int().positive().optional(),
  }).optional()
  ```
- Use the data from `arca` in `createVoucher` implementation:
  - Replace hardcoded `CUIT: "20407713606"` with `arca?.cuit || "20407713606"`.
  - Replace hardcoded `puntoVenta = 1` with `arca?.puntoVenta || 1`.

## Acceptance Criteria
- `CreateVoucherSchema` validates an object that includes the optional `arca.puntoVenta` property as a positive integer.
- `createVoucher` uses the values from `arca` instead of hardcoded fallback values if they are provided.