import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    /*
      Fetch all transactions for the user.
    */

    const transactions =
      await prisma.transaction.findMany({
        where: {
          userId,
        },
        include: {
          category: true,
        },
        orderBy: {
          date: "desc",
        },
      });

    /*
      Fetch goals separately.

      Goal Savings is calculated from the
      CURRENT goal amounts, not from transactions.

      This prevents duplicate counting when
      Goal Savings transactions are replaced.
    */

    const goals = await prisma.goal.findMany({
      where: {
        userId,
      },
      select: {
        currentAmount: true,
      },
    });

    /*
      Calculate total Goal Savings.
    */

    const goalSavings = goals.reduce(
      (total, goal) =>
        total + Number(goal.currentAmount),
      0
    );

    let totalIncome = 0;
    let totalExpenses = 0;

    const expenseByCategory: Record<
      string,
      number
    > = {};

    /*
      Calculate income and expenses.

      Goal Savings transactions are already
      EXPENSE transactions, so they naturally
      reduce the available balance.
    */

    for (const transaction of transactions) {
      const amount = Number(
        transaction.amount
      );

      if (transaction.type === "INCOME") {
        totalIncome += amount;
      }

      if (transaction.type === "EXPENSE") {
        totalExpenses += amount;

        const categoryName =
          transaction.category?.name ||
          "Uncategorized";

        expenseByCategory[categoryName] =
          (expenseByCategory[categoryName] || 0) +
          amount;
      }
    }

    /*
      Current balance.

      Income - ALL expenses

      Goal Savings is an expense, so it is
      automatically included here.
    */

    const balance =
      totalIncome - totalExpenses;

    /*
      Savings rate.
    */

    const savingsRate =
      totalIncome > 0
        ? ((totalIncome - totalExpenses) /
            totalIncome) *
          100
        : 0;

    /*
      Expense category data.
    */

    const expenseCategoryData =
      Object.entries(expenseByCategory)
        .map(([name, amount]) => ({
          name,
          amount,
        }))
        .sort(
          (a, b) => b.amount - a.amount
        );

    /*
      Recent transactions.
    */

    const recentTransactions =
      transactions
        .slice(0, 8)
        .map((transaction) => ({
          id: transaction.id,
          description:
            transaction.description,
          type: transaction.type,
          amount: Number(
            transaction.amount
          ),
          date: transaction.date,
          category:
            transaction.category?.name ||
            "Uncategorized",
        }));

    /*
      Income vs expense chart.
    */

    const incomeExpense = [
      {
        name: "Income",
        amount: totalIncome,
      },
      {
        name: "Expenses",
        amount: totalExpenses,
      },
    ];

    return NextResponse.json({
      summary: {
        balance,
        totalIncome,
        totalExpenses,

        /*
          IMPORTANT:
          This comes from Goal.currentAmount,
          not from summing Goal Savings
          transactions.
        */
        goalSavings,

        savingsRate,
      },

      charts: {
        incomeExpense,
        expenseByCategory:
          expenseCategoryData,
      },

      recentTransactions,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to load dashboard data",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}