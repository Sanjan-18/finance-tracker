"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [type, setType] =
    useState<"INCOME" | "EXPENSE">("EXPENSE");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCategories() {
    try {
      setFetching(true);
      setError("");

      const response = await fetch("/api/categories");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load categories"
        );
      }

      setCategories(data);
    } catch (error) {
      console.error(error);
      setError("Could not load categories.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to create category"
        );
        return;
      }

      setMessage("Category created successfully.");

      setName("");

      await loadCategories();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCategory(
    category: Category
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(category.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/categories/${category.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to delete category"
        );
        return;
      }

      setMessage(
        `"${category.name}" deleted successfully.`
      );

      await loadCategories();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  const incomeCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.type === "INCOME"
      ),
    [categories]
  );

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.type === "EXPENSE"
      ),
    [categories]
  );

  return (
    <main className="categories-page">
      <div className="categories-container">

        {/* HEADER */}
        <header className="categories-header">
          <div>
            <div className="eyebrow">
              FINANCE ORGANIZATION
            </div>

            <h1>Categories</h1>

            <p>
              Organize your income and expenses
              for better financial tracking.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="back-button"
          >
            ← Dashboard
          </Link>
        </header>

        {/* ALERTS */}
        {message && (
          <div className="alert success-alert">
            <span className="alert-icon">
              ✓
            </span>

            {message}
          </div>
        )}

        {error && (
          <div className="alert error-alert">
            <span className="alert-icon">
              !
            </span>

            {error}
          </div>
        )}

        {/* SUMMARY */}
        <section className="summary-grid">

          <div className="summary-card">
            <div className="summary-icon blue">
              #
            </div>

            <div>
              <span>Total Categories</span>

              <strong>
                {categories.length}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon green">
              ↗
            </div>

            <div>
              <span>Income Categories</span>

              <strong>
                {incomeCategories.length}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon orange">
              ↘
            </div>

            <div>
              <span>Expense Categories</span>

              <strong>
                {expenseCategories.length}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon purple">
              +
            </div>

            <div>
              <span>Category Types</span>

              <strong>2</strong>
            </div>
          </div>

        </section>

        {/* ADD CATEGORY */}
        <section className="panel create-panel">

          <div className="panel-heading">

            <div>
              <div className="eyebrow">
                CATEGORY MANAGEMENT
              </div>

              <h2>Add Category</h2>

              <p>
                Create a category to organize your
                financial transactions.
              </p>
            </div>

            <div className="panel-symbol">
              +
            </div>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              <div className="field field-name">
                <label>Category Name</label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Groceries"
                  required
                />
              </div>

              <div className="field">
                <label>Category Type</label>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target.value as
                        | "INCOME"
                        | "EXPENSE"
                    )
                  }
                >
                  <option value="EXPENSE">
                    Expense
                  </option>

                  <option value="INCOME">
                    Income
                  </option>
                </select>
              </div>

              <div className="button-wrapper">
                <button
                  type="submit"
                  disabled={loading}
                  className="primary-button"
                >
                  {loading
                    ? "Adding..."
                    : "+ Add Category"}
                </button>
              </div>

            </div>

          </form>

        </section>

        {/* CATEGORY LIST */}
        <section className="categories-section">

          <div className="section-heading">
            <div>
              <div className="eyebrow">
                YOUR CATEGORIES
              </div>

              <h2>Category Overview</h2>

              <p>
                Manage the categories used to
                organize your transactions.
              </p>
            </div>
          </div>

          {fetching ? (
            <div className="empty-state">

              <div className="loading-spinner" />

              <h3>Loading categories...</h3>

              <p>
                Fetching your category list.
              </p>

            </div>
          ) : (
            <div className="category-grid">

              <CategoryGroup
                title="Income Categories"
                subtitle="Money coming into your account"
                categories={incomeCategories}
                type="INCOME"
                deletingId={deletingId}
                onDelete={deleteCategory}
              />

              <CategoryGroup
                title="Expense Categories"
                subtitle="Money spent from your account"
                categories={expenseCategories}
                type="EXPENSE"
                deletingId={deletingId}
                onDelete={deleteCategory}
              />

            </div>
          )}

        </section>

      </div>

      <style jsx global>{`
        .categories-page {
          min-height: 100vh;
          background: var(--finance-bg);
          padding: 36px 30px 60px;
          color: var(--finance-text);
        }

        .categories-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .categories-header {
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

        .categories-header h1 {
          margin: 0;
          font-size: 34px;
          line-height: 1.15;
          letter-spacing: -0.8px;
        }

        .categories-header p {
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
          color: var(--finance-text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s;
        }

        .back-button:hover {
          background: var(--finance-surface-secondary);
          border-color: var(--finance-border);
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
          flex-shrink: 0;
        }

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
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
          box-shadow:
            0 4px 18px
              var(--finance-shadow);
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

        .summary-icon.green {
          background: var(--finance-success-light);
          color: var(--finance-success);
        }

        .summary-icon.orange {
          background: var(--finance-warning-light);
          color: var(--finance-warning);
        }

        .summary-icon.purple {
          background: var(--finance-primary-light);
          color: var(--finance-primary);
        }

        .summary-card span {
          display: block;
          color: var(--finance-text-muted);
          font-size: 12px;
          margin-bottom: 5px;
        }

        .summary-card strong {
          font-size: 20px;
          letter-spacing: -0.3px;
        }

        .panel {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 18px;
          box-shadow:
            0 5px 22px
              var(--finance-shadow);
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
        .section-heading h2 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.3px;
        }

        .panel-heading p,
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
          background: var(--finance-sidebar);
          color: white;
          font-size: 22px;
        }

        .form-grid {
          display: grid;
          grid-template-columns:
            1.5fr 1fr auto;
          align-items: end;
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
          border-color: var(--finance-text-muted);
          box-shadow:
            0 0 0 3px
              rgba(
                100,
                116,
                139,
                0.1
              );
        }

        .button-wrapper {
          height: 44px;
        }

        .primary-button {
          height: 44px;
          padding: 0 20px;
          border: 0;
          border-radius: 10px;
          background: var(--finance-sidebar);
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: 0.2s;
        }

        .primary-button:hover:not(:disabled) {
          background: var(--finance-primary);
          transform: translateY(-1px);
        }

        .primary-button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .categories-section {
          margin-top: 30px;
        }

        .section-heading {
          margin-bottom: 15px;
        }

        .category-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .category-group {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 18px;
          padding: 22px;
          box-shadow:
            0 5px 20px
              var(--finance-shadow);
        }

        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          padding-bottom: 17px;
          border-bottom: 1px solid var(--finance-border-light);
        }

        .group-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .group-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          font-size: 17px;
          font-weight: 700;
        }

        .income-icon {
          background: var(--finance-success-light);
          color: var(--finance-success);
        }

        .expense-icon {
          background: var(--finance-warning-light);
          color: var(--finance-warning);
        }

        .group-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .group-header p {
          margin: 4px 0 0;
          color: var(--finance-text-muted);
          font-size: 11px;
        }

        .count-badge {
          padding: 5px 9px;
          border-radius: 20px;
          background: var(--finance-surface-secondary);
          color: var(--finance-text-secondary);
          font-size: 11px;
          font-weight: 700;
        }

        .category-list {
          margin-top: 5px;
        }

        .category-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 2px;
          border-bottom: 1px solid var(--finance-border-light);
        }

        .category-item:last-child {
          border-bottom: 0;
        }

        .category-item-left {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .category-number {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 8px;
          background: var(--finance-surface-secondary);
          color: var(--finance-text-muted);
          font-size: 11px;
          font-weight: 700;
        }

        .category-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--finance-text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .category-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .category-type {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.4px;
        }

        .income-text {
          color: var(--finance-success);
        }

        .expense-text {
          color: var(--finance-warning);
        }

        .delete-button {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid var(--finance-border);
          border-radius: 8px;
          background: var(--finance-surface);
          color: var(--finance-danger);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .delete-button:hover:not(:disabled) {
          background: var(--finance-danger-light);
          border-color: var(--finance-danger);
          transform: translateY(-1px);
        }

        .delete-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .empty-category {
          padding: 35px 10px;
          text-align: center;
          color: var(--finance-text-muted);
          font-size: 13px;
        }

        .empty-category-icon {
          width: 40px;
          height: 40px;
          margin: 0 auto 10px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: var(--finance-surface-secondary);
          color: var(--finance-text-light);
          font-size: 18px;
        }

        .empty-state {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 18px;
          padding: 55px 25px;
          text-align: center;
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
          border-top-color: var(--finance-text);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .summary-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .form-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .button-wrapper {
            grid-column: span 2;
          }

          .primary-button {
            width: 100%;
          }
        }

        @media (max-width: 700px) {
          .categories-page {
            padding: 25px 16px 45px;
          }

          .categories-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .categories-header h1 {
            font-size: 28px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .button-wrapper {
            grid-column: auto;
          }

          .category-grid {
            grid-template-columns: 1fr;
          }

          .create-panel,
          .category-group {
            padding: 20px;
          }

          .category-item {
            align-items: flex-start;
          }

          .category-actions {
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
          }
        }

        .field input::placeholder {
          color: var(--finance-text-light);
        }

        .field select option {
          background: var(--finance-surface);
          color: var(--finance-text);
        }

        .summary-card,
        .panel,
        .category-group,
        .empty-state,
        .back-button,
        .field input,
        .field select,
        .delete-button {
          transition:
            background-color 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease,
            box-shadow 0.2s ease;
        }
      `}</style>
    </main>
  );
}

