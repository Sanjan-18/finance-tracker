import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const userId = session.user.id;

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
      },
      include: {
        category: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Fetch goals separately.
    // Goal currentAmount is the source of truth
    // for total Goal Savings.
    const goals = await prisma.goal.findMany({
      where: {
        userId,
      },
      select: {
        currentAmount: true,
      },
    });

    const goalSavings = goals.reduce(
      (total, goal) => total + Number(goal.currentAmount),
      0
    );

    const monthlyData = monthNames.map(
      (month, index) => ({
        month,
        income: 0,
        expenses: 0,
        balance: 0,
        monthNumber: index + 1,
      })
    );

    const expenseByCategory: Record<string, number> = {};

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const transaction of transactions) {
      const amount = Number(transaction.amount);

      const transactionDate = new Date(transaction.date);

      const monthIndex = transactionDate.getMonth();

      if (transaction.type === "INCOME") {
        totalIncome += amount;

        monthlyData[monthIndex].income += amount;
      } else {
        totalExpenses += amount;

        monthlyData[monthIndex].expenses += amount;

        const categoryName =
          transaction.category?.name || "Uncategorized";

        expenseByCategory[categoryName] =
          (expenseByCategory[categoryName] || 0) + amount;
      }
    }

    // Calculate monthly balances
    for (const month of monthlyData) {
      month.balance = month.income - month.expenses;
    }

    const balance = totalIncome - totalExpenses;

    const savingsRate =
      totalIncome > 0
        ? (balance / totalIncome) * 100
        : 0;

    // Convert category data to the format
    // expected by the Analytics page.
    const categoryData = Object.entries(expenseByCategory)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    // Top 5 spending categories
    const topCategories = categoryData.slice(0, 5);

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses,
        goalSavings,
        balance,
        savingsRate,
        transactionCount: transactions.length,
      },

      monthlyData,

      expenseByCategory: categoryData,

      topCategories,
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    return NextResponse.json(
      {
        message: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}