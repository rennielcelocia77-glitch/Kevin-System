import { pool, withTransaction } from '../config/db.js';
import { audit, businessError, positive } from './workflowHelpers.js';

export async function listLaborers() { const [rows] = await pool.query('SELECT id, name, contact_information, status, notes, created_at, updated_at FROM employees ORDER BY name'); return rows; }
export async function createLaborer({ name, contactInformation, notes, userId }) {
  if (!name?.trim()) throw businessError('Laborer name is required', 'VALIDATION_ERROR');
  const [result] = await pool.query('INSERT INTO employees (name, contact_information, notes) VALUES (?, ?, ?)', [name.trim(), contactInformation || null, notes || null]);
  await pool.query(`INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata) VALUES (?, 'LABORER_CREATED', 'employees', ?, ?)`, [userId, result.insertId, JSON.stringify({ name })]);
  return { id: result.insertId, name: name.trim() };
}
export async function listLabor(filters = {}) {
  let query = `SELECT l.*, e.name AS laborer_name FROM labor_records l JOIN employees e ON e.id = l.laborer_id WHERE 1=1`; const params = [];
  if (filters.laborerId) { query += ' AND l.laborer_id = ?'; params.push(filters.laborerId); }
  if (filters.workType) { query += ' AND l.work_type = ?'; params.push(filters.workType); }
  if (filters.paymentStatus) { query += ' AND l.payment_status = ?'; params.push(filters.paymentStatus); }
  query += ' ORDER BY l.work_date DESC, l.id DESC'; const [rows] = await pool.query(query, params); return rows;
}
export async function getLabor(id) {
  const [rows] = await pool.query('SELECT l.*, e.name AS laborer_name FROM labor_records l JOIN employees e ON e.id = l.laborer_id WHERE l.id = ?', [id]);
  if (!rows[0]) throw businessError('Labor record not found', 'LABOR_NOT_FOUND', 404);
  return rows[0];
}
export async function createLabor({ laborerId, workDate, workType, description, quantity, unit, amount, paymentStatus = 'PAID', notes, userId }) {
  const total = positive(amount, 'Labor amount');
  return withTransaction(async (connection) => {
    const [workers] = await connection.query('SELECT id FROM employees WHERE id = ? AND status = \'ACTIVE\'', [laborerId]);
    if (!workers[0]) throw businessError('Laborer not found', 'LABORER_NOT_FOUND', 404);
    const validStatuses = ['UNPAID', 'PARTIALLY_PAID', 'PAID']; if (!validStatuses.includes(paymentStatus)) throw businessError('Invalid labor payment status', 'INVALID_PAYMENT_STATUS');
    const [result] = await connection.query(`INSERT INTO labor_records (laborer_id, work_date, work_type, description, quantity, unit, total_amount, payment_status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [laborerId, workDate, workType, description || null, quantity || null, unit || null, total, paymentStatus, notes || null, userId]);
    await audit(connection, userId, 'LABOR_CREATED', 'labor_records', result.insertId, { laborerId, amount: total }); return { id: result.insertId };
  });
}
export async function updateLabor(id, { workType, description, quantity, unit, amount, paymentStatus, notes, userId }) {
  const total = positive(amount, 'Labor amount');
  const statuses = ['UNPAID', 'PARTIALLY_PAID', 'PAID']; if (!statuses.includes(paymentStatus)) throw businessError('Invalid labor payment status', 'INVALID_PAYMENT_STATUS');
  const [result] = await pool.query('UPDATE labor_records SET work_type = ?, description = ?, quantity = ?, unit = ?, total_amount = ?, payment_status = ?, notes = ? WHERE id = ?', [workType, description || null, quantity || null, unit || null, total, paymentStatus, notes || null, id]);
  if (!result.affectedRows) throw businessError('Labor record not found', 'LABOR_NOT_FOUND', 404);
  await audit(pool, userId, 'LABOR_UPDATED', 'labor_records', id, { amount: total }); return getLabor(id);
}
