import { pool } from '../config/db.js';

export function businessDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function businessYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit' }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month) };
}

// Helper: Calculate customer balance
export async function getCustomerBalance(customerId) {
  const [rows] = await pool.query(`
    SELECT
      COALESCE((SELECT SUM(s.total_amount) FROM sales s WHERE s.customer_id = ? AND s.status = 'COMPLETED'), 0) AS total_sales,
      COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.customer_id = ?), 0) AS total_paid
  `, [customerId]);
  
  const { total_sales, total_paid } = rows[0];
  return {
    totalSales: total_sales,
    totalPaid: total_paid,
    outstanding: total_sales - total_paid
  };
}

// Daily Report
export async function getDailyReport(reportDate) {
  const [sales] = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
    FROM sales WHERE sale_date = ? AND status = 'COMPLETED'
  `, [reportDate]);
  
  const [payments] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date = ?',
    [reportDate]
  );
  
  const [production] = await pool.query(
    'SELECT COUNT(*) as count, COALESCE(SUM(output_quantity), 0) as brooms FROM production_transactions WHERE production_date = ?',
    [reportDate]
  );
  
  const [washing] = await pool.query(
    'SELECT COUNT(*) as count, COALESCE(SUM(raw_quantity), 0) as raw_used, COALESCE(SUM(washed_quantity), 0) as washed_output FROM washing_transactions WHERE washing_date = ?',
    [reportDate]
  );
  
  const [expenses] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date = ?',
    [reportDate]
  );
  
  const [labor] = await pool.query(
    'SELECT COALESCE(SUM(total_amount), 0) as total FROM labor_records WHERE work_date = ?',
    [reportDate]
  );
  
  const salesTotal = sales[0].total;
  const paymentsTotal = payments[0].total;
  const expensesTotal = expenses[0].total + labor[0].total;
  
  return {
    date: reportDate,
    sales: { count: sales[0].count, amount: salesTotal },
    payments: paymentsTotal,
    creditsCreated: salesTotal - paymentsTotal,
    production: { batches: production[0].count, brooms: production[0].brooms },
    washing: { batches: washing[0].count, raw: washing[0].raw_used, output: washing[0].washed_output },
    expenses: expensesTotal,
    grossProfit: salesTotal - expensesTotal
  };
}

// Monthly Report
export async function getMonthlyReport(month, year) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
  
  const [sales] = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
    FROM sales WHERE sale_date BETWEEN ? AND ? AND status = 'COMPLETED'
  `, [startDate, endDate]);
  
  const [payments] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date BETWEEN ? AND ?',
    [startDate, endDate]
  );
  
  const [saleItems] = await pool.query(`
    SELECT COALESCE(SUM(si.quantity), 0) as total_items
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.sale_date BETWEEN ? AND ? AND s.status = 'COMPLETED'
    AND si.inventory_item_id = (SELECT id FROM inventory_items WHERE item_name = 'Finished Broom')
  `, [startDate, endDate]);
  
  const [production] = await pool.query(
    'SELECT COUNT(*) as count, COALESCE(SUM(output_quantity), 0) as total FROM production_transactions WHERE production_date BETWEEN ? AND ?',
    [startDate, endDate]
  );
  
  const [washing] = await pool.query(
    'SELECT COALESCE(SUM(raw_quantity), 0) as raw, COALESCE(SUM(washed_quantity), 0) as washed FROM washing_transactions WHERE washing_date BETWEEN ? AND ?',
    [startDate, endDate]
  );
  
  const [expenses] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date BETWEEN ? AND ?',
    [startDate, endDate]
  );
  
  const [labor] = await pool.query(
    'SELECT COALESCE(SUM(total_amount), 0) as total FROM labor_records WHERE work_date BETWEEN ? AND ?',
    [startDate, endDate]
  );
  
  const salesTotal = sales[0].total;
  const laborTotal = labor[0].total;
  const expensesTotal = expenses[0].total;
  
  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    sales: { count: sales[0].count, amount: salesTotal, broomsSold: saleItems[0].total_items },
    payments: payments[0].total,
    creditsCreated: salesTotal - payments[0].total,
    production: { batches: production[0].count, brooms: production[0].total },
    washing: { raw: washing[0].raw, output: washing[0].washed },
    expenses: expensesTotal,
    labor: laborTotal,
    netProfit: salesTotal - expensesTotal - laborTotal
  };
}

