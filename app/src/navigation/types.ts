export type AuthStackParamList = {
  Login: undefined;
  /** `code` is present only when the server runs in demo mode. */
  Otp: { phone: string; code?: string; demo: boolean };
};

export type MainStackParamList = {
  Overview: undefined;
  Loans: undefined;
  AddLoan: undefined;
  LoanDetail: { loanId: string };
};
