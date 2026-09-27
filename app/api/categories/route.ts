import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const categorySchema = z.object({
  name: z.string().min(2).max(50),
  type: z.enum(["INCOME", "EXPENSE"]),
});

const DEFAULT_CATEGORIES = [
  {
    name: "Food",
    type: "EXPENSE" as const,
  },
  {
    name: "Transport",
    type: "EXPENSE" as const,
  },
  {
    name: "Shopping",
    type: "EXPENSE" as const,
  },
  {
    name: "Bills",
    type: "EXPENSE" as const,
  },
  {
    name: "Entertainment",
    type: "EXPENSE" as const,
  },
  {
    name: "Health",
    type: "EXPENSE" as const,
  },
  {
    name: "Education",
    type: "EXPENSE" as const,
  },
  {
    name: "Rent",
    type: "EXPENSE" as const,
  },
  {
    name: "Technology",
    type: "EXPENSE" as const,
  },
  {
    name: "Other",
    type: "EXPENSE" as const,
  },
  {
    name: "Salary",
    type: "INCOME" as const,
  },
  {
    name: "Investment",
    type: "INCOME" as const,
  },
  {
    name: "Freelance",
    type: "INCOME" as const,
  },
  {
    name: "Other Income",
    type: "INCOME" as const,
  },
];

async function createDefaultCategories(userId: string) {
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        name_userId: {
          name: category.name,
          userId,
        },
      },
      update: {},
      create: {
        name: category.name,
        type: category.type,
        userId,
      },
    });
  }
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

    const userId = session.user.id;

    const existingCategories = await prisma.category.findMany({
      where: {
        userId,
      },
    });

    /*
     * Automatically create the basic categories
     * for users who don't have them yet.
     *
     * Upsert prevents duplicate categories.
     */
    if (existingCategories.length === 0) {
      await createDefaultCategories(userId);
    }

    const categories = await prisma.category.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          type: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Category fetch error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid category data" },
        { status: 400 }
      );
    }

    const { name, type } = result.data;

    const existingCategory = await prisma.category.findUnique({
      where: {
        name_userId: {
          name,
          userId: session.user.id,
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: "Category already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Category created successfully",
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Category creation error:", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}