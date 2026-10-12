import { pool, withTransaction } from '../config/db.js';
import { findAllItems, findItemForUpdate } from '../repositories/inventoryRepository.js';

export const INVENTORY_TYPES = ['RAW_MATERIAL', 'PROCESSED_MATERIAL', 'FINISHED_PRODUCT'];
export const TRANSACTION_TYPES = ['OPENING_STOCK', 'ADJUSTMENT', 'PURCHASE', 'STOCK_IN', 'STOCK_OUT', 'DAMAGE', 'LOSS'];

export async function listInventory() {
  return findAllItems(pool);
}

export async function getInventoryItemDetails(itemId) {
  const [items] = await pool.query('SELECT id, item_name, item_type, unit, current_quantity, reorder_level, cost_per_unit, selling_price, updated_at FROM inventory_items WHERE id = ? AND is_active = 1', [itemId]);
  if (!items[0]) throw Object.assign(new Error('Inventory item not found'), { code: 'ITEM_NOT_FOUND' });
  const [transactions] = await pool.query(`SELECT id, transaction_type, quantity, unit, reference_type, reference_id, reason, notes, created_at FROM inventory_transactions WHERE inventory_item_id = ? ORDER BY created_at DESC, id DESC`, [itemId]);
  const [purchases] = await pool.query(`SELECT p.id, p.purchase_date, p.reference_number, pi.quantity, pi.unit, pi.unit_cost, pi.total_cost, s.supplier_name FROM purchase_items pi JOIN purchases p ON p.id = pi.purchase_id LEFT JOIN suppliers s ON s.id = p.supplier_id WHERE pi.inventory_item_id = ? ORDER BY p.purchase_date DESC, p.id DESC`, [itemId]);
  return { item: items[0], transactions, purchases };
}

export async function createOpeningStock({ itemId, quantity, notes, userId }) {
  if (!Number.isFinite(quantity) || quantity <= 0) throw Object.assign(new Error('Quantity must be greater than zero'), { code: 'INVALID_QUANTITY' });
  return withTransaction(async (connection) => {
    const item = await findItemForUpdate(connection, itemId);
    if (!item) throw Object.assign(new Error('Inventory item not found'), { code: 'ITEM_NOT_FOUND' });
    await connection.query('UPDATE inventory_items SET current_quantity = current_quantity + ? WHERE id = ?', [quantity, itemId]);
    const [result] = await connection.query(`
      INSERT INTO inventory_transactions
      (inventory_item_id, transaction_type, quantity, unit, reference_type, reason, notes, created_by)
      VALUES (?, 'OPENING_STOCK', ?, ?, 'OPENING_STOCK', 'OPENING_STOCK', ?, ?)
    `, [itemId, quantity, item.unit, notes || null, userId]);
    await connection.query(`INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata) VALUES (?, 'INVENTORY_OPENING_STOCK', 'inventory_items', ?, ?)` , [userId, itemId, JSON.stringify({ quantity, unit: item.unit })]);
    return { transactionId: result.insertId, itemId, quantity, unit: item.unit };
  });
}
