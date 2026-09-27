"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  percentage: number;
  deadline: string | null;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [deadline, setDeadline] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);
  const [savingAmount, setSavingAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadGoals() {
    try {
      setFetching(true);
      setError("");

      const response = await fetch("/api/goals");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load goals"
        );
      }

      setGoals(data);
    } catch (error) {
      console.error(error);
      setError("Could not load goals.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  function resetForm() {
    setName("");
    setTargetAmount("");
    setCurrentAmount("0");
    setDeadline("");
    setEditingId(null);
  }

  function editGoal(goal: Goal) {
    setEditingId(goal.id);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setCurrentAmount(String(goal.currentAmount));
    setDeadline(
      goal.deadline
        ? new Date(goal.deadline)
            .toISOString()
            .split("T")[0]
        : ""
    );

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    resetForm();
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const url = editingId
        ? `/api/goals/${editingId}`
        : "/api/goals";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          targetAmount,
          currentAmount,
          deadline: deadline || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            `Failed to ${
              editingId ? "update" : "create"
            } goal`
        );
        return;
      }

      setMessage(
        editingId
          ? "Goal updated successfully."
          : "Goal created successfully."
      );

      resetForm();

      await loadGoals();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteGoal(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/goals/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to delete goal"
        );
        return;
      }

      setMessage("Goal deleted successfully.");

      await loadGoals();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    }
  }

  function openSavings(goal: Goal) {
    setSavingGoalId(goal.id);
    setSavingAmount("");
    setMessage("");
    setError("");
  }

  function cancelSavings() {
    setSavingGoalId(null);
    setSavingAmount("");
  }

  async function addGoalSavings(
    event: FormEvent,
    goal: Goal
  ) {
    event.preventDefault();

    const amount = Number(savingAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(
        "Savings amount must be greater than 0."
      );
      return;
    }

    if (amount > goal.remaining) {
      setError(
        `You can add a maximum of ${formatCurrency(
          goal.remaining
        )} to this goal.`
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/goals/${goal.id}/savings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to add goal savings."
        );
        return;
      }

      setMessage(
        `${formatCurrency(
          amount
        )} added to ${goal.name}.`
      );

      setSavingGoalId(null);
      setSavingAmount("");

      await loadGoals();
    } catch (error) {
      console.error(error);
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(date: string | null) {
    if (!date) return "No deadline";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getProgressColor(percentage: number) {
    if (percentage >= 100) {
      return "var(--finance-success)";
    }

    if (percentage >= 75) {
      return "var(--finance-primary)";
    }

    if (percentage >= 40) {
      return "var(--finance-warning)";
    }

    return "var(--finance-text-muted)";
  }

  function getGoalStatus(percentage: number) {
    if (percentage >= 100) {
      return {
        label: "Goal completed",
        icon: "✓",
        className: "status-complete",
      };
    }

    if (percentage >= 75) {
      return {
        label: "Almost there",
        icon: "↗",
        className: "status-near",
      };
    }

    if (percentage >= 40) {
      return {
        label: "Good progress",
        icon: "•",
        className: "status-progress",
      };
    }

    return {
      label: "Getting started",
      icon: "○",
      className: "status-start",
    };
  }

  const totalTarget = useMemo(
    () =>
      goals.reduce(
        (total, goal) =>
          total + Number(goal.targetAmount),
        0
      ),
    [goals]
  );

  const totalSaved = useMemo(
    () =>
      goals.reduce(
        (total, goal) =>
          total + Number(goal.currentAmount),
        0
      ),
    [goals]
  );

  const totalRemaining = Math.max(
    totalTarget - totalSaved,
    0
  );

  const completedGoals = goals.filter(
    (goal) => goal.percentage >= 100
  ).length;

  const overallPercentage =
    totalTarget > 0
      ? (totalSaved / totalTarget) * 100
      : 0;

  return (
    <main className="goals-page">
      <div className="goals-container">
        <header className="goals-header">
          <div>
            <div className="eyebrow">
              FINANCIAL GOALS
            </div>

            <h1>Savings Goals</h1>

            <p>
              Turn your financial plans into
              achievable milestones.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="back-button"
          >
            ← Dashboard
          </Link>
        </header>

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

        <section className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon blue">
              🎯
            </div>

            <div>
              <span>Total Target</span>

              <strong>
                {formatCurrency(totalTarget)}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon green">
              ₹
            </div>

            <div>
              <span>Goal Savings</span>

              <strong>
                {formatCurrency(totalSaved)}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon orange">
              ↗
            </div>

            <div>
              <span>Remaining</span>

              <strong>
                {formatCurrency(totalRemaining)}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon purple">
              ✓
            </div>

            <div>
              <span>Completed</span>

              <strong>
                {completedGoals}
              </strong>
            </div>
          </div>
        </section>

        <section className="panel create-panel">
          <div className="panel-heading">
            <div>
              <h2>
                {editingId
                  ? "Edit Savings Goal"
                  : "Create Savings Goal"}
              </h2>

              <p>
                {editingId
                  ? "Update your goal details."
                  : "Define something you want to save money for."}
              </p>
            </div>

            <div className="panel-symbol">
              {editingId ? "✎" : "+"}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>Goal Name</label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Buy Laptop"
                  required
                />
              </div>

              <div className="field">
                <label>Target Amount</label>

                <div className="amount-input">
                  <span>₹</span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={targetAmount}
                    onChange={(event) =>
                      setTargetAmount(
                        event.target.value
                      )
                    }
                    placeholder="80,000"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>
                  {editingId
                    ? "Current Goal Savings"
                    : "Already Saved"}
                </label>

                <div className="amount-input">
                  <span>₹</span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentAmount}
                    onChange={(event) =>
                      setCurrentAmount(
                        event.target.value
                      )
                    }
                    placeholder="25,000"
                  />
                </div>
              </div>

              <div className="field">
                <label>Deadline</label>

                <input
                  type="date"
                  value={deadline}
                  onChange={(event) =>
                    setDeadline(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="form-actions">
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
                  ? "✓ Update Goal"
                  : "+ Create Goal"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overview-panel">
          <div className="overview-header">
            <div>
              <div className="eyebrow">
                SAVINGS PROGRESS
              </div>

              <h2>Overall Goal Progress</h2>

              <p>
                Your combined progress across all
                savings goals.
              </p>
            </div>

            <div className="overall-stat">
              <strong>
                {overallPercentage.toFixed(1)}%
              </strong>

              <span>saved overall</span>
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

        <section className="goals-section">
          <div className="section-heading">
            <div>
              <h2>Your Goals</h2>

              <p>
                {goals.length}{" "}
                {goals.length === 1
                  ? "goal"
                  : "goals"}{" "}
                configured
              </p>
            </div>
          </div>

          {fetching ? (
            <div className="empty-state">
              <div className="loading-spinner" />

              <h3>Loading goals...</h3>

              <p>
                Fetching your latest savings
                progress.
              </p>
            </div>
          ) : goals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                🎯
              </div>

              <h3>No savings goals yet</h3>

              <p>
                Create your first goal above and
                start building toward it.
              </p>
            </div>
          ) : (
            <div className="goal-grid">
              {goals.map((goal) => {
                const percentage =
                  Number(goal.percentage);

                const displayPercentage =
                  Math.min(
                    Math.max(percentage, 0),
                    100
                  );

                const progressColor =
                  getProgressColor(
                    percentage
                  );

                const status =
                  getGoalStatus(
                    percentage
                  );

                const isSaving =
                  savingGoalId === goal.id;

                return (
                  <article
                    key={goal.id}
                    className="goal-card"
                  >
                    <div className="goal-card-top">
                      <div className="goal-title">
                        <div
                          className="goal-icon"
                          style={{
                            color:
                              progressColor,
                            background:
                              "var(--finance-primary-light)",
                          }}
                        >
                          🎯
                        </div>

                        <div>
                          <h3>
                            {goal.name}
                          </h3>

                          <p>
                            {goal.deadline
                              ? `Due ${formatDate(
                                  goal.deadline
                                )}`
                              : "No deadline"}
                          </p>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          type="button"
                          onClick={() =>
                            editGoal(goal)
                          }
                          className="edit-button"
                          title="Edit goal"
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteGoal(
                              goal.id
                            )
                          }
                          className="delete-button"
                          title="Delete goal"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="goal-values">
                      <div>
                        <span>Goal Savings</span>

                        <strong>
                          {formatCurrency(
                            goal.currentAmount
                          )}
                        </strong>
                      </div>

                      <div className="goal-target">
                        <span>Target</span>

                        <strong>
                          {formatCurrency(
                            goal.targetAmount
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
                              progressColor,
                          }}
                        />
                      </div>

                      <div className="progress-meta">
                        <span
                          className="percentage"
                          style={{
                            color:
                              progressColor,
                          }}
                        >
                          {percentage.toFixed(
                            1
                          )}
                          % complete
                        </span>

                        <span
                          className={
                            goal.remaining <= 0
                              ? "completed-text"
                              : "remaining-text"
                          }
                        >
                          {goal.remaining <= 0
                            ? "Target reached"
                            : `${formatCurrency(
                                goal.remaining
                              )} remaining`}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`goal-status ${status.className}`}
                    >
                      <span>
                        {status.icon}
                      </span>

                      {status.label}
                    </div>

                    {!isSaving ? (
                      <button
                        type="button"
                        className="savings-button"
                        onClick={() =>
                          openSavings(goal)
                        }
                        disabled={
                          goal.remaining <= 0
                        }
                      >
                        {goal.remaining <= 0
                          ? "Goal Completed"
                          : "+ Add Goal Savings"}
                      </button>
                    ) : (
                      <form
                        className="savings-form"
                        onSubmit={(event) =>
                          addGoalSavings(
                            event,
                            goal
                          )
                        }
                      >
                        <label>
                          Add money to this goal
                        </label>

                        <div className="savings-input-row">
                          <div className="amount-input">
                            <span>₹</span>

                            <input
                              type="number"
                              min="0.01"
                              max={
                                goal.remaining
                              }
                              step="0.01"
                              value={
                                savingAmount
                              }
                              onChange={(
                                event
                              ) =>
                                setSavingAmount(
                                  event.target
                                    .value
                                )
                              }
                              placeholder="5,000"
                              autoFocus
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="confirm-savings-button"
                            disabled={saving}
                          >
                            {saving
                              ? "..."
                              : "Add"}
                          </button>

                          <button
                            type="button"
                            className="cancel-savings-button"
                            onClick={
                              cancelSavings
                            }
                            disabled={saving}
                          >
                            ×
                          </button>
                        </div>

                        <small>
                          Available goal amount:{" "}
                          {formatCurrency(
                            goal.remaining
                          )}
                        </small>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        .goals-page {
          min-height: 100vh;
          background: var(--finance-bg);
          padding: 36px 30px 60px;
          color: var(--finance-text);
        }

        .goals-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .goals-header {
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

        .goals-header h1 {
          margin: 0;
          font-size: 34px;
          line-height: 1.15;
          letter-spacing: -0.8px;
        }

        .goals-header p {
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
          font-size: 19px;
          letter-spacing: -0.3px;
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
          font-size: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr 1fr 1fr;
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
        .amount-input input {
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
        }

        .field input:focus,
        .amount-input input:focus {
          border-color: var(--finance-primary);
          box-shadow: 0 0 0 3px var(--finance-primary-light);
        }

        .amount-input {
          position: relative;
        }

        .amount-input > span {
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

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .primary-button,
        .secondary-button {
          height: 44px;
          padding: 0 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .primary-button {
          border: 0;
          background: var(--finance-primary);
          color: white;
        }

        .secondary-button {
          border: 1px solid var(--finance-border);
          background: var(--finance-surface);
          color: var(--finance-text-secondary);
        }

        .primary-button:disabled,
        .secondary-button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
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

        .goals-section {
          margin-top: 30px;
        }

        .section-heading {
          margin-bottom: 15px;
        }

        .goal-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .goal-card {
          background: var(--finance-surface);
          border: 1px solid var(--finance-border);
          border-radius: 18px;
          padding: 21px;
          box-shadow: var(--finance-shadow);
        }

        .goal-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .goal-title {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .goal-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 12px;
          font-size: 18px;
        }

        .goal-title h3 {
          margin: 0;
          font-size: 15px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 180px;
        }

        .goal-title p {
          margin: 4px 0 0;
          color: var(--finance-text-muted);
          font-size: 12px;
        }

        .card-actions {
          display: flex;
          gap: 6px;
        }

        .edit-button,
        .delete-button {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 17px;
        }

        .edit-button {
          background: var(--finance-primary-light);
          color: var(--finance-primary);
        }

        .delete-button {
          background: var(--finance-danger-light);
          color: var(--finance-danger);
          font-size: 20px;
        }

        .goal-values {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
        }

        .goal-values span {
          display: block;
          color: var(--finance-text-muted);
          font-size: 11px;
          margin-bottom: 5px;
        }

        .goal-values strong {
          font-size: 16px;
        }

        .goal-target {
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

        .remaining-text {
          color: var(--finance-text-muted);
          text-align: right;
        }

        .completed-text {
          color: var(--finance-success);
          font-weight: 600;
          text-align: right;
        }

        .goal-status {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 17px;
          padding-top: 13px;
          border-top: 1px solid var(--finance-border-light);
          font-size: 11px;
          font-weight: 600;
        }

        .status-complete {
          color: var(--finance-success);
        }

        .status-near {
          color: var(--finance-primary);
        }

        .status-progress {
          color: var(--finance-warning);
        }

        .status-start {
          color: var(--finance-text-muted);
        }

        .savings-button {
          width: 100%;
          height: 42px;
          margin-top: 16px;
          border: 1px solid var(--finance-primary);
          border-radius: 10px;
          background: var(--finance-primary-light);
          color: var(--finance-primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .savings-button:hover:not(:disabled) {
          background: var(--finance-primary);
          color: white;
        }

        .savings-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .savings-form {
          margin-top: 16px;
          padding: 14px;
          border-radius: 12px;
          background: var(--finance-surface-secondary);
          border: 1px solid var(--finance-border);
        }

        .savings-form label {
          display: block;
          margin-bottom: 8px;
          color: var(--finance-text-secondary);
          font-size: 12px;
          font-weight: 600;
        }

        .savings-input-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 7px;
          align-items: center;
        }

        .confirm-savings-button,
        .cancel-savings-button {
          height: 42px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 700;
        }

        .confirm-savings-button {
          padding: 0 14px;
          border: 0;
          background: var(--finance-success);
          color: white;
        }

        .cancel-savings-button {
          width: 42px;
          border: 1px solid var(--finance-border);
          background: var(--finance-surface);
          color: var(--finance-text-muted);
          font-size: 18px;
        }

        .savings-form small {
          display: block;
          margin-top: 7px;
          color: var(--finance-text-muted);
          font-size: 10px;
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
          font-size: 21px;
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
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .goal-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .goals-page {
            padding: 25px 16px 45px;
          }

          .goals-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .goals-header h1 {
            font-size: 28px;
          }

          .summary-grid,
          .form-grid,
          .goal-grid {
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
          .goal-values {
            gap: 10px;
          }

          .progress-meta {
            flex-direction: column;
          }

          .remaining-text,
          .completed-text {
            text-align: left;
          }

          .savings-input-row {
            grid-template-columns: 1fr auto;
          }

          .cancel-savings-button {
            grid-column: 2;
            grid-row: 1;
          }

          .confirm-savings-button {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </main>
  );
}