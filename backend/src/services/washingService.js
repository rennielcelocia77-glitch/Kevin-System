import { pool, withTransaction } from '../config/db.js';
import { audit, businessError, consumeItem, lockItem, positive, produceItem } from './workflowHelpers.js';

export async function listWashing(filters = {}) {
  let query = `SELECT w.*, e.name AS laborer_name FROM washing_transactions w LEFT JOIN employees e ON e.id = w.laborer_id WHERE 1=1`;
  const params = [];
  if (filters.date) { query += ' AND w.washing_date = ?'; params.push(filters.date); }
  if (filters.laborerId) { query += ' AND w.laborer_id = ?'; params.push(filters.laborerId); }
  query += ' ORDER BY w.washing_date DESC, w.id DESC';
  const [rows] = await pool.query(query, params); return rows;
}

export async function getWashing(id) {
  const [rows] = await pool.query(`SELECT w.*, e.name AS laborer_name FROM washing_transactions w LEFT JOIN employees e ON e.id = w.laborer_id WHERE w.id = ?`, [id]);
  if (!rows[0]) throw businessError('Washing transaction not found', 'WASHING_NOT_FOUND', 404);
  return rows[0];
}

export async function createWashing({ date, rawPinanitanBangan, washedPinanitanBangan, laborerId, laborCost = 0, notes, userId }) {
  const rawQuantity = positive(rawPinanitanBangan, 'Raw Pinanitan quantity');
  const washedQuantity = positive(washedPinanitanBangan, 'Washed Pinanitan quantity');
  const cost = Number(laborCost || 0);
  if (!Number.isFinite(cost) || cost < 0) throw businessError('Labor cost cannot be negative', 'INVALID_AMOUNT');
  return withTransaction(async (connection) => {
    if (laborerId) {
      const [workers] = await connection.query('SELECT id FROM employees WHERE id = ? AND status = \'ACTIVE\'', [laborerId]);
      if (!workers[0]) throw businessError('Laborer not found', 'LABORER_NOT_FOUND', 404);
    }
    const [rawRows] = await connection.query("SELECT * FROM inventory_items WHERE item_name = 'Raw Pinanitan' AND is_active = 1 FOR UPDATE");
    const [washedRows] = await connection.query("SELECT * FROM inventory_items WHERE item_name = 'Washed Pinanitan' AND is_active = 1 FOR UPDATE");
    const raw = rawRows[0]; const washed = washedRows[0];
    if (!raw || !washed) throw businessError('Washing inventory definitions are missing', 'INVENTORY_ITEM_NOT_FOUND', 500);
    if (raw.unit !== 'BANGAN' || washed.unit !== 'BANGAN') throw businessError('Pinanitan must use BANGAN', 'INVALID_UNIT');
    const [result] = await connection.query(`INSERT INTO washing_transactions (washing_date, raw_item_id, washed_item_id, raw_quantity, washed_quantity, laborer_id, labor_cost, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [date, raw.id, washed.id, rawQuantity, washedQuantity, laborerId || null, cost, notes || null, userId]);
    await consumeItem(connection, raw, rawQuantity, 'WASHING_CONSUMPTION', 'WASHING', result.insertId, userId, notes);
    await produceItem(connection, washed, washedQuantity, 'WASHING_OUTPUT', 'WASHING', result.insertId, userId, notes);
    if (laborerId && cost > 0) await connection.query(`INSERT INTO labor_records (laborer_id, work_date, work_type, description, quantity, unit, total_amount, payment_status, washing_transaction_id, notes, created_by) VALUES (?, ?, 'Washing Pinanitan', ?, ?, 'BANGAN', ?, 'PAID', ?, ?, ?)`, [laborerId, date, notes || null, rawQuantity, cost, result.insertId, notes || null, userId]);
    await audit(connection, userId, 'WASHING_CREATED', 'washing_transactions', result.insertId, { rawQuantity, washedQuantity, laborCost: cost });
    return { id: result.insertId, rawQuantity, washedQuantity, laborCost: cost };
  });
}
