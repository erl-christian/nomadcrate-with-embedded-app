import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/db/schema.js",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
