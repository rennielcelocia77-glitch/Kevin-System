import { pool, withTransaction } from '../config/db.js';
import { audit, businessError, consumeItem, currency, lockItem, positive, produceItem } from './workflowHelpers.js';

export async function listProduction() {
  const [rows] = await pool.query(`SELECT p.*, i.item_name AS output_item_name FROM production_transactions p JOIN inventory_items i ON i.id = p.output_item_id ORDER BY p.production_date DESC, p.id DESC`);
  return rows;
}

export async function getProduction(id) {
  const [rows] = await pool.query(`SELECT p.*, i.item_name AS output_item_name FROM production_transactions p JOIN inventory_items i ON i.id = p.output_item_id WHERE p.id = ?`, [id]);
  if (!rows[0]) throw businessError('Production transaction not found', 'PRODUCTION_NOT_FOUND', 404);
  const [materials] = await pool.query(`SELECT pm.*, i.item_name FROM production_materials pm JOIN inventory_items i ON i.id = pm.inventory_item_id WHERE pm.production_id = ?`, [id]);
  const [labor] = await pool.query(`SELECT l.*, e.name AS laborer_name FROM labor_records l JOIN employees e ON e.id = l.laborer_id WHERE l.production_id = ?`, [id]);
  return { ...rows[0], materials, labor };
}

export async function createProduction({ productionDate, washedPinanitanItemId, washedPinanitanQuantity, bambooHandleItemId, bambooHandleQuantity, polyCordItemId, polyCordQuantity, finishedBroomItemId, broomsProduced, labor = [], notes, userId }) {
  const quantities = [
    [washedPinanitanQuantity, 'Washed Pinanitan quantity'],
    [bambooHandleQuantity, 'Bamboo Handle quantity'],
    [polyCordQuantity, 'Poly Cord quantity'],
    [broomsProduced, 'Brooms produced']
  ]; quantities.forEach(([value, name]) => positive(value, name));
  if (!Array.isArray(labor)) throw businessError('Labor must be an array', 'INVALID_LABOR');
  return withTransaction(async (connection) => {
    const washed = await lockItem(connection, washedPinanitanItemId, 'BANGAN', 'PROCESSED_MATERIAL');
    const handles = await lockItem(connection, bambooHandleItemId, 'PIECE', 'RAW_MATERIAL');
    const cord = await lockItem(connection, polyCordItemId, null, 'RAW_MATERIAL');
    const broom = await lockItem(connection, finishedBroomItemId, 'PIECE', 'FINISHED_PRODUCT');
    const materialCost = currency(Number(washed.cost_per_unit) * Number(washedPinanitanQuantity) + Number(handles.cost_per_unit) * Number(bambooHandleQuantity) + Number(cord.cost_per_unit) * Number(polyCordQuantity), 'Material cost');
    let laborCost = 0;
    for (const entry of labor) {
      const amount = Number(entry.amount);
      if (!entry.laborerId || !Number.isFinite(amount) || amount < 0) throw businessError('Each labor record requires a valid laborer and amount', 'INVALID_LABOR');
      entry.amount = currency(amount, 'Labor amount');
      const [workers] = await connection.query('SELECT id FROM employees WHERE id = ? AND status = \'ACTIVE\'', [entry.laborerId]);
      if (!workers[0]) throw businessError('Laborer not found', 'LABORER_NOT_FOUND', 404);
      laborCost = currency(laborCost + entry.amount, 'Labor cost');
    }
    const totalCost = currency(materialCost + laborCost, 'Production cost');
    const [result] = await connection.query(`INSERT INTO production_transactions (production_date, output_item_id, output_quantity, material_cost, labor_cost, total_cost, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [productionDate, broom.id, broomsProduced, materialCost, laborCost, totalCost, notes || null, userId]);
    const materials = [[washed, washedPinanitanQuantity], [handles, bambooHandleQuantity], [cord, polyCordQuantity]];
    for (const [item, quantity] of materials) {
      await consumeItem(connection, item, Number(quantity), 'PRODUCTION_CONSUMPTION', 'PRODUCTION', result.insertId, userId, notes);
      await connection.query('INSERT INTO production_materials (production_id, inventory_item_id, quantity, unit) VALUES (?, ?, ?, ?)', [result.insertId, item.id, quantity, item.unit]);
    }
    await produceItem(connection, broom, Number(broomsProduced), 'PRODUCTION_OUTPUT', 'PRODUCTION', result.insertId, userId, notes);
    for (const entry of labor) await connection.query(`INSERT INTO labor_records (laborer_id, work_date, work_type, description, quantity, unit, total_amount, payment_status, production_id, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'PAID', ?, ?, ?)`, [entry.laborerId, productionDate, entry.workType || 'Broom Production', entry.description || null, entry.quantity || null, entry.unit || 'PIECE', entry.amount, result.insertId, entry.notes || null, userId]);
    await audit(connection, userId, 'PRODUCTION_CREATED', 'production_transactions', result.insertId, { broomsProduced, materialCost, laborCost });
    return { id: result.insertId, broomsProduced, materialCost, laborCost, totalCost };
  });
}