function CategoryGroup({
  title,
  subtitle,
  categories,
  type,
  deletingId,
  onDelete,
}: {
  title: string;
  subtitle: string;
  categories: Category[];
  type: "INCOME" | "EXPENSE";
  deletingId: string | null;
  onDelete: (category: Category) => void;
}) {
  const isIncome = type === "INCOME";

  return (
    <section className="category-group">

      <div className="group-header">

        <div className="group-title">

          <div
            className={`group-icon ${
              isIncome
                ? "income-icon"
                : "expense-icon"
            }`}
          >
            {isIncome ? "↗" : "↘"}
          </div>

          <div>
            <h3>{title}</h3>

            <p>{subtitle}</p>
          </div>

        </div>

        <span className="count-badge">
          {categories.length}
        </span>

      </div>

      {categories.length === 0 ? (
        <div className="empty-category">

          <div className="empty-category-icon">
            +
          </div>

          No categories yet.

        </div>
      ) : (
        <div className="category-list">

          {categories.map(
            (category, index) => (
              <div
                key={category.id}
                className="category-item"
              >

                <div className="category-item-left">

                  <div className="category-number">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <span className="category-name">
                    {category.name}
                  </span>

                </div>

                <div className="category-actions">

                  <span
                    className={`category-type ${
                      isIncome
                        ? "income-text"
                        : "expense-text"
                    }`}
                  >
                    {isIncome
                      ? "INCOME"
                      : "EXPENSE"}
                  </span>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      onDelete(category)
                    }
                    disabled={
                      deletingId === category.id
                    }
                    title="Delete category"
                    aria-label={`Delete ${category.name}`}
                  >
                    {deletingId === category.id
                      ? "..."
                      : "×"}
                  </button>

                </div>

              </div>
            )
          )}

        </div>
      )}

    </section>
  );
}