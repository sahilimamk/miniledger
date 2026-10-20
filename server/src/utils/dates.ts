/** Today's date in server-local time as 'YYYY-MM-DD'. */
export function todayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Overdue = not repaid AND due date before today.
 * Both sides are 'YYYY-MM-DD', so string comparison is exact.
 */
export function isOverdue(dueDate: string, repaid: boolean): boolean {
  if (repaid) return false;
  return dueDate < todayLocal();
}
