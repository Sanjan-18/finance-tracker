import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
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

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          message:
            "Savings amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    /*
      Find the goal belonging to the logged-in user.
    */

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

    const currentAmount = Number(
      goal.currentAmount
    );

    const targetAmount = Number(
      goal.targetAmount
    );

    /*
      The Add Savings amount is an ADDITION
      to the current saved amount.

      Example:

      Current = ₹5,000
      Add    = ₹2,000
      New    = ₹7,000
    */

    const newCurrentAmount =
      currentAmount + amount;

    /*
      Do not allow savings to exceed target.
    */

    if (newCurrentAmount > targetAmount) {
      const remaining = Math.max(
        targetAmount - currentAmount,
        0
      );

      return NextResponse.json(
        {
          message: `You can only add up to ${remaining} more to this goal`,
        },
        { status: 400 }
      );
    }

    /*
      Find or create Goal Savings category.

      Your Prisma schema uses:

      @@unique([name, userId])

      Therefore the compound key is:

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
      Everything is synchronized inside one
      database transaction.

      We DELETE the previous Goal Savings
      transaction for this goal and create
      ONE new transaction containing the
      CURRENT TOTAL saved amount.

      Example:

      Before:
        Goal = ₹5,000
        Transaction = ₹5,000

      Add Savings ₹2,000

      After:
        Goal = ₹7,000
        Transaction = ₹7,000

      There will NOT be:

        ₹5,000
        ₹2,000

      There will only be:

        ₹7,000
    */

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
            Delete the previous transaction
            associated with this goal.

            We use:
              userId
              categoryId
              description
              type
          */

          await tx.transaction.deleteMany({
            where: {
              userId: session.user.id,
              categoryId: category.id,
              description:
                `Goal Savings - ${goal.name}`,
              type: "EXPENSE",
            },
          });

          /*
            Update the goal's current amount.
          */

          const updatedGoal =
            await tx.goal.update({
              where: {
                id: goal.id,
              },
              data: {
                currentAmount:
                  newCurrentAmount,
              },
            });

          /*
            Create ONE transaction representing
            the complete amount currently saved.
          */

          const savingsTransaction =
            await tx.transaction.create({
              data: {
                amount: newCurrentAmount,
                type: "EXPENSE",
                description:
                  `Goal Savings - ${goal.name}`,
                date: new Date(),
                userId: session.user.id,
                categoryId: category.id,
              },
            });

          return {
            updatedGoal,
            savingsTransaction,
          };
        }
      );

    /*
      Calculate updated goal information.
    */

    const finalTargetAmount =
      Number(
        result.updatedGoal.targetAmount
      );

    const finalCurrentAmount =
      Number(
        result.updatedGoal.currentAmount
      );

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
        "Goal savings added successfully",

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

      transaction: {
        id:
          result.savingsTransaction.id,
        amount: Number(
          result.savingsTransaction.amount
        ),
        type:
          result.savingsTransaction.type,
        description:
          result.savingsTransaction
            .description,
        date:
          result.savingsTransaction.date,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/goals/[id]/savings error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to add goal savings",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}