/** Loan as returned by the API (see CONTRACT.md — exact field names). */
export interface Loan {
  id: string;
  friendName: string;
  /** Friend's phone for WhatsApp reminders, '+91…' form; null when unset. */
  friendPhone: string | null;
  amount: number; // decimal rupees
  dueDate: string; // 'YYYY-MM-DD'
  note: string | null;
  receiptUrl: string | null;
  repaid: boolean;
  repaidAt: string | null; // ISO timestamp
  isOverdue: boolean;
  createdAt: string; // ISO timestamp
}

/** Raw loans table row as returned by pg. */
export interface LoanRow {
  id: string;
  friend_name: string;
  friend_phone: string | null;
  amount_cents: string; // BIGINT arrives as string
  due_date: string; // DATE kept as 'YYYY-MM-DD' by the pool type parser
  note: string | null;
  receipt_url: string | null;
  repaid_at: Date | null;
  created_at: Date;
}

export interface CreateLoanInput {
  friendName: string;
  amount: number;
  dueDate: string;
  note?: string;
  friendPhone?: string;
}

export interface PatchLoanInput {
  friendName?: string;
  amount?: number;
  dueDate?: string;
  note?: string | null;
  friendPhone?: string | null;
}
