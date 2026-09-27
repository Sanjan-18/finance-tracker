export type TransactionKind = "INCOME" | "EXPENSE";

export interface DashboardSummary {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
}
