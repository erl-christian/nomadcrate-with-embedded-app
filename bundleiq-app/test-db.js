import mysql from "mysql2/promise";

try {
  const conn = await mysql.createConnection(
    "mysql://root:@127.0.0.1:3306/bundleiq"
  );

  console.log("CONNECTED");
  await conn.end();
} catch (err) {
  console.error(err);
}
