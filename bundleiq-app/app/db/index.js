import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

const connectionPromise = mysql.createConnection(
  process.env.DATABASE_URL
);

export const db = drizzle(connectionPromise);
