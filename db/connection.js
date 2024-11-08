// db/connection.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'admin123',
  database: 'company_db',
  port: 5432
});

export default pool;