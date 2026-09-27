"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Summary = {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  goalSavings: number;
  savingsRate: number;
};

type IncomeExpenseData = {
  name: string;
  amount: number;
};

type ExpenseCategoryData = {
  name: string;
  amount: number;
};

type RecentTransaction = {
  id: string;
  description: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: string;
  category: string;
};

type DashboardData = {
  summary: Summary;

  charts: {
    incomeExpense: IncomeExpenseData[];
    expenseByCategory: ExpenseCategoryData[];
  };

  recentTransactions: RecentTransaction[];
};

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [darkMode, setDarkMode] =
    useState(false);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/dashboard"
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to load dashboard"
        );
      }

      setData(result);
    } catch (error) {
      console.error(error);

      setError(
        "Could not load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const updateTheme = () => {
      setDarkMode(
        document.documentElement.classList.contains(
          "dark"
        )
      );
    };

    updateTheme();

    const observer =
      new MutationObserver(updateTheme);

    observer.observe(
      document.documentElement,
      {
        attributes: true,
        attributeFilter: ["class"],
      }
    );

    return () => observer.disconnect();
  }, []);

  function formatCurrency(
    amount: number
  ) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(amount);
  }

  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleDateString("en-IN");
  }

  if (loading) {
    return (
      <main className="finance-page-wrapper">
        <div className="finance-container">
          <div style={loadingCardStyle}>
            <div style={loadingIconStyle}>
              ₹
            </div>

            <h2 style={loadingTitleStyle}>
              Loading your dashboard
            </h2>

            <p style={loadingTextStyle}>
              Preparing your financial
              overview...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="finance-page-wrapper">
        <div className="finance-container">
          <div style={errorCardStyle}>
            <div style={errorIconStyle}>
              !
            </div>

            <h2 style={errorTitleStyle}>
              Dashboard unavailable
            </h2>

            <p style={errorTextStyle}>
              {error ||
                "Dashboard data unavailable."}
            </p>

            <button
              onClick={loadDashboard}
              style={buttonStyle}
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const {
    summary,
    charts,
    recentTransactions,
  } = data;

  const chartGridColor = darkMode
    ? "#334155"
    : "#e5e7eb";

  const chartTextColor = darkMode
    ? "#cbd5e1"
    : "#64748b";

  const tooltipBackground = darkMode
    ? "#172033"
    : "#ffffff";

  const tooltipBorder = darkMode
    ? "#334155"
    : "#e5e7eb";

  return (
    <main className="finance-page-wrapper">
      <div className="finance-container">

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <header className="dashboard-header">
          <div>
            <p style={eyebrowStyle}>
              FINANCIAL OVERVIEW
            </p>

            <h1 className="dashboard-title">
              Dashboard
            </h1>

            <p style={subtitleStyle}>
              Here's an overview of your
              financial activity.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <Link
              href="/goals"
              style={goalButtonStyle}
            >
              + Goal Savings
            </Link>

            <Link
              href="/transactions"
              style={addTransactionButtonStyle}
            >
              <span
                style={{
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                +
              </span>

              Add Transaction
            </Link>
          </div>
        </header>

        {/* ================================= */}
        {/* SUMMARY CARDS */}
        {/* ================================= */}

        <section style={summaryGridStyle}>

          <SummaryCard
            title="Total Balance"
            value={formatCurrency(
              summary.balance
            )}
            subtitle="Income minus expenses"
            icon="₹"
          />

          <SummaryCard
            title="Total Income"
            value={formatCurrency(
              summary.totalIncome
            )}
            subtitle="All recorded income"
            icon="↗"
          />

          <SummaryCard
            title="Total Expenses"
            value={formatCurrency(
              summary.totalExpenses
            )}
            subtitle="All recorded expenses"
            icon="↘"
          />

          <SummaryCard
            title="Goal Savings"
            value={formatCurrency(
              summary.goalSavings
            )}
            subtitle="Money saved toward goals"
            icon="🎯"
          />

          <SummaryCard
            title="Savings Rate"
            value={`${summary.savingsRate.toFixed(
              1
            )}%`}
            subtitle="Based on current data"
            icon="%"
          />

        </section>

        {/* ================================= */}
        {/* CHARTS */}
        {/* ================================= */}

        <section style={chartsGridStyle}>

          {/* INCOME VS EXPENSES */}

          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h2 style={cardTitleStyle}>
                  Income vs Expenses
                </h2>

                <p
                  style={cardDescriptionStyle}
                >
                  Overall financial comparison
                </p>
              </div>

              <div style={chartIconStyle}>
                ↕
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: 320,
                marginTop: 20,
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    charts.incomeExpense
                  }
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
                    stroke={chartGridColor}
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: chartTextColor,
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: chartTextColor,
                      fontSize: 12,
                    }}
                  />

                  <Tooltip
                    formatter={(
                      value
                    ) =>
                      formatCurrency(
                        Number(value)
                      )
                    }
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${tooltipBorder}`,
                      background:
                        tooltipBackground,
                      color:
                        "var(--finance-text)",
                    }}
                    labelStyle={{
                      color:
                        "var(--finance-text)",
                    }}
                    itemStyle={{
                      color:
                        "var(--finance-text)",
                    }}
                  />

                  <Bar
                    dataKey="amount"
                    fill={
                      darkMode
                        ? "#818cf8"
                        : "#172033"
                    }
                    radius={[
                      7,
                      7,
                      0,
                      0,
                    ]}
                    barSize={55}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* EXPENSE BY CATEGORY */}

          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h2 style={cardTitleStyle}>
                  Expenses by Category
                </h2>

                <p
                  style={cardDescriptionStyle}
                >
                  Where your money is going
                </p>
              </div>

              <div style={chartIconStyle}>
                ◒
              </div>
            </div>

            {charts.expenseByCategory
              .length === 0 ? (
              <div
                style={
                  emptyChartStyle
                }
              >
                <div
                  style={
                    emptyIconStyle
                  }
                >
                  ₹
                </div>

                <p>
                  No expense data yet.
                </p>

                <Link
                  href="/transactions"
                  style={
                    emptyLinkStyle
                  }
                >
                  Add your first transaction →
                </Link>
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 320,
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={
                        charts.expenseByCategory
                      }
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={55}
                      paddingAngle={2}
                    >
                      {charts.expenseByCategory.map(
                        (
                          entry,
                          index
                        ) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              chartColors[
                                index %
                                  chartColors.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={(
                        value
                      ) =>
                        formatCurrency(
                          Number(value)
                        )
                      }
                      contentStyle={{
                        borderRadius: 10,
                        border: `1px solid ${tooltipBorder}`,
                        background:
                          tooltipBackground,
                        color:
                          "var(--finance-text)",
                      }}
                      labelStyle={{
                        color:
                          "var(--finance-text)",
                      }}
                      itemStyle={{
                        color:
                          "var(--finance-text)",
                      }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{
                        color:
                          "var(--finance-text-secondary)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </section>

        {/* ================================= */}
        {/* RECENT TRANSACTIONS */}
        {/* ================================= */}

        <section style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h2 style={cardTitleStyle}>
                Recent Transactions
              </h2>

              <p
                style={cardDescriptionStyle}
              >
                Your latest financial activity
              </p>
            </div>

            <Link
              href="/transactions"
              style={viewAllStyle}
            >
              View All →
            </Link>
          </div>

          {recentTransactions.length ===
          0 ? (
            <div
              style={
                emptyTransactionsStyle
              }
            >
              <div
                style={emptyIconStyle}
              >
                ₹
              </div>

              <h3
                style={{
                  color:
                    "var(--finance-text)",
                }}
              >
                No transactions yet
              </h3>

              <p>
                Start recording your
                income and expenses.
              </p>

              <Link
                href="/transactions"
                style={buttonStyle}
              >
                Add Transaction
              </Link>
            </div>
          ) : (
            <div className="finance-responsive-table">
              <table
                style={tableStyle}
              >
                <thead>
                  <tr>
                    <th
                      style={
                        tableHeaderStyle
                      }
                    >
                      Description
                    </th>

                    <th
                      style={
                        tableHeaderStyle
                      }
                    >
                      Category
                    </th>

                    <th
                      style={
                        tableHeaderStyle
                      }
                    >
                      Type
                    </th>

                    <th
                      style={{
                        ...tableHeaderStyle,
                        textAlign:
                          "right",
                      }}
                    >
                      Amount
                    </th>

                    <th
                      style={{
                        ...tableHeaderStyle,
                        textAlign:
                          "right",
                      }}
                    >
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentTransactions.map(
                    (transaction) => (
                      <tr
                        key={
                          transaction.id
                        }
                      >
                        <td
                          style={
                            tableCellStyle
                          }
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                ...transactionIconStyle,
                                background:
                                  transaction.type ===
                                  "INCOME"
                                    ? "var(--finance-success-light)"
                                    : "var(--finance-danger-light)",
                                color:
                                  transaction.type ===
                                  "INCOME"
                                    ? "var(--finance-success)"
                                    : "var(--finance-danger)",
                              }}
                            >
                              {transaction.type ===
                              "INCOME"
                                ? "↗"
                                : "↘"}
                            </div>

                            <span
                              style={{
                                fontWeight: 600,
                                color:
                                  "var(--finance-text)",
                              }}
                            >
                              {
                                transaction.description
                              }
                            </span>
                          </div>
                        </td>

                        <td
                          style={
                            tableCellStyle
                          }
                        >
                          <span
                            style={
                              categoryBadgeStyle
                            }
                          >
                            {
                              transaction.category
                            }
                          </span>
                        </td>

                        <td
                          style={
                            tableCellStyle
                          }
                        >
                          <span
                            style={{
                              ...typeBadgeStyle,
                              background:
                                transaction.type ===
                                "INCOME"
                                  ? "var(--finance-success-light)"
                                  : "var(--finance-danger-light)",
                              color:
                                transaction.type ===
                                "INCOME"
                                  ? "var(--finance-success)"
                                  : "var(--finance-danger)",
                            }}
                          >
                            {
                              transaction.type
                            }
                          </span>
                        </td>

                        <td
                          style={{
                            ...tableCellStyle,
                            textAlign:
                              "right",
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              color:
                                transaction.type ===
                                "INCOME"
                                  ? "var(--finance-success)"
                                  : "var(--finance-danger)",
                            }}
                          >
                            {transaction.type ===
                            "INCOME"
                              ? "+"
                              : "-"}
                            {formatCurrency(
                              transaction.amount
                            )}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tableCellStyle,
                            textAlign:
                              "right",
                            color:
                              "var(--finance-text-muted)",
                          }}
                        >
                          {formatDate(
                            transaction.date
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

/* ================================= */
/* SUMMARY CARD */
/* ================================= */

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <div style={summaryCardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color:
                "var(--finance-text-muted)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {title}
          </p>

          <h2
            style={{
              margin:
                "10px 0 6px",
              fontSize: 25,
              color:
                "var(--finance-text)",
              letterSpacing:
                "-0.5px",
            }}
          >
            {value}
          </h2>
        </div>

        <div
          style={
            summaryIconStyle
          }
        >
          {icon}
        </div>
      </div>

      <p
        style={{
          margin: 0,
          color:
            "var(--finance-text-light)",
          fontSize: 12,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

/* ================================= */
/* PAGE STYLES */
/* ================================= */

/* pageStyle and containerStyle are now handled by finance-page-wrapper and finance-container CSS classes */

const headerStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "flex-end",
  gap: 20,
  flexWrap:
    "wrap" as const,
};

const eyebrowStyle = {
  margin: 0,
  color:
    "var(--finance-text-muted)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.5,
};

const titleStyle = {
  margin:
    "6px 0 0",
  fontSize: 34,
  lineHeight: 1.15,
  color:
    "var(--finance-text)",
  letterSpacing: "-1px",
};

const subtitleStyle = {
  margin:
    "8px 0 0",
  color:
    "var(--finance-text-muted)",
  fontSize: 14,
};

const addTransactionButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding:
    "11px 17px",
  borderRadius: 9,
  background:
    "var(--finance-sidebar)",
  color:
    "var(--finance-sidebar-text)",
  textDecoration:
    "none",
  fontSize: 14,
  fontWeight: 600,
  whiteSpace:
    "nowrap" as const,
};

const goalButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding:
    "11px 17px",
  borderRadius: 9,
  background:
    "var(--finance-primary)",
  color: "#ffffff",
  textDecoration:
    "none",
  fontSize: 14,
  fontWeight: 600,
  whiteSpace:
    "nowrap" as const,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 16,
  marginTop: 30,
};

const summaryCardStyle = {
  background:
    "var(--finance-surface)",
  padding: 21,
  borderRadius: 14,
  border:
    "1px solid var(--finance-border)",
  boxShadow:
    "var(--finance-shadow)",
};

const summaryIconStyle = {
  width: 38,
  height: 38,
  borderRadius: 9,
  background:
    "var(--finance-primary-light)",
  color:
    "var(--finance-primary)",
  display: "grid",
  placeItems: "center",
  fontSize: 17,
  fontWeight: 700,
};

const chartsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(380px, 1fr))",
  gap: 20,
  marginTop: 22,
};

const cardStyle = {
  background:
    "var(--finance-surface)",
  padding: 24,
  borderRadius: 14,
  border:
    "1px solid var(--finance-border)",
  boxShadow:
    "var(--finance-shadow)",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
  gap: 15,
};

const cardTitleStyle = {
  margin: 0,
  fontSize: 17,
  color:
    "var(--finance-text)",
};

const cardDescriptionStyle = {
  margin:
    "5px 0 0",
  color:
    "var(--finance-text-muted)",
  fontSize: 12,
};

const chartIconStyle = {
  width: 34,
  height: 34,
  borderRadius: 8,
  background:
    "var(--finance-surface-secondary)",
  color:
    "var(--finance-text)",
  display: "grid",
  placeItems: "center",
  fontWeight: 700,
};

const viewAllStyle = {
  color:
    "var(--finance-primary)",
  fontSize: 13,
  fontWeight: 700,
  textDecoration:
    "none",
};

const tableStyle = {
  width: "100%",
  borderCollapse:
    "collapse" as const,
  minWidth: 760,
};

const tableHeaderStyle = {
  padding:
    "11px 10px",
  borderBottom:
    "1px solid var(--finance-border)",
  textAlign:
    "left" as const,
  color:
    "var(--finance-text-muted)",
  fontSize: 11,
  fontWeight: 700,
  textTransform:
    "uppercase" as const,
  letterSpacing: 0.5,
};

const tableCellStyle = {
  padding:
    "13px 10px",
  borderBottom:
    "1px solid var(--finance-border-light)",
  textAlign:
    "left" as const,
  fontSize: 13,
  color:
    "var(--finance-text)",
};

const transactionIconStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  display: "grid",
  placeItems: "center",
  fontSize: 14,
  fontWeight: 700,
};

const categoryBadgeStyle = {
  display: "inline-block",
  padding:
    "5px 9px",
  borderRadius: 6,
  background:
    "var(--finance-surface-secondary)",
  color:
    "var(--finance-text-secondary)",
  fontSize: 11,
  fontWeight: 600,
};

const typeBadgeStyle = {
  display: "inline-block",
  padding:
    "5px 9px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 700,
};

const emptyChartStyle = {
  height: 320,
  display: "grid",
  placeItems: "center",
  alignContent:
    "center",
  color:
    "var(--finance-text-muted)",
  textAlign:
    "center" as const,
};

const emptyTransactionsStyle = {
  minHeight: 250,
  display: "grid",
  placeItems: "center",
  alignContent:
    "center",
  textAlign:
    "center" as const,
  color:
    "var(--finance-text-muted)",
};

const emptyIconStyle = {
  width: 48,
  height: 48,
  borderRadius: 12,
  background:
    "var(--finance-surface-secondary)",
  color:
    "var(--finance-primary)",
  display: "grid",
  placeItems: "center",
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 10,
};

const emptyLinkStyle = {
  color:
    "var(--finance-primary)",
  fontWeight: 600,
  textDecoration:
    "none",
};

const buttonStyle = {
  display: "inline-block",
  marginTop: 12,
  padding:
    "10px 16px",
  borderRadius: 8,
  background:
    "var(--finance-primary)",
  color: "#ffffff",
  textDecoration:
    "none",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const loadingCardStyle = {
  minHeight: 400,
  display: "grid",
  placeItems: "center",
  alignContent:
    "center",
  background:
    "var(--finance-surface)",
  border:
    "1px solid var(--finance-border)",
  borderRadius: 14,
  color:
    "var(--finance-text-muted)",
  textAlign:
    "center" as const,
};

const loadingIconStyle = {
  width: 55,
  height: 55,
  borderRadius: 14,
  background:
    "var(--finance-primary)",
  color: "#ffffff",
  display: "grid",
  placeItems: "center",
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 15,
};

const loadingTitleStyle = {
  color:
    "var(--finance-text)",
};

const loadingTextStyle = {
  color:
    "var(--finance-text-muted)",
};

const errorCardStyle = {
  minHeight: 400,
  display: "grid",
  placeItems: "center",
  alignContent:
    "center",
  background:
    "var(--finance-surface)",
  border:
    "1px solid var(--finance-border)",
  borderRadius: 14,
  textAlign:
    "center" as const,
  padding: 30,
};

const errorTitleStyle = {
  color:
    "var(--finance-text)",
};

const errorTextStyle = {
  color:
    "var(--finance-text-muted)",
};

const errorIconStyle = {
  width: 50,
  height: 50,
  borderRadius: "50%",
  background:
    "var(--finance-danger-light)",
  color:
    "var(--finance-danger)",
  display: "grid",
  placeItems: "center",
  fontWeight: 800,
  fontSize: 20,
  marginBottom: 12,
};

const chartColors = [
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#38bdf8",
  "#c084fc",
  "#fb7185",
];