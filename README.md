# Finance Tracker

Full-stack personal finance / budget tracker.

## Stack

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod (ready for validation)
- Auth.js (planned in Step 2)
- Tailwind/shadcn/ui/Recharts (planned in later steps)

## Step 1 setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

Copy `.env.example` to `.env` and update `DATABASE_URL`.

Example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_tracker?schema=public"
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Create the first database migration

Make sure PostgreSQL is running, then:

```bash
npx prisma migrate dev --name init
```

### 5. Start Next.js

```bash
npm run dev
```

Open:

http://localhost:3000

## Current Step 1 scope

- Next.js project structure
- TypeScript configuration
- Prisma configuration
- PostgreSQL schema
- User, Category, Transaction, Budget and Goal models
- Basic landing page
- Basic dashboard placeholder
- Basic login placeholder

Authentication, real CRUD, charts, budgets and production UI will be implemented in subsequent steps.
