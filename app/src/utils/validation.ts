// Field validators mirroring the server rules in CONTRACT.md.
// Each returns a human-readable error string, or null when the value is valid.

/** Contract: 10–15 digits, optional leading "+". Spaces are ignored. */
export function validatePhone(raw: string): string | null {
  const phone = raw.replace(/[\s-]/g, '');
  if (phone.length === 0) {
    return 'Enter your phone number.';
  }
  if (!/^\+?\d{10,15}$/.test(phone)) {
    return 'Enter a valid phone number (10–15 digits).';
  }
  return null;
}

/** Normalises a phone for the API: strips spaces, keeps a leading "+". */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

/**
 * Masks a phone for display: keeps the country code (when the number is
 * longer than 10 digits) and the last 4 digits, bullets the rest.
 * e.g. +919999000111 -> "+91 ••••••0111".
 */
export function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 4) return raw;
  const last4 = digits.slice(-4);
  const national = digits.length > 10 ? digits.slice(-10) : digits;
  const cc = digits.length > 10 ? `+${digits.slice(0, -10)} ` : '';
  return `${cc}${'•'.repeat(Math.max(0, national.length - 4))}${last4}`;
}

/** Contract: exactly 6 digits. */
export function validateOtpCode(raw: string): string | null {
  const code = raw.trim();
  if (!/^\d{6}$/.test(code)) {
    return 'Enter the 6-digit code.';
  }
  return null;
}

/** Contract: non-empty, at most 80 characters. */
export function validateFriendName(raw: string): string | null {
  const name = raw.trim();
  if (name.length === 0) {
    return "Enter your friend's name.";
  }
  if (name.length > 80) {
    return 'Name must be 80 characters or fewer.';
  }
  return null;
}

/**
 * Parses a typed amount ("250", "250.5", "250.50") into decimal rupees.
 * Returns null when the text is not a clean amount with at most 2 decimals.
 */
export function parseAmount(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** Contract: amount > 0, at most 10,000,000, max 2 decimal places. */
export function validateAmount(raw: string): string | null {
  const text = raw.trim();
  if (text.length === 0) {
    return 'Enter an amount.';
  }
  if (/^\d+\.\d{3,}$/.test(text)) {
    return 'Amount can have at most 2 decimal places.';
  }
  const value = parseAmount(text);
  if (value === null) {
    return 'Enter a valid amount.';
  }
  if (value <= 0) {
    return 'Amount must be more than zero.';
  }
  if (value > 10_000_000) {
    return 'Amount must be ₹1,00,00,000 or less.';
  }
  return null;
}

/** Contract: a real calendar date in YYYY-MM-DD form. */
export function validateDueDate(raw: string): string | null {
  const text = raw.trim();
  if (text.length === 0) {
    return 'Enter a due date.';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    return 'Use the format YYYY-MM-DD.';
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Round-trip through Date to reject impossible dates such as 2026-02-31.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return 'Enter a real calendar date.';
  }
  return null;
}
