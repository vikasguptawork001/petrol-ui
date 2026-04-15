/** India Standard Time (IST, Asia/Kolkata) for all business dates and datetimes */

const IST = 'Asia/Kolkata';

function collectISTParts(date, options) {
  const d = new Date(date);
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: IST, ...options });
  const parts = {};
  for (const x of f.formatToParts(d)) {
    if (x.type !== 'literal') parts[x.type] = x.value;
  }
  return parts;
}

/**
 * Parse MySQL DATETIME strings (stored in IST / session +05:30) so JS does not treat them as UTC.
 * Use before formatInIndiaTime when displaying opening_at / closing_at from the API.
 */
export const parseMysqlDatetimeIST = (s) => {
  if (s == null || s === '') return null;
  if (s instanceof Date) return Number.isNaN(s.getTime()) ? null : s;
  const str = String(s).trim();
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    const [, y, mo, d, h, mi, se] = m;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}+05:30`);
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Format date/time in India timezone for display */
export const formatInIndiaTime = (date) => {
  if (!date) return '-';
  const d = date instanceof Date ? date : parseMysqlDatetimeIST(date) || new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN', {
    timeZone: IST,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

/** Date only in India timezone — always DD/MM/YYYY */
export const formatDateInIndia = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  const p = collectISTParts(d, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${p.day}/${p.month}/${p.year}`;
};

/** Alias: explicit DD/MM/YYYY for display (same as formatDateInIndia). */
export const formatDateDDMMYYYY = formatDateInIndia;

/**
 * Calendar date in IST as YYYY-MM-DD (API filters, filenames, server payloads)
 */
export const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const p = collectISTParts(d, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${p.year}-${p.month}-${p.day}`;
};

/**
 * ISO-like string in IST: YYYY-MM-DDTHH:mm:ss.sss (no timezone suffix)
 */
export const getLocalISOString = (date = new Date()) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
  });
  const parts = {};
  for (const x of f.formatToParts(d)) {
    if (x.type !== 'literal') parts[x.type] = x.value;
  }
  const frac = parts.fractionalSecond != null ? parts.fractionalSecond : String(d.getMilliseconds()).padStart(3, '0');
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${frac}`;
};
