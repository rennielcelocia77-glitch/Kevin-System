import { pool } from '../config/db.js';

export async function listHistory({ startDate, endDate, type } = {}) {
  const conditions = [];
  const params = [];
  if (startDate) { conditions.push('activity_date >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('activity_date <= ?'); params.push(endDate); }
  if (type) { conditions.push('activity_type = ?'); params.push(type); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(`
    SELECT * FROM (
      SELECT
        it.id AS id,
        it.created_at AS activity_date,
        'INVENTORY' AS activity_type,
        it.transaction_type AS action,
        ii.item_name AS subject,
        CONCAT(
          CASE WHEN it.transaction_type IN ('OPENING_STOCK', 'PURCHASE', 'STOCK_IN', 'WASHING_OUTPUT', 'PRODUCTION_OUTPUT', 'SALE_RETURN') THEN '+' ELSE '-' END,
          it.quantity, ' ', it.unit
        ) AS detail,
        it.reference_type,
        it.reference_id,
        u.name AS user_name,
        it.notes
      FROM inventory_transactions it
      JOIN inventory_items ii ON ii.id = it.inventory_item_id
      LEFT JOIN users u ON u.id = it.created_by
      UNION ALL
      SELECT
        al.id AS id,
        al.created_at AS activity_date,
        'PROCESS' AS activity_type,
        al.action AS action,
        al.entity AS subject,
        JSON_UNQUOTE(JSON_EXTRACT(al.metadata, '$')) AS detail,
        al.entity AS reference_type,
        al.entity_id AS reference_id,
        u.name AS user_name,
        NULL AS notes
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.action NOT LIKE 'EMPLOYEE_ADVANCE%'
      UNION ALL
      SELECT
        a.id AS id,
        a.advance_date AS activity_date,
        'EMPLOYEE_ADVANCE' AS activity_type,
        'ADVANCE_ADDED' AS action,
        e.name AS subject,
        CONCAT('+', a.amount, ' advance') AS detail,
        'employee_cash_advances' AS reference_type,
        a.id AS reference_id,
        u.name AS user_name,
        a.notes
      FROM employee_cash_advances a
      JOIN employees e ON e.id = a.employee_id
      LEFT JOIN users u ON u.id = a.created_by
      UNION ALL
      SELECT
        p.id AS id,
        p.payment_date AS activity_date,
        'EMPLOYEE_ADVANCE' AS activity_type,
        'ADVANCE_PAYMENT' AS action,
        e.name AS subject,
        CONCAT('-', p.amount, ' repayment') AS detail,
        'employee_advance_payments' AS reference_type,
        p.advance_id AS reference_id,
        u.name AS user_name,
        p.notes
      FROM employee_advance_payments p
      JOIN employees e ON e.id = p.employee_id
      LEFT JOIN users u ON u.id = p.created_by
    ) history
    ${where}
    ORDER BY activity_date DESC, id DESC
  `, params);
  return rows;
}
