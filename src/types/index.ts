export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'cash' | 'cashless';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  source: TransactionSource;
  amount: number;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  email: string | null;
  activity: string;
  status: 'success' | 'failed';
  created_at: string;
}