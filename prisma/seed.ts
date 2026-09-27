import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();

  if (!user) {
    throw new Error(
      "No user found. Please register an account first, then run the seed."
    );
  }

  const expenseCategories = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Health",
    "Education",
    "Other",
  ];

  const incomeCategories = [
    "Salary",
    "Investment",
  ];

  for (const name of expenseCategories) {
    await prisma.category.upsert({
      where: {
        name_userId: {
          name,
          userId: user.id,
        },
      },
      update: {
        type: TransactionType.EXPENSE,
      },
      create: {
        name,
        type: TransactionType.EXPENSE,
        userId: user.id,
      },
    });
  }

  for (const name of incomeCategories) {
    await prisma.category.upsert({
      where: {
        name_userId: {
          name,
          userId: user.id,
        },
      },
      update: {
        type: TransactionType.INCOME,
      },
      create: {
        name,
        type: TransactionType.INCOME,
        userId: user.id,
      },
    });
  }

  console.log("Default categories seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });