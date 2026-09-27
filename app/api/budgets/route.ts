import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const budgetSchema = z.object({
  amount: z.coerce.number().positive(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  categoryId: z.string().min(1),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
      },
      include: {
        category: true,
      },
      orderBy: [
        {
          year: "desc",
        },
        {
          month: "desc",
        },
      ],
    });

    const result = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(
          budget.year,
          budget.month - 1,
          1
        );

        const endDate = new Date(
          budget.year,
          budget.month,
          1
        );

        const transactions =
          await prisma.transaction.findMany({
            where: {
              userId,
              categoryId: budget.categoryId,
              type: "EXPENSE",
              date: {
                gte: startDate,
                lt: endDate,
              },
            },
          });

        const spent = transactions.reduce(
          (total, transaction) =>
            total + Number(transaction.amount),
          0
        );

        const budgetAmount =
          Number(budget.amount);

        const remaining =
          budgetAmount - spent;

        const percentage =
          budgetAmount > 0
            ? (spent / budgetAmount) * 100
            : 0;

        return {
          id: budget.id,
          amount: budgetAmount,
          month: budget.month,
          year: budget.year,

          category: {
            id: budget.category.id,
            name: budget.category.name,
          },

          spent,
          remaining,
          percentage,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Budget fetch error:",
      error
    );

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

export async function POST(
  request: Request
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result =
      budgetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Invalid budget data",
        },
        {
          status: 400,
        }
      );
    }

    const {
      amount,
      month,
      year,
      categoryId,
    } = result.data;

    const category =
      await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId: session.user.id,
          type: "EXPENSE",
        },
      });

    if (!category) {
      return NextResponse.json(
        {
          message:
            "Invalid expense category",
        },
        {
          status: 400,
        }
      );
    }

    const existingBudget =
      await prisma.budget.findUnique({
        where: {
          userId_categoryId_month_year: {
            userId: session.user.id,
            categoryId,
            month,
            year,
          },
        },
      });

    if (existingBudget) {
      return NextResponse.json(
        {
          message:
            "A budget already exists for this category and month.",
        },
        {
          status: 409,
        }
      );
    }

    const budget =
      await prisma.budget.create({
        data: {
          amount,
          month,
          year,
          categoryId,
          userId: session.user.id,
        },
        include: {
          category: true,
        },
      });

    return NextResponse.json(
      {
        message:
          "Budget created successfully",
        budget,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Budget creation error:",
      error
    );

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