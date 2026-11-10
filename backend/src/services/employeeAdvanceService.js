import { pool, withTransaction } from '../config/db.js';
import { audit, businessError, currency, positive } from './workflowHelpers.js';

export async function listAdvances() {
  const [rows] = await pool.query(`
    SELECT a.id, a.employee_id, e.name AS employee_name, a.advance_date, a.amount,
           COALESCE(SUM(p.amount), 0) AS paid_amount,
           a.amount - COALESCE(SUM(p.amount), 0) AS balance, a.notes, a.created_at
    FROM employee_cash_advances a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN employee_advance_payments p ON p.advance_id = a.id
    GROUP BY a.id
    ORDER BY a.advance_date DESC, a.id DESC
  `);
  return rows;
}

export async function addAdvance({ employeeId, advanceDate, amount, notes, userId }) {
  const advanceAmount = currency(positive(amount, 'Advance amount'), 'Advance amount');
  if (advanceAmount <= 0) throw businessError('Advance amount must be at least one cent', 'INVALID_AMOUNT');
  return withTransaction(async connection => {
    const [employees] = await connection.query("SELECT id FROM employees WHERE id = ? AND status = 'ACTIVE'", [employeeId]);
    if (!employees[0]) throw businessError('Employee not found', 'EMPLOYEE_NOT_FOUND', 404);
    const [result] = await connection.query(
      'INSERT INTO employee_cash_advances (employee_id, advance_date, amount, notes, created_by) VALUES (?, ?, ?, ?, ?)',
      [employeeId, advanceDate, advanceAmount, notes || null, userId]
    );
    await audit(connection, userId, 'EMPLOYEE_ADVANCE_CREATED', 'employee_cash_advances', result.insertId, { employeeId, amount: advanceAmount });
    return { id: result.insertId, employeeId, amount: advanceAmount, balance: advanceAmount };
  });
}

export async function payAdvance({ advanceId, paymentDate, amount, notes, userId }) {
  const paymentAmount = currency(positive(amount, 'Payment amount'), 'Payment amount');
  if (paymentAmount <= 0) throw businessError('Payment amount must be at least one cent', 'INVALID_AMOUNT');
  return withTransaction(async connection => {
    const [advances] = await connection.query('SELECT id, employee_id, amount FROM employee_cash_advances WHERE id = ? FOR UPDATE', [advanceId]);
    const advance = advances[0];
    if (!advance) throw businessError('Cash advance not found', 'ADVANCE_NOT_FOUND', 404);
    const [payments] = await connection.query('SELECT COALESCE(SUM(amount), 0) AS paid_amount FROM employee_advance_payments WHERE advance_id = ?', [advanceId]);
    const balance = Number(advance.amount) - Number(payments[0].paid_amount);
    if (paymentAmount > balance) throw businessError('Payment cannot exceed the remaining advance', 'PAYMENT_EXCEEDS_BALANCE', 422);
    const [result] = await connection.query(
      'INSERT INTO employee_advance_payments (advance_id, employee_id, payment_date, amount, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [advanceId, advance.employee_id, paymentDate, paymentAmount, notes || null, userId]
    );
    await audit(connection, userId, 'EMPLOYEE_ADVANCE_PAYMENT_CREATED', 'employee_advance_payments', result.insertId, { advanceId, amount: paymentAmount });
    return { id: result.insertId, advanceId, paidAmount: paymentAmount, balance: balance - paymentAmount };
  });
}
