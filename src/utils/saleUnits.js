/** Common units for sale / bill lines; DB may use any string — we merge DB + presets in UI. */
export const STANDARD_SALE_UNITS = ['PCS', 'KG', 'LTR', 'BOX', 'PACKET', 'MTR'];

export function normalizeSaleUnit(u) {
  const s = u == null ? '' : String(u).trim();
  return s || 'PCS';
}

/** Presets plus the item’s stored unit first when it is not a standard code, for datalists. */
export function unitOptionsForItem(dbUnit) {
  const u = normalizeSaleUnit(dbUnit);
  const upper = u.toUpperCase();
  const stdUpper = new Set(STANDARD_SALE_UNITS.map((x) => x.toUpperCase()));
  const out = [];
  const seen = new Set();
  if (!stdUpper.has(upper)) {
    out.push(u);
    seen.add(upper);
  }
  for (const x of STANDARD_SALE_UNITS) {
    const xu = x.toUpperCase();
    if (!seen.has(xu)) {
      seen.add(xu);
      out.push(x);
    }
  }
  return out;
}
