"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

type Budget = {
  id: string;
  amount: number;
  month: number;
  year: number;
  category: {
    id: string;
    name: string;
  };
  spent: number;
  remaining: number;
  percentage: number;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function BudgetsPage() {
  const today = new Date();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(
    String(today.getMonth() + 1)
  );
  const [year, setYear] = useState(
    String(today.getFullYear())
  );
  const [categoryId, setCategoryId] = useState("");

  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadBudgets() {
    try {
      setFetching(true);

      const response = await fetch("/api/budgets");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load budgets"
        );
      }

      setBudgets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setError("Could not load budgets.");
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

      setCategories(
        Array.isArray(data)
          ? data.filter(
              (category: Category) =>
                category.type === "EXPENSE"
            )
          : []
      );
    } catch (error) {
      console.error(error);
      setError("Could not load categories.");
    }
  }

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, []);

  function resetForm() {
    setAmount("");
    setCategoryId("");
    setMonth(String(today.getMonth() + 1));
    setYear(String(today.getFullYear()));
    setEditingId(null);
  }

  function startEditing(budget: Budget) {
    setEditingId(budget.id);
    setAmount(String(budget.amount));
    setCategoryId(budget.category.id);
    setMonth(String(budget.month));
    setYear(String(budget.year));

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
        ? `/api/budgets/${editingId}`
        : "/api/budgets";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          month,
          year,
          categoryId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            (isEditing
              ? "Failed to update budget"
              : "Failed to create budget")
        );
        return;
      }

      setMessage(
        isEditing
          ? "Budget updated successfully."
          : "Budget created successfully."
      );

      resetForm();

      await loadBudgets();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBudget(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/budgets/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to delete budget"
        );
        return;
      }

      if (editingId === id) {
        resetForm();
      }

      setMessage("Budget deleted successfully.");

      await loadBudgets();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  }

  function getProgressColor(percentage: number) {
    if (percentage >= 100) return "#dc2626";
    if (percentage >= 80) return "#d97706";
    return "#16a34a";
  }

  const totalBudget = useMemo(
    () =>
      budgets.reduce(
        (total, budget) =>
          total + Number(budget.amount),
        0
      ),
    [budgets]
  );

  const totalSpent = useMemo(
    () =>
      budgets.reduce(
        (total, budget) =>
          total + Number(budget.spent),
        0
      ),
    [budgets]
  );

  const totalRemaining =
    totalBudget - totalSpent;

  const overBudgetCount = budgets.filter(
    (budget) => budget.percentage >= 100
  ).length;

  const overallPercentage =
    totalBudget > 0
      ? (totalSpent / totalBudget) * 100
      : 0;

  return (
    <main className="budgets-page">
      <div className="budgets-container">

        {/* HEADER */}
        <header className="budgets-header">
          <div>
            <div className="eyebrow">
              FINANCIAL PLANNING
            </div>

            <h1>Budgets</h1>

            <p>
              Set spending limits and keep your
              expenses under control.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="back-button"
          >
            ← Dashboard
          </Link>
        </header>

        {/* MESSAGES */}
        {message && (
          <div className="alert success-alert">
            <span className="alert-icon">✓</span>
            {message}
          </div>
        )}

        {error && (
          <div className="alert error-alert">
            <span className="alert-icon">!</span>
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <section className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon blue">
              ₹
            </div>

            <div>
              <span>Total Budget</span>
              <strong>
                {formatCurrency(totalBudget)}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon orange">
              ↗
            </div>

            <div>
              <span>Total Spent</span>
              <strong>
                {formatCurrency(totalSpent)}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon green">
              ✓
            </div>

            <div>
              <span>Remaining</span>
              <strong
                className={
                  totalRemaining < 0
                    ? "negative"
                    : ""
                }
              >
                {formatCurrency(totalRemaining)}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon red">
              !
            </div>

            <div>
              <span>Over Budget</span>
              <strong>
                {overBudgetCount}
              </strong>
            </div>
          </div>
        </section>

        {/* CREATE / EDIT BUDGET */}
        <section className="panel create-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">
                {editingId
                  ? "UPDATE BUDGET"
                  : "NEW BUDGET"}
              </div>

              <h2>
                {editingId
                  ? "Edit Budget"
                  : "Create Budget"}
              </h2>

              <p>
                {editingId
                  ? "Update your spending limit, category, month or year."
                  : "Set a monthly spending limit for an expense category."}
              </p>
            </div>

            <div className="panel-symbol">
              {editingId ? "✎" : "+"}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">

              {/* CATEGORY */}
              <div className="field">
                <label>Category</label>

                <select
                  value={categoryId}
                  onChange={(event) =>
                    setCategoryId(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select category
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
              </div>

              {/* AMOUNT */}
              <div className="field">
                <label>Budget Amount</label>

                <div className="amount-input">
                  <span>₹</span>

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
                    placeholder="10,000"
                    required
                  />
                </div>
              </div>

              {/* MONTH */}
              <div className="field">
                <label>Month</label>

                <select
                  value={month}
                  onChange={(event) =>
                    setMonth(
                      event.target.value
                    )
                  }
                >
                  {monthNames.map(
                    (name, index) => (
                      <option
                        key={name}
                        value={index + 1}
                      >
                        {name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* YEAR */}
              <div className="field">
                <label>Year</label>

                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={year}
                  onChange={(event) =>
                    setYear(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="form-buttons">
              <button
                type="submit"
                disabled={loading}
                className="primary-button"
              >
                {loading
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                  ? "✓ Update Budget"
                  : "+ Create Budget"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="cancel-button"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* BUDGET OVERVIEW */}
        <section className="overview-panel">
          <div className="overview-header">
            <div>
              <div className="eyebrow">
                SPENDING OVERVIEW
              </div>

              <h2>Budget Performance</h2>

              <p>
                Track how much of your allocated
                budget has been used.
              </p>
            </div>

            <div className="overall-stat">
              <strong>
                {overallPercentage.toFixed(1)}%
              </strong>

              <span>overall used</span>
            </div>
          </div>

          <div className="overall-progress">
            <div
              className="overall-progress-fill"
              style={{
                width: `${Math.min(
                  overallPercentage,
                  100
                )}%`,
                background:
                  getProgressColor(
                    overallPercentage
                  ),
              }}
            />
          </div>
        </section>

        {/* BUDGET LIST */}
        <section className="budget-section">

          <div className="section-heading">
            <div>
              <h2>Your Budgets</h2>

              <p>
                {budgets.length}{" "}
                {budgets.length === 1
                  ? "budget"
                  : "budgets"}{" "}
                configured
              </p>
            </div>
          </div>

          {fetching ? (
            <div className="empty-state">
              <div className="loading-spinner" />

              <h3>
                Loading budgets...
              </h3>

              <p>
                Fetching your latest budget
                information.
              </p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                ₹
              </div>

              <h3>No budgets yet</h3>

              <p>
                Create your first budget above to
                start tracking your spending.
              </p>
            </div>
          ) : (
            <div className="budget-grid">
              {budgets.map((budget) => {
                const percentage =
                  Number(budget.percentage);

                const displayPercentage =
                  Math.min(
                    percentage,
                    100
                  );

                const color =
                  getProgressColor(
                    percentage
                  );

                const isOverBudget =
                  percentage >= 100;

                const isWarning =
                  percentage >= 80 &&
                  percentage < 100;

                return (
                  <article
                    key={budget.id}
                    className="budget-card"
                  >
                    <div className="budget-card-top">

                      <div className="category-info">
                        <div className="category-icon">
                          {budget.category.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <h3>
                            {
                              budget
                                .category
                                .name
                            }
                          </h3>

                          <p>
                            {
                              monthNames[
                                budget.month -
                                  1
                              ]
                            }{" "}
                            {budget.year}
                          </p>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(
                              budget
                            )
                          }
                          className="edit-button"
                          title="Edit budget"
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteBudget(
                              budget.id
                            )
                          }
                          className="delete-button"
                          title="Delete budget"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="budget-values">
                      <div>
                        <span>Spent</span>

                        <strong>
                          {formatCurrency(
                            budget.spent
                          )}
                        </strong>
                      </div>

                      <div className="budget-target">
                        <span>Budget</span>

                        <strong>
                          {formatCurrency(
                            budget.amount
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="progress-section">

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${displayPercentage}%`,
                            background:
                              color,
                          }}
                        />
                      </div>

                      <div className="progress-meta">

                        <span
                          className="percentage"
                          style={{
                            color,
                          }}
                        >
                          {percentage.toFixed(1)}%
                          {" "}
                          used
                        </span>

                        <span
                          className={
                            budget.remaining < 0
                              ? "over-budget"
                              : "remaining"
                          }
                        >
                          {budget.remaining < 0
                            ? `${formatCurrency(
                                Math.abs(
                                  budget.remaining
                                )
                              )} over budget`
                            : `${formatCurrency(
                                budget.remaining
                              )} remaining`}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`budget-status ${
                        isOverBudget
                          ? "status-danger"
                          : isWarning
                          ? "status-warning"
                          : "status-good"
                      }`}
                    >
                      <span>
                        {isOverBudget
                          ? "⚠"
                          : isWarning
                          ? "!"
                          : "✓"}
                      </span>

                      {isOverBudget
                        ? "Budget exceeded"
                        : isWarning
                        ? "Approaching budget limit"
                        : "Within budget"}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .budgets-page {
          min-height: 100vh;
          background: var(--finance-bg);
          padding: 36px 30px 60px;
          color: var(--finance-text);
          transition:
            background-color 0.2s ease,
            color 0.2s ease;
        }

        .budgets-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .budgets-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 28px;
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--finance-text-muted);
          margin-bottom: 7px;
        }

        .budgets-header h1 {
          margin: 0;
          font-size: 34px;
          line-height: 1.15;
          letter-spacing: -0.8px;
        }

        .budgets-header p {
          margin: 9px 0 0;
          color: var(--finance-text-muted);
          font-size: 15px;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          padding: 10px 15px;
          border: 1px solid var(--finance-border);
          border-radius: 10px;
          background: var(--finance-surface);
          color: var(--finance-text);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s;
        }

        .back-button:hover {
          background: var(--finance-surface-secondary);
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          border-radius: 12px;
          margin-bottom: 18px;
          font-size: 14px;
          font-weight: 500;
        }

        .success-alert {
          background: var(--finance-success-light);
          color: var(--finance-success);
          border: 1px solid var(--finance-border);
        }

        .error-alert {
          background: var(--finance-danger-light);
          color: var(--finance-danger);
          border: 1px solid var(--finance-border);
        }

        .alert-icon {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: currentColor;
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .summary-card {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: var(--finance-shadow);
        }

        .summary-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
        }

        .summary-icon.blue {
          background: var(--finance-primary-light);
          color: var(--finance-primary);
        }

        .summary-icon.orange {
          background: var(--finance-warning-light);
          color: var(--finance-warning);
        }

        .summary-icon.green {
          background: var(--finance-success-light);
          color: var(--finance-success);
        }

        .summary-icon.red {
          background: var(--finance-danger-light);
          color: var(--finance-danger);
        }

        .summary-card span {
          display: block;
          color: var(--finance-text-muted);
          font-size: 12px;
          margin-bottom: 5px;
        }

        .summary-card strong {
          font-size: 19px;
          letter-spacing: -0.3px;
        }

        .negative {
          color: var(--finance-danger);
        }

        .panel,
        .overview-panel {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 18px;
          box-shadow: var(--finance-shadow);
        }

        .create-panel {
          padding: 25px;
        }

        .panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .panel-heading h2,
        .overview-header h2,
        .section-heading h2 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.3px;
        }

        .panel-heading p,
        .overview-header p,
        .section-heading p {
          margin: 6px 0 0;
          color: var(--finance-text-muted);
          font-size: 13px;
        }

        .panel-symbol {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: var(--finance-primary);
          color: white;
          font-size: 18px;
          font-weight: 700;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr 1fr 0.8fr;
          gap: 15px;
        }

        .field label {
          display: block;
          margin-bottom: 7px;
          color: var(--finance-text-secondary);
          font-size: 13px;
          font-weight: 600;
        }

        .field input,
        .field select {
          width: 100%;
          height: 44px;
          box-sizing: border-box;
          border: 1px solid var(--finance-border);
          border-radius: 10px;
          background: var(--finance-surface);
          color: var(--finance-text);
          padding: 0 12px;
          outline: none;
          font-size: 14px;
          transition: 0.2s;
        }

        .field input:focus,
        .field select:focus {
          border-color: var(--finance-primary);
          box-shadow:
            0 0 0 3px
            rgba(79, 70, 229, 0.12);
        }

        .amount-input {
          position: relative;
        }

        .amount-input span {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--finance-text-muted);
          font-weight: 600;
          z-index: 1;
        }

        .amount-input input {
          padding-left: 31px;
        }

        .form-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .primary-button {
          margin-top: 20px;
          height: 44px;
          padding: 0 20px;
          border: 0;
          border-radius: 10px;
          background: var(--finance-primary);
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .primary-button:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .primary-button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .cancel-button {
          margin-top: 20px;
          height: 44px;
          padding: 0 18px;
          border: 1px solid var(--finance-border);
          border-radius: 10px;
          background: var(--finance-surface-secondary);
          color: var(--finance-text);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .cancel-button:hover {
          background: var(--finance-border-light);
        }

        .overview-panel {
          margin-top: 22px;
          padding: 25px;
        }

        .overview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .overall-stat {
          text-align: right;
        }

        .overall-stat strong {
          display: block;
          font-size: 27px;
          letter-spacing: -0.7px;
        }

        .overall-stat span {
          color: var(--finance-text-muted);
          font-size: 12px;
        }

        .overall-progress {
          height: 9px;
          margin-top: 20px;
          background: var(--finance-border-light);
          border-radius: 20px;
          overflow: hidden;
        }

        .overall-progress-fill {
          height: 100%;
          border-radius: inherit;
          transition: width 0.35s ease;
        }

        .budget-section {
          margin-top: 30px;
        }

        .section-heading {
          margin-bottom: 15px;
        }

        .budget-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .budget-card {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 18px;
          padding: 21px;
          box-shadow: var(--finance-shadow);
          transition:
            transform 0.2s,
            box-shadow 0.2s,
            background-color 0.2s ease;
        }

        .budget-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--finance-shadow);
        }

        .budget-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: var(--finance-primary-light);
          color: var(--finance-primary);
          font-weight: 700;
          font-size: 16px;
        }

        .category-info h3 {
          margin: 0;
          font-size: 15px;
        }

        .category-info p {
          margin: 4px 0 0;
          color: var(--finance-text-muted);
          font-size: 12px;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .edit-button {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 8px;
          background: var(--finance-primary-light);
          color: var(--finance-primary);
          font-size: 15px;
          cursor: pointer;
          transition: 0.2s;
        }

        .edit-button:hover {
          opacity: 0.85;
        }

        .delete-button {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 8px;
          background: var(--finance-danger-light);
          color: var(--finance-danger);
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          transition: 0.2s;
        }

        .delete-button:hover {
          opacity: 0.85;
        }

        .budget-values {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
        }

        .budget-values span {
          display: block;
          color: var(--finance-text-muted);
          font-size: 11px;
          margin-bottom: 5px;
        }

        .budget-values strong {
          font-size: 16px;
        }

        .budget-target {
          text-align: right;
        }

        .progress-section {
          margin-top: 19px;
        }

        .progress-track {
          height: 9px;
          background: var(--finance-border-light);
          border-radius: 20px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          transition: width 0.35s ease;
        }

        .progress-meta {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 9px;
          font-size: 11px;
        }

        .percentage {
          font-weight: 700;
        }

        .remaining {
          color: var(--finance-text-muted);
          text-align: right;
        }

        .over-budget {
          color: var(--finance-danger);
          font-weight: 600;
          text-align: right;
        }

        .budget-status {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 17px;
          padding-top: 13px;
          border-top: 1px solid var(--finance-border-light);
          font-size: 11px;
          font-weight: 600;
        }

        .status-good {
          color: var(--finance-success);
        }

        .status-warning {
          color: var(--finance-warning);
        }

        .status-danger {
          color: var(--finance-danger);
        }

        .empty-state {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 18px;
          padding: 55px 25px;
          text-align: center;
        }

        .empty-icon {
          width: 52px;
          height: 52px;
          margin: 0 auto 14px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: var(--finance-primary-light);
          color: var(--finance-primary);
          font-size: 20px;
          font-weight: 700;
        }

        .empty-state h3 {
          margin: 0;
          font-size: 17px;
        }

        .empty-state p {
          margin: 7px 0 0;
          color: var(--finance-text-muted);
          font-size: 13px;
        }

        .loading-spinner {
          width: 30px;
          height: 30px;
          margin: 0 auto 15px;
          border: 3px solid var(--finance-border);
          border-top-color: var(--finance-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1050px) {
          .summary-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .budget-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .form-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .budgets-page {
            padding: 25px 16px 45px;
          }

          .budgets-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .budgets-header h1 {
            font-size: 28px;
          }

          .summary-grid,
          .form-grid,
          .budget-grid {
            grid-template-columns: 1fr;
          }

          .overview-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .overall-stat {
            text-align: left;
          }

          .create-panel,
          .overview-panel {
            padding: 20px;
          }
        }

        @media (max-width: 420px) {
          .budget-values {
            gap: 10px;
          }

          .progress-meta {
            flex-direction: column;
          }

          .remaining,
          .over-budget {
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}