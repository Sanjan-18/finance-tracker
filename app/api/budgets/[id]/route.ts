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

export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
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

    const { id } = await params;

    // Find the existing budget and make sure
    // it belongs to the logged-in user.
    const existingBudget =
      await prisma.budget.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

    if (!existingBudget) {
      return NextResponse.json(
        {
          message: "Budget not found",
        },
        {
          status: 404,
        }
      );
    }

    const body = await request.json();

    const result = budgetSchema.safeParse(body);

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

    // Verify that the category belongs to
    // the currently logged-in user.
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

    // Check whether another budget already
    // exists with the same:
    //
    // user + category + month + year
    //
    // We exclude the budget currently being edited.
    const duplicateBudget =
      await prisma.budget.findFirst({
        where: {
          userId: session.user.id,
          categoryId,
          month,
          year,
          NOT: {
            id,
          },
        },
      });

    if (duplicateBudget) {
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

    // Update the budget.
    const budget =
      await prisma.budget.update({
        where: {
          id,
        },
        data: {
          amount,
          month,
          year,
          categoryId,
        },
        include: {
          category: true,
        },
      });

    return NextResponse.json(
      budget
    );
  } catch (error) {
    console.error(
      "Budget update error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
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

    const { id } = await params;

    const budget =
      await prisma.budget.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

    if (!budget) {
      return NextResponse.json(
        {
          message: "Budget not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.budget.delete({
      where: {
        id: budget.id,
      },
    });

    return NextResponse.json({
      message:
        "Budget deleted successfully",
    });
  } catch (error) {
    console.error(
      "Budget deletion error:",
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