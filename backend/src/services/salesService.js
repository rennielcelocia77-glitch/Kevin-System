import { pool, withTransaction } from '../config/db.js';
import { audit, businessError, consumeItem, lockItem, paymentStatus, positive } from './workflowHelpers.js';

async function saleSummary(connection, saleId) {
  const [rows] = await connection.query(`SELECT s.*, COALESCE(SUM(p.amount), 0) AS amount_paid, s.total_amount - COALESCE(SUM(p.amount), 0) AS balance FROM sales s LEFT JOIN payments p ON p.sale_id = s.id WHERE s.id = ? GROUP BY s.id`, [saleId]);
  const sale = rows[0]; if (!sale) throw businessError('Sale not found', 'SALE_NOT_FOUND', 404);
  sale.payment_status = paymentStatus(Number(sale.total_amount), Number(sale.amount_paid)); return sale;
}

export async function listSales() {
  const [rows] = await pool.query(`SELECT s.id, s.sale_date, s.reference_number, s.total_amount, s.status, c.name AS customer_name, COALESCE(SUM(p.amount), 0) amount_paid, s.total_amount - COALESCE(SUM(p.amount), 0) balance FROM sales s LEFT JOIN customers c ON c.id = s.customer_id LEFT JOIN payments p ON p.sale_id = s.id GROUP BY s.id ORDER BY s.sale_date DESC, s.id DESC`);
  return rows.map(row => ({ ...row, payment_status: paymentStatus(Number(row.total_amount), Number(row.amount_paid)) }));
}
export async function getSale(id) {
  const sale = await saleSummary(pool, id); const [items] = await pool.query(`SELECT si.*, i.item_name FROM sale_items si JOIN inventory_items i ON i.id = si.inventory_item_id WHERE si.sale_id = ?`, [id]); const [payments] = await pool.query('SELECT * FROM payments WHERE sale_id = ? ORDER BY payment_date, id', [id]); return { ...sale, items, payments };
}
export async function createSale({ customerId, saleDate, referenceNumber, items, amountPaid = 0, paymentDate, paymentReference, notes, userId }) {
  if (!customerId) throw businessError('Customer is required', 'CUSTOMER_NOT_FOUND', 422);
  if (!Array.isArray(items) || items.length === 0) throw businessError('At least one sale item is required', 'INVALID_SALE_ITEMS');
  const paid = Number(amountPaid || 0); if (!Number.isFinite(paid) || paid < 0) throw businessError('Payment cannot be negative', 'INVALID_PAYMENT');
  return withTransaction(async (connection) => {
    const [customers] = await connection.query('SELECT id FROM customers WHERE id = ? AND status = \'ACTIVE\'', [customerId]); if (!customers[0]) throw businessError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
    const prepared = []; let total = 0;
    for (const entry of items) {
      const quantity = positive(entry.quantity, 'Sale quantity'); const price = Number(entry.unitPrice); if (!Number.isFinite(price) || price < 0) throw businessError('Unit price is invalid', 'INVALID_AMOUNT');
      const item = await lockItem(connection, entry.inventoryItemId, 'PIECE', 'FINISHED_PRODUCT'); const subtotal = quantity * price; total += subtotal; prepared.push({ item, quantity, price, subtotal });
    }
    if (paid > total) throw businessError('Payment cannot exceed sale total', 'INVALID_PAYMENT');
    const [sale] = await connection.query('INSERT INTO sales (customer_id, sale_date, reference_number, total_amount, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)', [customerId, saleDate, referenceNumber || null, total, notes || null, userId]);
    for (const entry of prepared) { await connection.query('INSERT INTO sale_items (sale_id, inventory_item_id, quantity, unit, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)', [sale.insertId, entry.item.id, entry.quantity, entry.item.unit, entry.price, entry.subtotal]); await consumeItem(connection, entry.item, entry.quantity, 'SALE', 'SALE', sale.insertId, userId, notes); }
    if (paid > 0) await connection.query('INSERT INTO payments (sale_id, customer_id, payment_date, amount, reference_number, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [sale.insertId, customerId, paymentDate || saleDate, paid, paymentReference || null, notes || null, userId]);
    await audit(connection, userId, 'SALE_CREATED', 'sales', sale.insertId, { total, amountPaid: paid, balance: total - paid });
    return { id: sale.insertId, totalAmount: total, amountPaid: paid, balance: total - paid, paymentStatus: paymentStatus(total, paid) };
  });
}

export async function createPayment({ saleId, paymentDate, amount, referenceNumber, notes, userId }) {
  const payment = positive(amount, 'Payment amount');
  return withTransaction(async (connection) => {
    const sale = await saleSummary(connection, saleId); if (sale.status === 'CANCELLED') throw businessError('Cannot pay a cancelled sale', 'SALE_CANCELLED');
    const balance = Number(sale.balance); if (payment > balance) throw businessError('Payment cannot exceed outstanding balance', 'PAYMENT_EXCEEDS_BALANCE', 422);
    const [result] = await connection.query('INSERT INTO payments (sale_id, customer_id, payment_date, amount, reference_number, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [saleId, sale.customer_id, paymentDate, payment, referenceNumber || null, notes || null, userId]);
    await audit(connection, userId, 'PAYMENT_CREATED', 'payments', result.insertId, { saleId, amount: payment, remainingBalance: balance - payment }); return { id: result.insertId, saleId, amount: payment, balance: balance - payment, paymentStatus: paymentStatus(Number(sale.total_amount), Number(sale.amount_paid) + payment) };
  });
}
export async function listPayments() { const [rows] = await pool.query(`SELECT p.*, c.name AS customer_name FROM payments p LEFT JOIN customers c ON c.id = p.customer_id ORDER BY p.payment_date DESC, p.id DESC`); return rows; }
export async function customerBalance(customerId) { const [rows] = await pool.query(`SELECT c.id, c.name, COALESCE(SUM(s.total_amount), 0) AS total_sales, COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id = c.id), 0) AS total_paid FROM customers c LEFT JOIN sales s ON s.customer_id = c.id AND s.status = 'COMPLETED' WHERE c.id = ? GROUP BY c.id`, [customerId]); const row = rows[0]; if (!row) throw businessError('Customer not found', 'CUSTOMER_NOT_FOUND', 404); return { ...row, balance: Number(row.total_sales) - Number(row.total_paid) }; }
export async function customerDebts(customerId) { await customerBalance(customerId); const [rows] = await pool.query(`SELECT s.id, s.sale_date, s.total_amount, COALESCE(SUM(p.amount), 0) amount_paid, s.total_amount - COALESCE(SUM(p.amount), 0) balance FROM sales s LEFT JOIN payments p ON p.sale_id = s.id WHERE s.customer_id = ? AND s.status = 'COMPLETED' GROUP BY s.id HAVING balance > 0 ORDER BY s.sale_date`, [customerId]); return rows; }
