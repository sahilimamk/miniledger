// Money and date formatting for display. This is the app's single conversion
// point between decimal rupees (what the API speaks) and what the user sees —
// see CONTRACT.md. Amounts are handled in integer paise internally so binary
// floating point never leaks into a displayed figure.

/** Converts a decimal-rupee amount to integer paise, rounding half up. */
export function toPaise(amount: number): number {
  return Math.round(amount * 100);
}

/** Groups a digit string the Indian way: last three digits, then pairs. "1234567" -> "12,34,567". */
function groupIndian(digits: string): string {
  if (digits.length <= 3) {
    return digits;
  }
  const lastThree = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const pairs: string[] = [];
  while (rest.length > 2) {
    pairs.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) {
    pairs.unshift(rest);
  }
  return [...pairs, lastThree].join(',');
}

/**
 * Formats a decimal-rupee amount as "₹12,34,567.50".
 * Paise are shown only when the amount is not a whole number of rupees.
 */
export function formatINR(amount: number): string {
  const paise = toPaise(amount);
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const remainder = abs % 100;
  const grouped = groupIndian(String(rupees));
  const decimals = remainder > 0 ? `.${String(remainder).padStart(2, '0')}` : '';
  return `${sign}₹${grouped}${decimals}`;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "2026-11-01" -> "1 Nov 2026". Parsed by hand so timezones never shift the day. */
export function formatDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    return isoDate;
  }
  const [year, month, day] = parts;
  const monthIndex = Number(month) - 1;
  const monthName = MONTH_NAMES[monthIndex] ?? month;
  return `${Number(day)} ${monthName} ${year}`;
}

/** ISO timestamp -> "1 Nov 2026, 4:30 pm" in the device's locale/timezone. */
export function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return isoTimestamp;
  }
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Today's date as a local YYYY-MM-DD string. */
export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Whole days from today until an ISO date-only string (negative when past).
 * Parsed as UTC midnights so timezones never shift the count.
 */
export function daysUntil(isoDate: string): number {
  const parse = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  };
  return Math.round((parse(isoDate) - parse(todayIsoDate())) / 86_400_000);
}
