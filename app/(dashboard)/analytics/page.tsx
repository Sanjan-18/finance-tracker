"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Target,
  Activity,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
  balance: number;
};

type ExpenseCategory = {
  name: string;
  value: number;
};

type AnalyticsData = {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    goalSavings: number;
    balance: number;
    savingsRate: number;
    transactionCount?: number;
  };
  monthlyData: MonthlyData[];
  expenseByCategory: ExpenseCategory[];
  topCategories: ExpenseCategory[];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/analytics");

        if (!response.ok) {
          throw new Error("Failed to load analytics");
        }

        const result = await response.json();

        setData(result);
      } catch (err) {
        console.error(err);
        setError("Unable to load analytics data.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const monthlyData = useMemo(() => {
    if (!data?.monthlyData) return [];

    return data.monthlyData.map((item) => ({
      ...item,
      month:
        item.month.length > 7
          ? item.month.substring(0, 7)
          : item.month,
    }));
  }, [data]);

  if (loading) {
    return (
      <main className="analytics-page">
        <div className="analytics-loading">
          <div className="analytics-spinner" />
          <p>Loading your analytics...</p>
        </div>

        <style jsx>{`
          .analytics-page {
            min-height: 100vh;
            padding: 32px;
            background: var(--finance-bg);
          }

          .analytics-loading {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            color: var(--finance-text-muted);
          }

          .analytics-spinner {
            width: 38px;
            height: 38px;
            border: 4px solid var(--finance-border);
            border-top-color: var(--finance-primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 768px) {
            .analytics-page {
              padding: 20px;
            }
          }
        `}</style>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="analytics-page">
        <div className="analytics-error">
          <Activity size={42} />
          <h2>Analytics unavailable</h2>
          <p>{error || "No analytics data available."}</p>
        </div>

        <style jsx>{`
          .analytics-page {
            min-height: 100vh;
            padding: 32px;
            background: var(--finance-bg);
          }

          .analytics-error {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: var(--finance-text-muted);
          }

          .analytics-error h2 {
            margin: 16px 0 6px;
            color: var(--finance-text);
          }

          .analytics-error p {
            margin: 0;
          }
        `}</style>
      </main>
    );
  }

  const {
    totalIncome,
    totalExpenses,
    goalSavings,
    balance,
    savingsRate,
  } = data.summary;

  return (
    <main className="analytics-page">
      {/* Header */}
      <section className="page-header">
        <div>
          <div className="eyebrow">
            <BarChart3 size={16} />
            FINANCIAL INSIGHTS
          </div>

          <h1>Analytics</h1>

          <p>
            Understand your income, spending patterns and
            financial progress.
          </p>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="summary-grid">
        <SummaryCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp size={21} />}
          description="Money received"
          type="income"
        />

        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={<TrendingDown size={21} />}
          description="Money spent"
          type="expense"
        />

        <SummaryCard
          title="Goal Savings"
          value={formatCurrency(goalSavings)}
          icon={<Target size={21} />}
          description="Amount saved toward goals"
          type="goal"
        />

        <SummaryCard
          title="Current Balance"
          value={formatCurrency(balance)}
          icon={<Wallet size={21} />}
          description="Income minus expenses"
          type="balance"
        />

        <SummaryCard
          title="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          icon={<PiggyBank size={21} />}
          description="Percentage of income saved"
          type="savings"
        />
      </section>

      {/* Goal Savings Overview */}
      <section className="goal-savings-card">
        <div className="goal-savings-left">
          <div className="goal-icon">
            <Target size={22} />
          </div>

          <div>
            <h2>Goal Savings</h2>
            <p>
              Total amount currently saved across all
              your financial goals.
            </p>
          </div>
        </div>

        <div className="goal-savings-value">
          {formatCurrency(goalSavings)}
        </div>
      </section>

      {/* Main Charts */}
      <section className="charts-grid">
        {/* Income vs Expenses */}
        <div className="chart-card chart-large">
          <div className="chart-header">
            <div>
              <h2>Income vs Expenses</h2>
              <p>Monthly financial activity</p>
            </div>

            <div className="chart-icon">
              <BarChart3 size={20} />
            </div>
          </div>

          {monthlyData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--finance-border)"
                  />

                  <XAxis
                    dataKey="month"
                    tick={{
                      fill: "var(--finance-text-muted)",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "var(--finance-text-muted)",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                    contentStyle={{
                      borderRadius: "12px",
                      border:
                        "1px solid var(--finance-border)",
                      background:
                        "var(--finance-surface)",
                      color: "var(--finance-text)",
                      boxShadow:
                        "0 10px 30px rgba(15,23,42,0.08)",
                    }}
                  />

                  <Legend />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#10b981"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#ef4444"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No monthly data available yet." />
          )}
        </div>

        {/* Expense Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2>Expense Distribution</h2>
              <p>Where your money goes</p>
            </div>

            <div className="chart-icon">
              <Wallet size={20} />
            </div>
          </div>

          {data.expenseByCategory.length > 0 ? (
            <div className="pie-wrapper">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={data.expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {data.expenseByCategory.map(
                      (category, index) => (
                        <Cell
                          key={`cell-${category.name}-${index}`}
                          fill={
                            COLORS[index % COLORS.length]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                    contentStyle={{
                      borderRadius: "12px",
                      border:
                        "1px solid var(--finance-border)",
                      background:
                        "var(--finance-surface)",
                      color: "var(--finance-text)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No expense data available yet." />
          )}

          <div className="category-legend">
            {data.expenseByCategory
              .slice(0, 6)
              .map((category, index) => (
                <div
                  className="legend-item"
                  key={category.name}
                >
                  <div className="legend-left">
                    <span
                      className="legend-dot"
                      style={{
                        background:
                          COLORS[index % COLORS.length],
                      }}
                    />

                    <span>{category.name}</span>
                  </div>

                  <strong>
                    {formatCurrency(category.value)}
                  </strong>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Balance Trend */}
      <section className="chart-card balance-card">
        <div className="chart-header">
          <div>
            <h2>Balance Trend</h2>
            <p>
              How your financial position changes over time
            </p>
          </div>

          <div className="chart-icon">
            <TrendingUp size={20} />
          </div>
        </div>

        {monthlyData.length > 0 ? (
          <div className="balance-chart">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={monthlyData}
                margin={{
                  top: 10,
                  right: 15,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--finance-border)"
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fill: "var(--finance-text-muted)",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fill: "var(--finance-text-muted)",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(value))
                  }
                  contentStyle={{
                    borderRadius: "12px",
                    border:
                      "1px solid var(--finance-border)",
                    background:
                      "var(--finance-surface)",
                    color: "var(--finance-text)",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#4f46e5",
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="No balance data available yet." />
        )}
      </section>

      {/* Top Spending Categories */}
      <section className="chart-card top-category-card">
        <div className="chart-header">
          <div>
            <h2>Top Spending Categories</h2>
            <p>Your highest expense categories</p>
          </div>

          <div className="chart-icon">
            <Activity size={20} />
          </div>
        </div>

        {data.topCategories.length > 0 ? (
          <div className="top-categories">
            {data.topCategories.map(
              (category, index) => {
                const maxValue =
                  data.topCategories[0]?.value || 1;

                const percentage =
                  (category.value / maxValue) * 100;

                return (
                  <div
                    className="top-category"
                    key={category.name}
                  >
                    <div className="top-category-info">
                      <div className="rank">
                        {index + 1}
                      </div>

                      <div className="category-name">
                        <strong>
                          {category.name}
                        </strong>

                        <div className="category-progress">
                          <div
                            className="category-progress-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="category-value">
                        {formatCurrency(category.value)}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="empty-state">
            <Activity size={36} />
            <p>No spending categories yet.</p>
          </div>
        )}
      </section>

      <style jsx>{`
        .analytics-page {
          min-height: 100vh;
          padding: 32px;
          background: var(--finance-bg);
          box-sizing: border-box;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--finance-primary);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.2px;
          margin-bottom: 8px;
        }

        .page-header h1 {
          margin: 0;
          color: var(--finance-text);
          font-size: 32px;
          line-height: 1.2;
          font-weight: 800;
        }

        .page-header p {
          margin: 8px 0 0;
          color: var(--finance-text-muted);
          font-size: 14px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(
            5,
            minmax(0, 1fr)
          );
          gap: 18px;
          margin-bottom: 22px;
        }

        .summary-card {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--finance-shadow);
        }

        .summary-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .summary-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-label {
          color: var(--finance-text-muted);
          font-size: 13px;
          font-weight: 600;
        }

        .summary-value {
          color: var(--finance-text);
          font-size: 25px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .summary-description {
          color: var(--finance-text-light);
          font-size: 12px;
        }

        .goal-savings-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 22px;
          margin-bottom: 22px;
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 18px;
          box-shadow: var(--finance-shadow);
        }

        .goal-savings-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .goal-icon {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: var(--finance-primary-light);
          color: var(--finance-primary);
        }

        .goal-savings-left h2 {
          margin: 0;
          color: var(--finance-text);
          font-size: 17px;
          font-weight: 800;
        }

        .goal-savings-left p {
          margin: 5px 0 0;
          color: var(--finance-text-muted);
          font-size: 12px;
        }

        .goal-savings-value {
          color: var(--finance-primary);
          font-size: 25px;
          font-weight: 800;
          white-space: nowrap;
        }

        .charts-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.5fr)
            minmax(320px, 1fr);
          gap: 22px;
          margin-bottom: 22px;
        }

        .chart-card {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 18px;
          padding: 22px;
          box-shadow: var(--finance-shadow);
          box-sizing: border-box;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 18px;
        }

        .chart-header h2 {
          margin: 0;
          color: var(--finance-text);
          font-size: 17px;
          font-weight: 800;
        }

        .chart-header p {
          margin: 5px 0 0;
          color: var(--finance-text-light);
          font-size: 12px;
        }

        .chart-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--finance-primary);
          background: var(--finance-primary-light);
          flex-shrink: 0;
        }

        .chart-container {
          width: 100%;
          height: 320px;
        }

        .pie-wrapper {
          width: 100%;
          height: 250px;
        }

        .category-legend {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }

        .legend-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 12px;
        }

        .legend-left {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--finance-text-secondary);
          min-width: 0;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-item strong {
          color: var(--finance-text);
          font-size: 12px;
          white-space: nowrap;
        }

        .balance-card {
          margin-bottom: 22px;
        }

        .balance-chart {
          width: 100%;
          height: 300px;
        }

        .top-category-card {
          margin-bottom: 30px;
        }

        .top-categories {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .top-category-info {
          display: grid;
          grid-template-columns:
            36px minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
        }

        .rank {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--finance-primary-light);
          color: var(--finance-primary);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 800;
        }

        .category-name {
          min-width: 0;
        }

        .category-name strong {
          display: block;
          color: var(--finance-text-secondary);
          font-size: 13px;
          margin-bottom: 7px;
        }

        .category-progress {
          height: 7px;
          background: var(--finance-border-light);
          border-radius: 999px;
          overflow: hidden;
        }

        .category-progress-fill {
          height: 100%;
          background: #4f46e5;
          border-radius: inherit;
          transition: width 0.3s ease;
        }

        .category-value {
          color: var(--finance-text);
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .empty-state {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: var(--finance-text-light);
          gap: 10px;
        }

        .empty-state p {
          margin: 0;
          font-size: 13px;
        }

        @media (max-width: 1200px) {
          .summary-grid {
            grid-template-columns: repeat(
              3,
              minmax(0, 1fr)
            );
          }
        }

        @media (max-width: 1100px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .analytics-page {
            padding: 20px;
          }

          .page-header h1 {
            font-size: 26px;
          }

          .summary-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
          }

          .goal-savings-card {
            align-items: flex-start;
            flex-direction: column;
          }

          .goal-savings-value {
            padding-left: 60px;
          }

          .chart-card {
            padding: 18px;
            border-radius: 15px;
          }

          .chart-container {
            height: 280px;
          }

          .balance-chart {
            height: 270px;
          }

          .pie-wrapper {
            height: 230px;
          }
        }

        @media (max-width: 480px) {
          .analytics-page {
            padding: 15px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .top-category-info {
            grid-template-columns:
              32px minmax(0, 1fr);
          }

          .category-value {
            grid-column: 2;
          }

          .page-header h1 {
            font-size: 24px;
          }

          .goal-savings-left {
            align-items: flex-start;
          }

          .goal-savings-value {
            padding-left: 0;
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  description,
  type,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  type:
    | "income"
    | "expense"
    | "balance"
    | "savings"
    | "goal";
}) {
  const styles = {
    income: {
      background: "#ecfdf5",
      color: "#059669",
    },
    expense: {
      background: "#fef2f2",
      color: "#dc2626",
    },
    balance: {
      background: "#eef2ff",
      color: "#4f46e5",
    },
    savings: {
      background: "#fff7ed",
      color: "#ea580c",
    },
    goal: {
      background: "#eef2ff",
      color: "#4f46e5",
    },
  };

  const style = styles[type];

  return (
    <div className="summary-card">
      <div className="summary-card-top">
        <span className="summary-label">
          {title}
        </span>

        <div
          className="summary-icon"
          style={{
            background: style.background,
            color: style.color,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="summary-value">
        {value}
      </div>

      <div className="summary-description">
        {description}
      </div>

      <style jsx>{`
        .summary-card {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--finance-shadow);
        }

        .summary-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .summary-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-label {
          color: var(--finance-text-muted);
          font-size: 13px;
          font-weight: 600;
        }

        .summary-value {
          color: var(--finance-text);
          font-size: 25px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .summary-description {
          color: var(--finance-text-light);
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

function EmptyChart({
  message,
}: {
  message: string;
}) {
  return (
    <div className="empty-chart">
      <BarChart3 size={36} />
      <p>{message}</p>

      <style jsx>{`
        .empty-chart {
          height: 250px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: var(--finance-text-light);
          gap: 10px;
        }

        .empty-chart p {
          margin: 0;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}