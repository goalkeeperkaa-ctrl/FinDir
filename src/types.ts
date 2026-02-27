export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category_name: string;
  category_type: 'income' | 'expense';
  status: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  chartData: any[];
  expenseDistribution: { name: string; value: number }[];
  budgetProgress: { category: string; spent: number; limit: number; percentage: number }[];
}
