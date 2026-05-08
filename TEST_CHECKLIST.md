# Test Checklist: Add `arca` to `CreateVoucherSchema`

- [x] Schema validates when a valid `arca` object is provided.
- [x] Schema defaults `condicionIva` to `MONOTRIBUTO` when not provided.
- [x] Schema rejects invalid types for `arca.cuit` (e.g., number instead of string).
- [x] Schema rejects invalid values for `condicionIva` (e.g., "INVALIDO").
- [x] Schema accepts `puntoVenta` as a positive integer.
- [x] Schema rejects `puntoVenta` if it is a negative number, float, or string.
