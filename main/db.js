const { Pool } = require("pg");

const pool = new Pool({
  user: "kristian",
  host: "localhost",
  database: "mydb",
  password: "",
  post: 5432,
});

module.exports = pool;
