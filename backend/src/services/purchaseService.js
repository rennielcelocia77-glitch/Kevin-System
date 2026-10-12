import { pool, withTransaction } from '../config/db.js';
import { audit, businessError, lockItem, positive, produceItem } from './workflowHelpers.js';

export async function listPurchases() {
  const [rows] = await pool.query(`SELECT p.*, s.supplier_name FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.purchase_date DESC, p.id DESC`); return rows;
}

export async function createPurchase({ supplierId, purchaseDate, referenceNumber, itemId, quantity, unit, unitCost, notes, userId }) {
  const amount = positive(quantity, 'Purchase quantity'); const cost = Number(unitCost);
  if (!Number.isFinite(cost) || cost < 0) throw businessError('Unit cost cannot be negative', 'INVALID_AMOUNT');
  return withTransaction(async (connection) => {
    if (supplierId) { const [rows] = await connection.query('SELECT id FROM suppliers WHERE id = ? AND status = \'ACTIVE\'', [supplierId]); if (!rows[0]) throw businessError('Supplier not found', 'SUPPLIER_NOT_FOUND', 404); }
    const item = await lockItem(connection, itemId);
    if (item.item_type === 'FINISHED_PRODUCT') throw businessError('Purchases can only add raw materials', 'INVALID_ITEM_TYPE');
    if (unit && unit !== item.unit) throw businessError(`Invalid unit for ${item.item_name}`, 'INVALID_UNIT');
    const total = amount * cost;
    const [purchase] = await connection.query(`INSERT INTO purchases (supplier_id, purchase_date, reference_number, total_cost, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)`, [supplierId || null, purchaseDate, referenceNumber || null, total, notes || null, userId]);
    await connection.query('INSERT INTO purchase_items (purchase_id, inventory_item_id, quantity, unit, unit_cost, total_cost) VALUES (?, ?, ?, ?, ?, ?)', [purchase.insertId, item.id, amount, item.unit, cost, total]);
    await connection.query('UPDATE inventory_items SET cost_per_unit = ? WHERE id = ?', [cost, item.id]);
    await produceItem(connection, item, amount, 'PURCHASE', 'PURCHASE', purchase.insertId, userId, notes);
    await audit(connection, userId, 'PURCHASE_CREATED', 'purchases', purchase.insertId, { itemId, quantity: amount, total });
    return { id: purchase.insertId, totalCost: total, unit: item.unit };
  });
}
