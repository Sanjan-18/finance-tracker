import { prisma } from "@/lib/prisma";

const DEFAULT_CATEGORIES = [
  { name: "Food", type: "EXPENSE" as const },
  { name: "Transport", type: "EXPENSE" as const },
  { name: "Shopping", type: "EXPENSE" as const },
  { name: "Bills", type: "EXPENSE" as const },
  { name: "Entertainment", type: "EXPENSE" as const },
  { name: "Health", type: "EXPENSE" as const },
  { name: "Education", type: "EXPENSE" as const },
  { name: "Rent", type: "EXPENSE" as const },
  { name: "Technology", type: "EXPENSE" as const },
  { name: "Other", type: "EXPENSE" as const },

  { name: "Salary", type: "INCOME" as const },
  { name: "Investment", type: "INCOME" as const },
  { name: "Freelance", type: "INCOME" as const },
  { name: "Other Income", type: "INCOME" as const },
];

export async function createDefaultCategories(userId: string) {
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