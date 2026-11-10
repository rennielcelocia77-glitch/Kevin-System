export function businessError(message, code, status = 422) {
  return Object.assign(new Error(message), { code, status });
}

export function positive(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw businessError(`${name} must be greater than zero`, 'INVALID_QUANTITY');
  return number;
}

export function currency(value, name = 'Amount') {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw businessError(`${name} must be zero or greater`, 'INVALID_AMOUNT');
  return Number((Math.round((amount + Number.EPSILON) * 100) / 100).toFixed(2));
}

export async function lockItem(connection, itemId, expectedUnit, expectedType) {
  const [rows] = await connection.query('SELECT * FROM inventory_items WHERE id = ? AND is_active = 1 FOR UPDATE', [itemId]);
  const item = rows[0];
  if (!item) throw businessError('Inventory item not found', 'INVENTORY_ITEM_NOT_FOUND', 404);
  if (expectedUnit && item.unit !== expectedUnit) throw businessError(`Invalid unit for ${item.item_name}`, 'INVALID_UNIT');
  if (expectedType && item.item_type !== expectedType) throw businessError(`Invalid inventory type for ${item.item_name}`, 'INVALID_ITEM_TYPE');
  return item;
}

export async function consumeItem(connection, item, quantity, transactionType, referenceType, referenceId, userId, notes) {
  if (Number(item.current_quantity) < quantity) throw businessError(`Insufficient stock for ${item.item_name}`, 'INSUFFICIENT_STOCK', 409);
  await connection.query('UPDATE inventory_items SET current_quantity = current_quantity - ? WHERE id = ?', [quantity, item.id]);
  await connection.query(`INSERT INTO inventory_transactions
    (inventory_item_id, transaction_type, quantity, unit, reference_type, reference_id, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [item.id, transactionType, -quantity, item.unit, referenceType, referenceId, notes || null, userId]);
}

export async function produceItem(connection, item, quantity, transactionType, referenceType, referenceId, userId, notes) {
  await connection.query('UPDATE inventory_items SET current_quantity = current_quantity + ? WHERE id = ?', [quantity, item.id]);
  await connection.query(`INSERT INTO inventory_transactions
    (inventory_item_id, transaction_type, quantity, unit, reference_type, reference_id, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [item.id, transactionType, quantity, item.unit, referenceType, referenceId, notes || null, userId]);
}

export async function audit(connection, userId, action, entity, entityId, metadata = {}) {
  await connection.query('INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata) VALUES (?, ?, ?, ?, ?)', [userId, action, entity, entityId, JSON.stringify(metadata)]);
}

export function paymentStatus(total, paid) {
  if (paid === 0) return 'UNPAID';
  if (paid === total) return 'PAID';
  return 'PARTIALLY_PAID';
}
