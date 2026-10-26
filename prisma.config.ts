import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved the migrate/introspect connection URL out of schema.prisma and into
// this file. The runtime client gets its connection separately, via the pg driver
// adapter in src/lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
