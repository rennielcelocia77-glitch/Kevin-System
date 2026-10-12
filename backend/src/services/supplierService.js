import { pool, withTransaction } from '../config/db.js';
import { audit, businessError } from './workflowHelpers.js';

export const SUPPLIER_ITEM_CATEGORIES = ['Pinanitan', 'Bamboo Handle', 'Poly Cord', 'Washed Pinanitan', 'Finished Broom', 'Other'];

export async function listSuppliers() {
  const [rows] = await pool.query(`
    SELECT s.id, s.supplier_name, s.contact_person, s.phone, s.address, s.status, s.notes,
           COALESCE(GROUP_CONCAT(sic.item_category ORDER BY sic.item_category SEPARATOR ', '), '') AS item_categories
    FROM suppliers s
    LEFT JOIN supplier_item_categories sic ON sic.supplier_id = s.id
    GROUP BY s.id ORDER BY s.supplier_name
  `);
  return rows;
}

export async function createSupplier({ supplierName, contactPerson, phone, address, status = 'ACTIVE', notes, itemCategories = [], userId }) {
  if (!supplierName?.trim()) throw businessError('Supplier name is required', 'VALIDATION_ERROR');
  const categories = [...new Set(itemCategories)].filter(category => SUPPLIER_ITEM_CATEGORIES.includes(category));
  return withTransaction(async connection => {
    const [result] = await connection.query(`INSERT INTO suppliers (supplier_name, contact_person, phone, address, status, notes) VALUES (?, ?, ?, ?, ?, ?)`, [supplierName.trim(), contactPerson || null, phone || null, address || null, status, notes || null]);
    for (const category of categories) await connection.query('INSERT INTO supplier_item_categories (supplier_id, item_category) VALUES (?, ?)', [result.insertId, category]);
    await audit(connection, userId, 'SUPPLIER_CREATED', 'suppliers', result.insertId, { itemCategories: categories });
    return { id: result.insertId, supplierName: supplierName.trim(), itemCategories: categories };
  });
}