// Dashboard data
export async function getDashboardData() {
  const today = businessDate();
  
  // Today's data
  const [todaySales] = await pool.query(`
    SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sale_date = ? AND status = 'COMPLETED'
  `, [today]);
  
  const [todayPayments] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date = ?',
    [today]
  );
  
  const [todayExpenses] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date = ?',
    [today]
  );
  
  // This month data
  const { year, month } = businessYearMonth();
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
  
  const [monthSales] = await pool.query(`
    SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sale_date BETWEEN ? AND ? AND status = 'COMPLETED'
  `, [monthStart, monthEnd]);
  
  const [monthPayments] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date BETWEEN ? AND ?',
    [monthStart, monthEnd]
  );
  
  const [monthExpenses] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date BETWEEN ? AND ?',
    [monthStart, monthEnd]
  );

  const [monthLabor] = await pool.query(
    'SELECT COALESCE(SUM(total_amount), 0) as total FROM labor_records WHERE work_date BETWEEN ? AND ?',
    [monthStart, monthEnd]
  );
  
  // Inventory
  const [inventory] = await pool.query('SELECT item_name, current_quantity, unit, reorder_level FROM inventory_items WHERE is_active = 1 ORDER BY item_name');
  
  // Outstanding debt
  const [debt] = await pool.query(`
    SELECT COALESCE(SUM(balance), 0) AS outstanding
    FROM (
      SELECT s.total_amount - COALESCE(SUM(p.amount), 0) AS balance
      FROM sales s
      LEFT JOIN payments p ON p.sale_id = s.id
      WHERE s.status = 'COMPLETED'
      GROUP BY s.id, s.total_amount
    ) sale_balances
    WHERE balance > 0
  `);
  
  const [lowStock] = await pool.query(`
    SELECT item_name, current_quantity, unit, reorder_level
    FROM inventory_items
    WHERE is_active = 1 AND current_quantity <= reorder_level
  `);
  
  return {
    today: {
      sales: todaySales[0].total,
      payments: todayPayments[0].total,
      expenses: todayExpenses[0].total
    },
    month: {
      sales: monthSales[0].total,
      payments: monthPayments[0].total,
      expenses: monthExpenses[0].total,
      labor: monthLabor[0].total,
      profit: monthSales[0].total - monthExpenses[0].total - monthLabor[0].total
    },
    inventory,
    alerts: {
      outstandingDebt: debt[0].outstanding,
      lowStockItems: lowStock.length,
      lowStock
    }
  };
}

// Yearly data
export async function getYearlyReport(year) {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    months.push(await getMonthlyReport(m, year));
  }
  
  return {
    year,
    months,
    totals: {
      sales: months.reduce((sum, m) => sum + m.sales.amount, 0),
      payments: months.reduce((sum, m) => sum + m.payments, 0),
      expenses: months.reduce((sum, m) => sum + m.expenses, 0),
      profit: months.reduce((sum, m) => sum + m.netProfit, 0)
    }
  };
}

// Inventory Report
export async function getInventoryReport(startDate, endDate) {
  const items = await pool.query(`
    SELECT id, item_name, unit, current_quantity FROM inventory_items WHERE is_active = 1 ORDER BY item_name
  `);
  
  const report = [];
  for (const item of items[0]) {
    const [transactions] = await pool.query(`
      SELECT transaction_type, SUM(quantity) as qty
      FROM inventory_transactions
      WHERE inventory_item_id = ? AND created_at BETWEEN ? AND ?
      GROUP BY transaction_type
    `, [item.id, startDate + ' 00:00:00', endDate + ' 23:59:59']);
    
    report.push({
      item: item.item_name,
      unit: item.unit,
      current: item.current_quantity,
      transactions: Object.fromEntries(transactions.map(t => [t.transaction_type, t.qty]))
    });
  }
  
  return report;
}

// Production Report
export async function getProductionReport(startDate, endDate) {
  const [batches] = await pool.query(`
    SELECT 
      pt.production_date,
      COUNT(*) as batch_count,
      COALESCE(SUM(pt.output_quantity), 0) as total_brooms,
      COALESCE(SUM(pt.material_cost), 0) as material_cost,
      COALESCE(SUM(pt.labor_cost), 0) as labor_cost,
      COALESCE(SUM(pt.total_cost), 0) as total_cost
    FROM production_transactions pt
    WHERE pt.production_date BETWEEN ? AND ?
    GROUP BY pt.production_date
  `, [startDate, endDate]);
  
  const totalBrooms = batches.reduce((sum, b) => sum + b.total_brooms, 0);
  const totalCost = batches.reduce((sum, b) => sum + b.total_cost, 0);
  
  return {
    batches,
    summary: {
      totalBatches: batches.length,
      totalBrooms,
      totalCost,
      averageCostPerBroom: totalBrooms > 0 ? totalCost / totalBrooms : 0
    }
  };
}
