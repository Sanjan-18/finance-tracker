import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    // Check whether the category is being used by transactions
    const transactionCount = await prisma.transaction.count({
      where: {
        categoryId: category.id,
        userId: session.user.id,
      },
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          message:
            "This category cannot be deleted because it is being used by transactions.",
        },
        { status: 409 }
      );
    }

    // Check whether the category is being used by budgets
    const budgetCount = await prisma.budget.count({
      where: {
        categoryId: category.id,
        userId: session.user.id,
      },
    });

    if (budgetCount > 0) {
      return NextResponse.json(
        {
          message:
            "This category cannot be deleted because it is being used by a budget.",
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: {
        id: category.id,
      },
    });

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Category deletion error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}