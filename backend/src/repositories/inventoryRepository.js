export async function findAllItems(connection) {
  const [rows] = await connection.query(`
    SELECT id, item_name, item_type, unit, current_quantity, reorder_level,
           cost_per_unit, selling_price, is_active, updated_at
    FROM inventory_items WHERE is_active = 1 ORDER BY item_name
  `);
  return rows;
}

export async function findItemForUpdate(connection, itemId) {
  const [rows] = await connection.query('SELECT * FROM inventory_items WHERE id = ? AND is_active = 1 FOR UPDATE', [itemId]);
  return rows[0];
}
