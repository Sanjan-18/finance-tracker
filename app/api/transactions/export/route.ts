import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const transactions =
      await prisma.transaction.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          category: true,
        },
        orderBy: {
          date: "desc",
        },
      });

    const header = [
      "Date",
      "Description",
      "Category",
      "Type",
      "Amount",
    ];

    const rows = transactions.map(
      (transaction) => [
        new Date(
          transaction.date
        ).toLocaleDateString("en-IN"),

        transaction.description,

        transaction.category?.name ||
          "Uncategorized",

        transaction.type,

        Number(
          transaction.amount
        ).toFixed(2),
      ]
    );

    const csv = [
      header,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            escapeCsv(String(value))
          )
          .join(",")
      )
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type":
          "text/csv; charset=utf-8",

        "Content-Disposition":
          'attachment; filename="finance-transactions.csv"',
      },
    });
  } catch (error) {
    console.error(
      "Transaction export error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to export transactions",
      },
      { status: 500 }
    );
  }
}