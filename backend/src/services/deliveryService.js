import { pool, withTransaction } from '../config/db.js';

export async function createDelivery({ saleId, customerId, deliveryDate, deliveryAddress, driverName, notes, userId }) {
  return withTransaction(async (connection) => {
    // Verify sale exists
    const [sales] = await connection.query('SELECT id, customer_id FROM sales WHERE id = ? AND status = \'COMPLETED\'', [saleId]);
    if (!sales.length) throw Object.assign(new Error('Sale not found or not completed'), { code: 'SALE_NOT_FOUND' });
    const saleCustomerId = sales[0].customer_id;
    if (customerId && Number(customerId) !== Number(saleCustomerId)) {
      throw Object.assign(new Error('Delivery customer must match the sale customer'), { code: 'CUSTOMER_MISMATCH' });
    }
    
    const [result] = await connection.query(`
      INSERT INTO deliveries (sale_id, customer_id, delivery_date, delivery_address, driver_name, notes, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `, [saleId, saleCustomerId, deliveryDate, deliveryAddress, driverName, notes, userId]);
    
    await connection.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [userId, 'DELIVERY_CREATED', 'deliveries', result.insertId, JSON.stringify({ saleId, customerId })]
    );
    return result.insertId;
  });
}

export async function updateDeliveryStatus({ deliveryId, status, userId }) {
  const validStatuses = ['PENDING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) throw Object.assign(new Error('Invalid status'), { code: 'INVALID_STATUS' });
  
  return withTransaction(async (connection) => {
    const [deliveries] = await connection.query('SELECT id FROM deliveries WHERE id = ?', [deliveryId]);
    if (!deliveries.length) throw Object.assign(new Error('Delivery not found'), { code: 'DELIVERY_NOT_FOUND' });
    
    await connection.query('UPDATE deliveries SET status = ?, updated_at = NOW() WHERE id = ?', [status, deliveryId]);
    await connection.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [userId, 'DELIVERY_UPDATED', 'deliveries', deliveryId, JSON.stringify({ status })]
    );
  });
}

export async function getDeliveries({ startDate, endDate, customerId, status }) {
  let query = 'SELECT d.*, c.name as customer_name, s.total_amount FROM deliveries d LEFT JOIN customers c ON d.customer_id = c.id LEFT JOIN sales s ON d.sale_id = s.id WHERE 1=1';
  const params = [];
  
  if (startDate) { query += ' AND d.delivery_date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND d.delivery_date <= ?'; params.push(endDate); }
  if (customerId) { query += ' AND d.customer_id = ?'; params.push(customerId); }
  if (status) { query += ' AND d.status = ?'; params.push(status); }
  
  query += ' ORDER BY d.delivery_date DESC';
  const [rows] = await pool.query(query, params);
  return rows;
}

export async function getDeliveryById(deliveryId) {
  const [rows] = await pool.query(
    'SELECT d.*, c.name as customer_name, s.total_amount FROM deliveries d LEFT JOIN customers c ON d.customer_id = c.id LEFT JOIN sales s ON d.sale_id = s.id WHERE d.id = ?',
    [deliveryId]
  );
  return rows[0];
}
