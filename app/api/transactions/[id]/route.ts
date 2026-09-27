import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const transactionSchema = z.object({
  amount: z.coerce.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(1).max(200),
  date: z.string(),
  categoryId: z.string().optional(),
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
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existingTransaction =
      await prisma.transaction.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

    if (!existingTransaction) {
      return NextResponse.json(
        {
          message: "Transaction not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const result =
      transactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message:
            "Invalid transaction data",
        },
        { status: 400 }
      );
    }

    const {
      amount,
      type,
      description,
      date,
      categoryId,
    } = result.data;

    // Verify that the selected category belongs
    // to the currently logged-in user and matches
    // the transaction type.
    if (categoryId) {
      const category =
        await prisma.category.findFirst({
          where: {
            id: categoryId,
            userId: session.user.id,
            type,
          },
        });

      if (!category) {
        return NextResponse.json(
          {
            message:
              "Invalid category for this transaction type",
          },
          { status: 400 }
        );
      }
    }

    // Update the transaction and return the
    // complete updated transaction including
    // its category.
    const transaction =
      await prisma.transaction.update({
        where: {
          id,
        },
        data: {
          amount,
          type,
          description,
          date: new Date(date),
          categoryId:
            categoryId || null,
        },
        include: {
          category: true,
        },
      });

    // Return the transaction directly.
    // The frontend expects data.id,
    // data.amount, data.description, etc.
    return NextResponse.json(
      transaction
    );
  } catch (error) {
    console.error(
      "Transaction update error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Something went wrong",
      },
      { status: 500 }
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
        { status: 401 }
      );
    }

    const { id } = await params;

    const transaction =
      await prisma.transaction.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

    if (!transaction) {
      return NextResponse.json(
        {
          message:
            "Transaction not found",
        },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: {
        id: transaction.id,
      },
    });

    return NextResponse.json({
      message:
        "Transaction deleted successfully",
    });
  } catch (error) {
    console.error(
      "Transaction deletion error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Something went wrong",
      },
      { status: 500 }
    );
  }
}