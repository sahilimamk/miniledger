export type AuthStackParamList = {
  Login: undefined;
  /** `code` is present only when the server sent one (demo behavior).
      `demo` is informational and absent on old servers; nothing gates on it. */
  Otp: { phone: string; code?: string; demo?: boolean };
};

export type MainStackParamList = {
  Overview: undefined;
  Loans: undefined;
  AddLoan: undefined;
  LoanDetail: { loanId: string };
};
