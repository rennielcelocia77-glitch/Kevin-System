import { pool, withTransaction } from '../config/db.js';

export async function createExpense({ category, description, amount, expenseDate, deliveryId, referenceNumber, notes, userId }) {
  if (amount <= 0) throw Object.assign(new Error('Amount must be greater than zero'), { code: 'INVALID_AMOUNT' });
  
  return withTransaction(async (connection) => {
    const [result] = await connection.query(`
      INSERT INTO expenses (category, description, amount, expense_date, delivery_id, reference_number, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [category, description, amount, expenseDate, deliveryId || null, referenceNumber, notes, userId]);
    
    await connection.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [userId, 'EXPENSE_CREATED', 'expenses', result.insertId, JSON.stringify({ category, amount })]
    );
    return result.insertId;
  });
}

export async function createGasolineExpense({ quantityLiters, pricePerLiter, totalAmount, expenseDate, vehicleDescription, deliveryId, notes, userId }) {
  if (totalAmount <= 0) throw Object.assign(new Error('Amount must be greater than zero'), { code: 'INVALID_AMOUNT' });
  
  return withTransaction(async (connection) => {
    // Create the expense record
    const [expenseResult] = await connection.query(`
      INSERT INTO expenses (category, description, amount, expense_date, delivery_id, created_by)
      VALUES ('GASOLINE', ?, ?, ?, ?, ?)
    `, [vehicleDescription ? `Gasoline - ${vehicleDescription}` : 'Gasoline', totalAmount, expenseDate, deliveryId || null, userId]);
    
    // Create the gasoline-specific record
    const [result] = await connection.query(`
      INSERT INTO gasoline_expenses (expense_id, quantity_liters, price_per_liter, total_amount, expense_date, vehicle_description, delivery_id, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [expenseResult.insertId, quantityLiters, pricePerLiter, totalAmount, expenseDate, vehicleDescription, deliveryId || null, notes, userId]);
    
    await connection.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [userId, 'GASOLINE_RECORDED', 'gasoline_expenses', result.insertId, JSON.stringify({ totalAmount, quantityLiters })]
    );
    return result.insertId;
  });
}

export async function getExpenses({ startDate, endDate, category }) {
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];
  
  if (startDate) { query += ' AND expense_date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND expense_date <= ?'; params.push(endDate); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  
  query += ' ORDER BY expense_date DESC';
  const [rows] = await pool.query(query, params);
  return rows;
}

export async function getExpenseById(expenseId) {
  const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [expenseId]);
  return rows[0];
}

export async function getGasolineExpenses({ startDate, endDate }) {
  let query = `
    SELECT ge.*, e.delivery_id, d.customer_id 
    FROM gasoline_expenses ge 
    LEFT JOIN expenses e ON ge.expense_id = e.id 
    LEFT JOIN deliveries d ON ge.delivery_id = d.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (startDate) { query += ' AND ge.expense_date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND ge.expense_date <= ?'; params.push(endDate); }
  
  query += ' ORDER BY ge.expense_date DESC';
  const [rows] = await pool.query(query, params);
  return rows;
}
