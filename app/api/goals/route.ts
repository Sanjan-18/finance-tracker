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

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedGoals = goals.map((goal) => {
      const targetAmount = Number(
        goal.targetAmount
      );

      const currentAmount = Number(
        goal.currentAmount
      );

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

      return {
        id: goal.id,
        name: goal.name,
        targetAmount,
        currentAmount,
        remaining,
        percentage,
        deadline: goal.deadline,
      };
    });

    return NextResponse.json(
      formattedGoals
    );
  } catch (error) {
    console.error(
      "GET /api/goals error:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to load goals",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
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
        {
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const targetAmount = Number(
      body.targetAmount
    );

    /*
      New goals should normally start with
      0 saved amount.

      If the frontend sends nothing,
      default to 0.
    */
    const currentAmount =
      body.currentAmount === undefined ||
      body.currentAmount === null ||
      body.currentAmount === ""
        ? 0
        : Number(body.currentAmount);

    const deadline =
      body.deadline === undefined ||
      body.deadline === null ||
      body.deadline === ""
        ? null
        : new Date(body.deadline);

    /*
      VALIDATION
    */

    if (!name) {
      return NextResponse.json(
        {
          message:
            "Goal name is required",
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
            "Current amount cannot be greater than target amount",
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
      Make sure the Goal Savings category exists.

      Your Prisma schema has:

      @@unique([name, userId])

      Therefore the compound unique key is:

      name_userId
    */

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
      Create the goal.

      IMPORTANT:

      Creating a goal does NOT create a
      Goal Savings transaction.

      Money is only deducted when the user
      actually uses Add Savings.
    */

    const goal = await prisma.goal.create({
      data: {
        name,
        targetAmount,
        currentAmount,
        deadline,
        userId: session.user.id,
      },
    });

    const finalTargetAmount = Number(
      goal.targetAmount
    );

    const finalCurrentAmount = Number(
      goal.currentAmount
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

    return NextResponse.json(
      {
        message:
          "Goal created successfully",

        goal: {
          id: goal.id,
          name: goal.name,
          targetAmount:
            finalTargetAmount,
          currentAmount:
            finalCurrentAmount,
          remaining,
          percentage,
          deadline: goal.deadline,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/goals error:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to create goal",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}