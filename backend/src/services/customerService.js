import { pool } from '../config/db.js';
import { audit, businessError } from './workflowHelpers.js';

export async function listCustomers() { const [rows] = await pool.query('SELECT * FROM customers ORDER BY name'); return rows; }
export async function getCustomer(id) { const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]); if (!rows[0]) throw businessError('Customer not found', 'CUSTOMER_NOT_FOUND', 404); return rows[0]; }
export async function createCustomer({ name, contact, address, notes, userId }) { if (!name?.trim()) throw businessError('Customer name is required', 'VALIDATION_ERROR'); const [result] = await pool.query('INSERT INTO customers (name, contact, address, notes) VALUES (?, ?, ?, ?)', [name.trim(), contact || null, address || null, notes || null]); await audit(pool, userId, 'CUSTOMER_CREATED', 'customers', result.insertId, { name }); return { id: result.insertId, name: name.trim() }; }
