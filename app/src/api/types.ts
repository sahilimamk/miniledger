// API entity types — these mirror the shared contract in CONTRACT.md exactly.

export interface User {
  id: string;
  phone: string;
}

export interface Loan {
  id: string;
  friendName: string;
  /** Friend's phone ('+91…' form) for WhatsApp reminders, or null. */
  friendPhone: string | null;
  /** Decimal rupees, e.g. 250.5 */
  amount: number;
  /** YYYY-MM-DD */
  dueDate: string;
  note: string | null;
  /** Server-relative path such as "/uploads/abc.jpg", or null. */
  receiptUrl: string | null;
  repaid: boolean;
  /** ISO timestamp, or null while pending. */
  repaidAt: string | null;
  /** Computed by the server: pending AND dueDate before today. */
  isOverdue: boolean;
  createdAt: string;
}

export interface SummaryCounts {
  total: number;
  repaid: number;
  pending: number;
  overdue: number;
}

export interface Summary {
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  overdueAmount: number;
  counts: SummaryCounts;
}

export interface CreateLoanInput {
  friendName: string;
  amount: number;
  dueDate: string;
  note?: string;
  friendPhone?: string;
}

export interface UpdateLoanInput {
  friendName?: string;
  amount?: number;
  dueDate?: string;
  note?: string;
  friendPhone?: string | null;
}

export interface VerifyOtpResponse {
  token: string;
  user: User;
}
