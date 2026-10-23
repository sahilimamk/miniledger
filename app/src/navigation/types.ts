export type AuthStackParamList = {
  Login: undefined;
  Otp: { phone: string };
};

export type MainStackParamList = {
  Overview: undefined;
  Loans: undefined;
  AddLoan: undefined;
  LoanDetail: { loanId: string };
};
