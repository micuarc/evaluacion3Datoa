require("dotenv").config();
const db_key = process.env.PW_SQL;
const db_database = process.env.DB_SQL;
const mysql = require("mysql2/promise");
// datos para conectar a la BD
const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: db_key,
  database: db_database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  allowPublicKeyRetrieval: true,
});

module.exports = connection;
