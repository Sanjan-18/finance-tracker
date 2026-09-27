import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/*
  GET ONE GOAL
*/
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { message: "Goal not found" },
        { status: 404 }
      );
    }

    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);

    const remaining = Math.max(
      targetAmount - currentAmount,
      0
    );

    const percentage =
      targetAmount > 0
        ? Math.min(
            (currentAmount / targetAmount) * 100,
            100
          )
        : 0;

    return NextResponse.json({
      id: goal.id,
      name: goal.name,
      targetAmount,
      currentAmount,
      remaining,
      percentage,
      deadline: goal.deadline,
    });
  } catch (error) {
    console.error(
      "GET /api/goals/[id] error:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to load goal",
      },
      { status: 500 }
    );
  }
}

/*
  UPDATE ONE GOAL

  Goal Savings behavior:

  Example:

  Existing:
    Goal Savings = ₹5,000

  Edit to:
    Goal Savings = ₹8,000

  Result:
    Delete old Goal Savings transaction(s)
    Create ONE new ₹8,000 Goal Savings transaction

  If edited from:

    ₹8,000 → ₹5,000

  Result:
    Delete old ₹8,000 Goal Savings transaction(s)
    Create ONE new ₹5,000 Goal Savings transaction

  NO income transaction is created.

  The Goal's currentAmount is the source of truth.
*/
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const targetAmount = Number(
      body.targetAmount
    );

    const currentAmount = Number(
      body.currentAmount
    );

    const deadline =
      body.deadline === "" ||
      body.deadline === null ||
      body.deadline === undefined
        ? null
        : new Date(body.deadline);

    /*
      VALIDATION
    */

    if (!name) {
      return NextResponse.json(
        {
          message: "Goal name is required",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(targetAmount) ||
      targetAmount <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Target amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(currentAmount) ||
      currentAmount < 0
    ) {
      return NextResponse.json(
        {
          message:
            "Current amount cannot be negative",
        },
        { status: 400 }
      );
    }

    if (currentAmount > targetAmount) {
      return NextResponse.json(
        {
          message:
            "Current savings cannot be greater than the target amount",
        },
        { status: 400 }
      );
    }

    if (
      deadline &&
      Number.isNaN(deadline.getTime())
    ) {
      return NextResponse.json(
        {
          message: "Invalid deadline",
        },
        { status: 400 }
      );
    }

    /*
      FIND EXISTING GOAL
    */

    const existingGoal =
      await prisma.goal.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

    if (!existingGoal) {
      return NextResponse.json(
        {
          message: "Goal not found",
        },
        { status: 404 }
      );
    }

    /*
      Find the Goal Savings category.

      Your schema uses:

      @@unique([name, userId])

      Therefore the Prisma compound key is:

      name_userId
    */

    const category =
      await prisma.category.upsert({
        where: {
          name_userId: {
            name: "Goal Savings",
            userId: session.user.id,
          },
        },
        update: {
          type: "EXPENSE",
        },
        create: {
          name: "Goal Savings",
          type: "EXPENSE",
          userId: session.user.id,
        },
      });

    /*
      IMPORTANT

      We identify this goal's savings transactions
      using the goal name in the description.

      Example:

      Goal name:
      "New Laptop"

      Transaction:
      "Goal Savings - New Laptop"
    */

    const oldTransactionDescription =
      `Goal Savings - ${existingGoal.name}`;

    const newTransactionDescription =
      `Goal Savings - ${name}`;

    /*
      Everything happens inside one transaction.

      This guarantees that:

      1. Old Goal Savings transactions are removed.
      2. New Goal Savings transaction is created.
      3. Goal amount is updated.

      If something fails, everything rolls back.
    */

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
            STEP 1

            Delete previous Goal Savings
            transaction(s) belonging to this goal.

            We use BOTH:
              userId
              categoryId
              description

            so another user's transactions or
            another category's transactions
            cannot be affected.
          */

          await tx.transaction.deleteMany({
            where: {
              userId: session.user.id,
              categoryId: category.id,
              description:
                oldTransactionDescription,
              type: "EXPENSE",
            },
          });

          /*
            STEP 2

            Update the goal.
          */

          const updatedGoal =
            await tx.goal.update({
              where: {
                id: existingGoal.id,
              },
              data: {
                name,
                targetAmount,
                currentAmount,
                deadline,
              },
            });

          /*
            STEP 3

            If the goal currently has savings,
            create ONE transaction containing
            the CURRENT total saved amount.

            Example:

            Current Amount = ₹8,000

            Transaction = ₹8,000 EXPENSE
          */

          let savingsTransaction = null;

          if (currentAmount > 0) {
            savingsTransaction =
              await tx.transaction.create({
                data: {
                  amount: currentAmount,
                  type: "EXPENSE",
                  description:
                    newTransactionDescription,
                  date: new Date(),
                  userId: session.user.id,
                  categoryId: category.id,
                },
              });
          }

          return {
            updatedGoal,
            savingsTransaction,
          };
        }
      );

    /*
      FORMAT RESPONSE
    */

    const finalTargetAmount =
      Number(result.updatedGoal.targetAmount);

    const finalCurrentAmount =
      Number(result.updatedGoal.currentAmount);

    const remaining = Math.max(
      finalTargetAmount -
        finalCurrentAmount,
      0
    );

    const percentage =
      finalTargetAmount > 0
        ? Math.min(
            (finalCurrentAmount /
              finalTargetAmount) *
              100,
            100
          )
        : 0;

    return NextResponse.json({
      message:
        "Goal updated and Goal Savings transaction synchronized successfully",

      goal: {
        id: result.updatedGoal.id,
        name: result.updatedGoal.name,
        targetAmount:
          finalTargetAmount,
        currentAmount:
          finalCurrentAmount,
        remaining,
        percentage,
        deadline:
          result.updatedGoal.deadline,
      },

      savingsTransaction:
        result.savingsTransaction
          ? {
              id:
                result.savingsTransaction.id,
              amount: Number(
                result.savingsTransaction
                  .amount
              ),
              type:
                result.savingsTransaction.type,
              description:
                result.savingsTransaction
                  .description,
              date:
                result.savingsTransaction.date,
            }
          : null,
    });
  } catch (error) {
    console.error(
      "PUT /api/goals/[id] error:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to update goal",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/*
  DELETE ONE GOAL
*/
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return NextResponse.json(
        {
          message: "Goal not found",
        },
        { status: 404 }
      );
    }

    /*
      Find Goal Savings category so that
      related savings transactions can also
      be removed.
    */

    const category =
      await prisma.category.findUnique({
        where: {
          name_userId: {
            name: "Goal Savings",
            userId: session.user.id,
          },
        },
      });

    /*
      Delete goal and its Goal Savings
      transactions together.
    */

    await prisma.$transaction(
      async (tx) => {
        if (category) {
          await tx.transaction.deleteMany({
            where: {
              userId: session.user.id,
              categoryId: category.id,
              description:
                `Goal Savings - ${goal.name}`,
              type: "EXPENSE",
            },
          });
        }

        await tx.goal.delete({
          where: {
            id: goal.id,
          },
        });
      }
    );

    return NextResponse.json({
      message:
        "Goal and its Goal Savings transactions deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE /api/goals/[id] error:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to delete goal",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}