import { api } from './client';
import type { CreateLoanInput, Loan, Summary, UpdateLoanInput } from './types';

export async function listLoans(): Promise<Loan[]> {
  const data = await api.get<{ loans: Loan[] }>('/loans');
  return data.loans;
}

export async function getLoan(id: string): Promise<Loan> {
  return api.get<Loan>(`/loans/${id}`);
}

export async function createLoan(input: CreateLoanInput): Promise<Loan> {
  return api.post<Loan>('/loans', input);
}

export async function updateLoan(id: string, input: UpdateLoanInput): Promise<Loan> {
  return api.patch<Loan>(`/loans/${id}`, input);
}

export async function repayLoan(id: string): Promise<Loan> {
  return api.post<Loan>(`/loans/${id}/repay`);
}

export async function deleteLoan(id: string): Promise<void> {
  await api.delete(`/loans/${id}`);
}

/** Uploads a receipt photo picked on the device (contract: multipart field name is `receipt`). */
export async function uploadReceipt(id: string, imageUri: string): Promise<Loan> {
  const filename = imageUri.split('/').pop() ?? 'receipt.jpg';
  const lower = filename.toLowerCase();
  const type = lower.endsWith('.png')
    ? 'image/png'
    : lower.endsWith('.heic')
      ? 'image/heic'
      : 'image/jpeg';

  const formData = new FormData();
  // React Native's FormData accepts this { uri, name, type } file shape at
  // runtime; the DOM lib typings do not model it, hence the narrow cast.
  const filePart = { uri: imageUri, name: filename, type };
  formData.append('receipt', filePart as unknown as Blob);
  return api.postForm<Loan>(`/loans/${id}/receipt`, formData);
}

export async function getSummary(): Promise<Summary> {
  return api.get<Summary>('/summary');
}
