/**
 * Enforces: sale > 0; sale >= purchase (when purchase is set); and when min_sale_rate > 0,
 * purchase <= min_sale_rate <= sale. (Min 0 / empty = no minimum band.)
 */
export function validateItemRates(p) {
  const label = p.productLabel ? `${p.productLabel}: ` : '';
  const sale = parseFloat(p.sale_rate) || 0;
  const purchase =
    p.purchase_rate !== undefined && p.purchase_rate !== null && p.purchase_rate !== ''
      ? parseFloat(p.purchase_rate)
      : NaN;
  const hasPurchase = Number.isFinite(purchase);
  const minRaw = p.min_sale_rate;
  const min =
    minRaw !== undefined && minRaw !== null && minRaw !== '' && !Number.isNaN(parseFloat(minRaw))
      ? parseFloat(minRaw)
      : null;

  if (sale <= 0) {
    return { ok: false, message: `${label}Sale rate must be greater than zero.` };
  }
  if (p.requirePositivePurchase && (!hasPurchase || purchase <= 0)) {
    return { ok: false, message: `${label}Purchase rate must be greater than zero.` };
  }
  if (hasPurchase && purchase > 0 && sale < purchase) {
    return { ok: false, message: `${label}Sale rate cannot be less than purchase rate.` };
  }
  if (min != null && !Number.isNaN(min)) {
    if (min < 0) {
      return { ok: false, message: `${label}Minimum sale rate cannot be negative.` };
    }
    if (min > 0) {
      if (sale < min) {
        return { ok: false, message: `${label}Sale rate cannot be less than minimum sale rate (₹${min.toFixed(2)}).` };
      }
      if (hasPurchase && purchase > 0 && min < purchase) {
        return { ok: false, message: `${label}Minimum sale rate cannot be less than purchase rate (₹${purchase.toFixed(2)}).` };
      }
    }
  }
  return { ok: true };
}
