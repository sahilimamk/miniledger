export type AuthStackParamList = {
  Login: undefined;
  /**
   * `demo` is the explicit demo-mode declaration from the server and the
   * ONLY gate for showing a code: `code` is rendered only when
   * `demo === true`. A `code` arriving with `demo` absent or false (e.g.
   * a legacy server) is discarded by api/auth.ts and must never be shown.
   */
  Otp: { phone: string; code?: string; demo?: boolean };
};

export type MainStackParamList = {
  Overview: undefined;
  Loans: undefined;
  AddLoan: undefined;
  LoanDetail: { loanId: string };
};
