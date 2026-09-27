"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

type Transaction = {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description?: string | null;
  date: string;
  category?: Category | null;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goalSavings, setGoalSavings] = useState(0);

  const [type, setType] =
    useState<"INCOME" | "EXPENSE">("EXPENSE");

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
    loadTransactions();
    loadCategories();
    loadGoalSavings();
  }, []);

  async function loadTransactions() {
    try {
      setFetching(true);

      const response = await fetch("/api/transactions");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load transactions"
        );
      }

      const safeTransactions: Transaction[] = Array.isArray(data)
        ? data
        : [];

      setTransactions(safeTransactions);
    } catch (error) {
      console.error(error);
      setError("Could not load transactions.");
    } finally {
      setFetching(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load categories"
        );
      }

      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setError("Could not load categories.");
    }
  }

  async function loadGoalSavings() {
    try {
      const response = await fetch("/api/goals");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load goals"
        );
      }

      const goals = Array.isArray(data) ? data : [];

      const totalSavings = goals.reduce(
        (sum: number, goal: { currentAmount?: number | string | null }) =>
          sum + Number(goal.currentAmount ?? 0),
        0
      );

      setGoalSavings(totalSavings);
    } catch (error) {
      console.error("Goal savings load error:", error);
      setGoalSavings(0);
    }
  }

  const availableCategories = categories.filter(
    (category) => category.type === type
  );

  function resetForm() {
    setEditingId(null);
    setType("EXPENSE");
    setCategoryId("");
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
  }

  function editTransaction(transaction: Transaction) {
    setEditingId(transaction.id);
    setType(transaction.type);
    setCategoryId(transaction.category?.id || "");
    setAmount(String(transaction.amount ?? ""));
    setDescription(transaction.description ?? "");

    if (transaction.date) {
      setDate(
        new Date(transaction.date)
          .toISOString()
          .split("T")[0]
      );
    } else {
      setDate(new Date().toISOString().split("T")[0]);
    }

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const isEditing = Boolean(editingId);

      const url = editingId
        ? `/api/transactions/${editingId}`
        : "/api/transactions";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          type,
          description,
          date,
          categoryId: categoryId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to save transaction"
        );
        return;
      }

      /*
       * NEW TRANSACTION
       *
       * Always place the newly created transaction
       * at the first position.
       */
      if (!isEditing) {
        setTransactions((current) => [
          data,
          ...current,
        ]);
      } else {
        /*
         * EDIT TRANSACTION
         *
         * Replace the existing transaction while
         * keeping its current position.
         */
        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === editingId
              ? data
              : transaction
          )
        );
      }

      setMessage(
        isEditing
          ? "Transaction updated successfully."
          : "Transaction added successfully."
      );

      await loadGoalSavings();
      resetForm();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTransaction(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/transactions/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to delete transaction"
        );
        return;
      }

      setTransactions((current) =>
        current.filter(
          (transaction) => transaction.id !== id
        )
      );

      await loadGoalSavings();

      setMessage("Transaction deleted successfully.");
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const searchText = search.toLowerCase();

      const description = String(
        transaction.description ?? ""
      ).toLowerCase();

      const categoryName = String(
        transaction.category?.name ?? ""
      ).toLowerCase();

      const searchMatch =
        description.includes(searchText) ||
        categoryName.includes(searchText);

      const typeMatch =
        filterType === "ALL" ||
        transaction.type === filterType;

      const categoryMatch =
        filterCategory === "ALL" ||
        transaction.category?.id === filterCategory;

      return (
        searchMatch &&
        typeMatch &&
        categoryMatch
      );
    });
  }, [
    transactions,
    search,
    filterType,
    filterCategory,
  ]);

  const totalIncome = filteredTransactions
    .filter(
      (transaction) => transaction.type === "INCOME"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount ?? 0),
      0
    );

  const totalExpenses = filteredTransactions
    .filter(
      (transaction) => transaction.type === "EXPENSE"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount ?? 0),
      0
    );

  const balance = totalIncome - totalExpenses;

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(date: string) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN");
  }

  return (
    <main className="finance-page-wrapper">
      <div className="finance-container">

        {/* HEADER */}
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>
              FINANCIAL ACTIVITY
            </p>

            <h1 style={titleStyle}>
              Transactions
            </h1>

            <p style={subtitleStyle}>
              Manage your income and expenses in one place.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <Link
              href="/dashboard"
              style={secondaryButtonStyle}
            >
              ← Dashboard
            </Link>

            <a
              href="/api/transactions/export"
              download
              style={exportButtonStyle}
            >
              ↓ Export CSV
            </a>
          </div>
        </header>

        {/* MESSAGES */}
        {message && (
          <div style={successStyle}>
            <span style={messageIconStyle}>✓</span>
            {message}
          </div>
        )}

        {error && (
          <div style={errorStyle}>
            <span style={messageIconStyle}>!</span>
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <section style={summaryGridStyle}>
          <SummaryCard
            title="Income"
            value={formatCurrency(totalIncome)}
            subtitle="Filtered income"
            icon="↗"
            variant="income"
          />

          <SummaryCard
            title="Expenses"
            value={formatCurrency(totalExpenses)}
            subtitle="Filtered expenses"
            icon="↘"
            variant="expense"
          />

          <SummaryCard
            title="Goal Savings"
            value={formatCurrency(goalSavings)}
            subtitle="Saved across your goals"
            icon="🎯"
            variant="goal"
          />

          <SummaryCard
            title="Balance"
            value={formatCurrency(balance)}
            subtitle="Income minus expenses"
            icon="₹"
            variant={
              balance >= 0
                ? "balance"
                : "expense"
            }
          />

          <SummaryCard
            title="Transactions"
            value={String(
              filteredTransactions.length
            )}
            subtitle="Currently displayed"
            icon="#"
            variant="neutral"
          />
        </section>

        {/* TRANSACTION FORM */}
        <section
          style={{
            ...cardStyle,
            marginTop: 24,
          }}
        >
          <div style={sectionHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>
                {editingId
                  ? "UPDATE RECORD"
                  : "NEW RECORD"}
              </p>

              <h2 style={sectionTitleStyle}>
                {editingId
                  ? "Edit Transaction"
                  : "Add Transaction"}
              </h2>

              <p style={sectionDescriptionStyle}>
                Record your financial activity.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={secondaryButtonStyle}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={formGridStyle}>

              {/* TYPE */}
              <div>
                <label style={labelStyle}>
                  Type
                </label>

                <select
                  value={type}
                  onChange={(event) => {
                    const newType =
                      event.target.value as
                        | "INCOME"
                        | "EXPENSE";

                    setType(newType);
                    setCategoryId("");
                  }}
                  style={inputStyle}
                >
                  <option value="EXPENSE">
                    Expense
                  </option>

                  <option value="INCOME">
                    Income
                  </option>
                </select>
              </div>

              {/* CATEGORY */}
              <div>
                <label style={labelStyle}>
                  Category
                </label>

                <select
                  value={categoryId}
                  onChange={(event) =>
                    setCategoryId(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Uncategorized
                  </option>

                  {availableCategories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* AMOUNT */}
              <div>
                <label style={labelStyle}>
                  Amount
                </label>

                <div
                  style={
                    amountInputWrapperStyle
                  }
                >
                  <span
                    style={currencyPrefixStyle}
                  >
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value
                      )
                    }
                    placeholder="500"
                    required
                    style={amountInputStyle}
                  />
                </div>
              </div>

              {/* DATE */}
              <div>
                <label style={labelStyle}>
                  Date
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(
                      event.target.value
                    )
                  }
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div
              style={{
                marginTop: 16,
              }}
            >
              <label style={labelStyle}>
                Description
              </label>

              <input
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="e.g. Groceries, Salary, Electricity Bill"
                required
                maxLength={200}
                style={inputStyle}
              />
            </div>

            {/* FORM BUTTONS */}
            <div style={formActionsStyle}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading
                    ? 0.7
                    : 1,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Transaction"
                  : "Add Transaction"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={secondaryButtonStyle}
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </section>

        {/* SEARCH AND FILTER */}
        <section
          style={{
            ...cardStyle,
            marginTop: 24,
          }}
        >
          <div style={sectionHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>
                FIND RECORDS
              </p>

              <h2 style={sectionTitleStyle}>
                Search & Filter
              </h2>

              <p style={sectionDescriptionStyle}>
                Quickly find a specific transaction.
              </p>
            </div>
          </div>

          <div className="transactions-filter-grid">

            {/* SEARCH */}
            <div
              className="search-wrapper"
              style={searchWrapperStyle}
            >
              <span style={searchIconStyle}>
                ⌕
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search description or category..."
                style={searchInputStyle}
              />
            </div>

            {/* TYPE FILTER */}
            <select
              value={filterType}
              onChange={(event) =>
                setFilterType(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="ALL">
                All Types
              </option>

              <option value="INCOME">
                Income
              </option>

              <option value="EXPENSE">
                Expense
              </option>
            </select>

            {/* CATEGORY FILTER */}
            <select
              value={filterCategory}
              onChange={(event) =>
                setFilterCategory(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="ALL">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>

            {/* CLEAR FILTERS */}
            {(search ||
              filterType !== "ALL" ||
              filterCategory !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterType("ALL");
                  setFilterCategory(
                    "ALL"
                  );
                }}
                className="clear-filter-btn"
                style={
                  clearFilterButtonStyle
                }
              >
                Clear Filters
              </button>
            )}
          </div>
        </section>

        {/* TRANSACTION HISTORY */}
        <section
          style={{
            ...cardStyle,
            marginTop: 24,
          }}
        >
          <div style={historyHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>
                RECORDS
              </p>

              <h2 style={sectionTitleStyle}>
                Transaction History
              </h2>

              <p style={sectionDescriptionStyle}>
                {filteredTransactions.length}{" "}
                transaction
                {filteredTransactions.length !==
                1
                  ? "s"
                  : ""}{" "}
                displayed
              </p>
            </div>

            <a
              href="/api/transactions/export"
              download
              style={exportButtonStyle}
            >
              ↓ Export CSV
            </a>
          </div>

          {/* LOADING */}
          {fetching ? (
            <div style={emptyStateStyle}>
              <div
                style={loadingIconStyle}
              >
                ₹
              </div>

              <h3
                style={emptyTitleStyle}
              >
                Loading transactions...
              </h3>
            </div>
          ) : filteredTransactions.length ===
            0 ? (
            /* EMPTY */
            <div style={emptyStateStyle}>
              <div
                style={loadingIconStyle}
              >
                ₹
              </div>

              <h3
                style={emptyTitleStyle}
              >
                No transactions found
              </h3>

              <p style={emptyTextStyle}>
                Try changing your search
                or filters.
              </p>
            </div>
          ) : (
            /* TABLE */
            <div
              style={tableWrapperStyle}
            >
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
                      Transaction
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

                    <th
                      style={
                        tableHeaderStyle
                      }
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map(
                    (transaction) => (
                      <tr
                        key={
                          transaction.id
                        }
                      >
                        {/* TRANSACTION */}
                        <td
                          style={
                            tableCellStyle
                          }
                        >
                          <div
                            style={
                              transactionInfoStyle
                            }
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

                            <div>
                              <div
                                style={
                                  transactionDescriptionStyle
                                }
                              >
                                {transaction.description ??
                                  "No description"}
                              </div>

                              <div
                                style={
                                  transactionSubtextStyle
                                }
                              >
                                {transaction.category?.name ===
                                "Goal Savings"
                                  ? "Goal Savings"
                                  : "Transaction"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}
                        <td
                          style={
                            tableCellStyle
                          }
                        >
                          <span
                            style={{
                              ...categoryBadgeStyle,
                              ...(transaction.category?.name ===
                              "Goal Savings"
                                ? {
                                    background:
                                      "var(--finance-primary-light)",
                                    color:
                                      "var(--finance-primary)",
                                  }
                                : {}),
                            }}
                          >
                            {transaction
                              .category
                              ?.name ||
                              "Uncategorized"}
                          </span>
                        </td>

                        {/* TYPE */}
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

                        {/* AMOUNT */}
                        <td
                          style={{
                            ...tableCellStyle,
                            textAlign:
                              "right",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
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
                              Number(
                                transaction.amount ??
                                  0
                              )
                            )}
                          </span>
                        </td>

                        {/* DATE */}
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

                        {/* ACTIONS */}
                        <td
                          style={
                            tableCellStyle
                          }
                        >
                          <div
                            style={
                              actionButtonsStyle
                            }
                          >
                            <button
                              onClick={() =>
                                editTransaction(
                                  transaction
                                )
                              }
                              style={
                                editButtonStyle
                              }
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                deleteTransaction(
                                  transaction.id
                                )
                              }
                              style={
                                deleteButtonStyle
                              }
                            >
                              Delete
                            </button>
                          </div>
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

/* =========================================
   SUMMARY CARD
========================================= */

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  variant,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  variant:
    | "income"
    | "expense"
    | "balance"
    | "goal"
    | "neutral";
}) {
  const colors = {
    income: {
      background:
        "var(--finance-success-light)",
      color:
        "var(--finance-success)",
    },

    expense: {
      background:
        "var(--finance-danger-light)",
      color:
        "var(--finance-danger)",
    },

    balance: {
      background:
        "var(--finance-primary-light)",
      color:
        "var(--finance-primary)",
    },

    goal: {
      background:
        "var(--finance-primary-light)",
      color:
        "var(--finance-primary)",
    },

    neutral: {
      background:
        "var(--finance-surface-secondary)",
      color:
        "var(--finance-text-secondary)",
    },
  };

  return (
    <div style={summaryCardStyle}>
      <div
        style={
          summaryCardContentStyle
        }
      >
        <div>
          <p
            style={
              summaryLabelStyle
            }
          >
            {title}
          </p>

          <h2
            style={
              summaryValueStyle
            }
          >
            {value}
          </h2>

          <p
            style={
              summarySubtitleStyle
            }
          >
            {subtitle}
          </p>
        </div>

        <div
          style={{
            ...summaryIconStyle,
            background:
              colors[variant]
                .background,
            color:
              colors[variant].color,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================
   MAIN PAGE STYLES
========================================= */

const pageStyle = {
  minHeight: "100vh",
  background:
    "var(--finance-bg)",
  color:
    "var(--finance-text)",
  padding:
    "34px 28px",
  transition:
    "background-color .2s ease, color .2s ease",
};

const containerStyle = {
  maxWidth: 1250,
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-end",
  gap: 20,
  flexWrap:
    "wrap" as const,
};

const headerActionsStyle = {
  display: "flex",
  gap: 10,
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
  margin: "6px 0 0",
  fontSize: 34,
  lineHeight: 1.15,
  color:
    "var(--finance-text)",
  letterSpacing: "-1px",
};

const subtitleStyle = {
  margin: "8px 0 0",
  color:
    "var(--finance-text-muted)",
  fontSize: 14,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 15,
  marginTop: 28,
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
  transition:
    "background-color .2s ease, border-color .2s ease",
};

const summaryCardContentStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
};

const summaryLabelStyle = {
  margin: 0,
  color:
    "var(--finance-text-muted)",
  fontSize: 12,
  fontWeight: 700,
  textTransform:
    "uppercase" as const,
  letterSpacing: 0.5,
};

const summaryValueStyle = {
  margin:
    "10px 0 5px",
  fontSize: 24,
  color:
    "var(--finance-text)",
  letterSpacing:
    "-0.5px",
};

const summarySubtitleStyle = {
  margin: 0,
  color:
    "var(--finance-text-light)",
  fontSize: 11,
};

const summaryIconStyle = {
  width: 38,
  height: 38,
  borderRadius: 9,
  display: "grid",
  placeItems: "center",
  fontSize: 17,
  fontWeight: 700,
};

const cardStyle = {
  background:
    "var(--finance-surface)",
  padding: 25,
  borderRadius: 14,
  border:
    "1px solid var(--finance-border)",
  boxShadow:
    "var(--finance-shadow)",
  transition:
    "background-color .2s ease, border-color .2s ease",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
  gap: 15,
  flexWrap:
    "wrap" as const,
};

const sectionEyebrowStyle = {
  margin: 0,
  color:
    "var(--finance-text-light)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.2,
};

const sectionTitleStyle = {
  margin:
    "5px 0 0",
  color:
    "var(--finance-text)",
  fontSize: 18,
};

const sectionDescriptionStyle = {
  margin:
    "5px 0 0",
  color:
    "var(--finance-text-light)",
  fontSize: 12,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 15,
  marginTop: 22,
};

const labelStyle = {
  display: "block",
  color:
    "var(--finance-text-secondary)",
  fontSize: 12,
  fontWeight: 650,
  marginBottom: 7,
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding:
    "11px 12px",
  border:
    "1px solid var(--finance-border)",
  borderRadius: 8,
  boxSizing:
    "border-box" as const,
  background:
    "var(--finance-surface)",
  color:
    "var(--finance-text)",
  outline: "none",
  transition:
    "background-color .2s ease, border-color .2s ease, color .2s ease",
};

const amountInputWrapperStyle = {
  display: "flex",
  alignItems:
    "center",
  border:
    "1px solid var(--finance-border)",
  borderRadius: 8,
  background:
    "var(--finance-surface)",
  overflow:
    "hidden",
};

const currencyPrefixStyle = {
  paddingLeft: 12,
  color:
    "var(--finance-text-muted)",
  fontWeight: 600,
};

const amountInputStyle = {
  width: "100%",
  padding:
    "11px 12px 11px 7px",
  border: 0,
  outline: "none",
  boxSizing:
    "border-box" as const,
  background:
    "transparent",
  color:
    "var(--finance-text)",
};

const formActionsStyle = {
  display: "flex",
  gap: 10,
  marginTop: 20,
  flexWrap:
    "wrap" as const,
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(240px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr) auto",
  gap: 12,
  marginTop: 20,
  alignItems:
    "center",
};

const searchWrapperStyle = {
  position:
    "relative" as const,
};

const searchInputStyle = {
  ...inputStyle,
  paddingLeft: 38,
};

const searchIconStyle = {
  position:
    "absolute" as const,
  left: 13,
  top: "50%",
  transform:
    "translateY(-50%)",
  color:
    "var(--finance-text-light)",
  fontSize: 18,
  pointerEvents:
    "none" as const,
};

const clearFilterButtonStyle = {
  padding:
    "10px 13px",
  border:
    "1px solid var(--finance-border)",
  borderRadius: 8,
  background:
    "var(--finance-surface-secondary)",
  color:
    "var(--finance-text-secondary)",
  cursor: "pointer",
  whiteSpace:
    "nowrap" as const,
};

const primaryButtonStyle = {
  padding:
    "11px 18px",
  border: 0,
  borderRadius: 8,
  background:
    "var(--finance-primary)",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 650,
};

const secondaryButtonStyle = {
  display:
    "inline-flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  padding:
    "10px 15px",
  border:
    "1px solid var(--finance-border)",
  borderRadius: 8,
  background:
    "var(--finance-surface)",
  color:
    "var(--finance-text)",
  textDecoration:
    "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const exportButtonStyle = {
  display:
    "inline-flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  padding:
    "10px 15px",
  borderRadius: 8,
  background:
    "var(--finance-primary)",
  color: "#ffffff",
  textDecoration:
    "none",
  fontSize: 13,
  fontWeight: 600,
  whiteSpace:
    "nowrap" as const,
};

const historyHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
  gap: 15,
  flexWrap:
    "wrap" as const,
};

const tableWrapperStyle = {
  overflowX:
    "auto" as const,
  marginTop: 22,
};

const tableStyle = {
  width: "100%",
  borderCollapse:
    "collapse" as const,
  minWidth: 850,
};

const tableHeaderStyle = {
  padding:
    "11px 10px",
  borderBottom:
    "1px solid var(--finance-border)",
  textAlign:
    "left" as const,
  color:
    "var(--finance-text-light)",
  fontSize: 10,
  fontWeight: 700,
  textTransform:
    "uppercase" as const,
  letterSpacing: 0.7,
  whiteSpace:
    "nowrap" as const,
};

const tableCellStyle = {
  padding:
    "14px 10px",
  borderBottom:
    "1px solid var(--finance-border-light)",
  textAlign:
    "left" as const,
  fontSize: 13,
};

const transactionInfoStyle = {
  display: "flex",
  alignItems:
    "center",
  gap: 11,
};

const transactionIconStyle = {
  width: 34,
  height: 34,
  borderRadius: 8,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
  fontSize: 15,
  fontWeight: 700,
};

const transactionDescriptionStyle = {
  fontWeight: 650,
  color:
    "var(--finance-text)",
};

const transactionSubtextStyle = {
  marginTop: 3,
  color:
    "var(--finance-text-light)",
  fontSize: 11,
};

const categoryBadgeStyle = {
  display:
    "inline-block",
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
  display:
    "inline-block",
  padding:
    "5px 9px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 700,
};

const actionButtonsStyle = {
  display: "flex",
  gap: 7,
  flexWrap:
    "wrap" as const,
};

const editButtonStyle = {
  padding:
    "7px 11px",
  border:
    "1px solid var(--finance-border)",
  borderRadius: 7,
  background:
    "var(--finance-surface)",
  color:
    "var(--finance-text)",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
};

const deleteButtonStyle = {
  padding:
    "7px 11px",
  border: 0,
  borderRadius: 7,
  background:
    "var(--finance-danger-light)",
  color:
    "var(--finance-danger)",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
};

const successStyle = {
  marginTop: 20,
  padding:
    "11px 14px",
  borderRadius: 9,
  background:
    "var(--finance-success-light)",
  color:
    "var(--finance-success)",
  display: "flex",
  alignItems:
    "center",
  gap: 9,
  fontSize: 13,
  fontWeight: 600,
};

const errorStyle = {
  marginTop: 20,
  padding:
    "11px 14px",
  borderRadius: 9,
  background:
    "var(--finance-danger-light)",
  color:
    "var(--finance-danger)",
  display: "flex",
  alignItems:
    "center",
  gap: 9,
  fontSize: 13,
  fontWeight: 600,
};

const messageIconStyle = {
  width: 20,
  height: 20,
  borderRadius:
    "50%",
  display: "grid",
  placeItems:
    "center",
  background:
    "rgba(255,255,255,.6)",
  fontSize: 11,
  fontWeight: 800,
};

const emptyStateStyle = {
  minHeight: 250,
  display: "grid",
  placeItems:
    "center",
  alignContent:
    "center",
  textAlign:
    "center" as const,
  color:
    "var(--finance-text-muted)",
};

const emptyTitleStyle = {
  color:
    "var(--finance-text)",
  margin:
    "4px 0",
};

const emptyTextStyle = {
  color:
    "var(--finance-text-muted)",
  margin: 0,
};

const loadingIconStyle = {
  width: 46,
  height: 46,
  borderRadius: 11,
  background:
    "var(--finance-surface-secondary)",
  color:
    "var(--finance-text)",
  display: "grid",
  placeItems:
    "center",
  fontSize: 19,
  fontWeight: 700,
  marginBottom: 10,
};