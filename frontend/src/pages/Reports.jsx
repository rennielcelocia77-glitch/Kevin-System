import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Reports() {
  const [reportType, setReportType] = useState('dashboard');
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadReport() {
    setLoading(true);
    setError('');
    try {
      let result;
      if (reportType === 'dashboard') result = await api.reports.dashboard();
      else if (reportType === 'monthly') result = await api.reports.monthly(selectedMonth, selectedYear);
      else if (reportType === 'yearly') result = await api.reports.yearly(selectedYear);
      else if (reportType === 'inventory') result = await api.reports.inventory();
      else if (reportType === 'production') result = await api.reports.production();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [reportType, selectedMonth, selectedYear]);

  return (
    <section className="page-section">
      <div className="section-intro">
        <div><p className="eyebrow">Business intelligence</p><h2>Reports</h2></div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {['dashboard', 'monthly', 'yearly', 'inventory', 'production'].map(type => (
          <button key={type} onClick={() => setReportType(type)} style={{
            padding: '8px 12px', background: reportType === type ? '#1c5148' : '#ddd', color: reportType === type ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'
          }}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {(reportType === 'monthly' || reportType === 'yearly') && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          {reportType === 'monthly' && (
            <>
              <label>Month: <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select></label>
            </>
          )}
          <label>Year: <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} min="2000" max="2100" style={{ width: '60px' }} /></label>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {loading && <p style={{ textAlign: 'center' }}>Loading...</p>}

      {data && (
        <div style={{ background: '#fbfaf6', padding: '20px', borderRadius: '6px', border: '1px solid #d9ded5' }}>
          {reportType === 'dashboard' && data.month && (
            <>
              <h3>This Month</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div><strong>Sales:</strong> ₱{data.month.sales.toLocaleString()}</div>
                <div><strong>Cash Collected:</strong> ₱{data.month.payments.toLocaleString()}</div>
                <div><strong>Expenses:</strong> ₱{data.month.expenses.toLocaleString()}</div>
                <div><strong>Labor Cost:</strong> ₱{data.month.labor.toLocaleString()}</div>
                <div><strong>Profit:</strong> ₱{data.month.profit.toLocaleString()}</div>
              </div>
              <h3>Inventory Status</h3>
              <div style={{ marginTop: '10px' }}>
                {data.inventory.map(item => (
                  <div key={item.item_name} style={{ marginBottom: '10px', padding: '10px', background: '#fff', borderRadius: '4px' }}>
                    <strong>{item.item_name}</strong>: {item.current_quantity} {item.unit}
                  </div>
                ))}
              </div>
            </>
          )}

          {reportType === 'monthly' && data.month && (
            <>
              <h3>Monthly Report: {data.month}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div><strong>Sales:</strong> ₱{data.sales.amount.toLocaleString()}</div>
                <div><strong>Brooms Sold:</strong> {data.sales.broomsSold}</div>
                <div><strong>Cash Collected:</strong> ₱{data.payments.toLocaleString()}</div>
                <div><strong>Credit Created:</strong> ₱{data.creditsCreated.toLocaleString()}</div>
                <div><strong>Brooms Produced:</strong> {data.production.brooms}</div>
                <div><strong>Expenses:</strong> ₱{data.expenses.toLocaleString()}</div>
                <div><strong>Labor Cost:</strong> ₱{data.labor.toLocaleString()}</div>
                <div><strong>Profit:</strong> ₱{data.netProfit.toLocaleString()}</div>
              </div>
            </>
          )}

          {reportType === 'yearly' && data.year && (
            <>
              <h3>Yearly Report: {data.year}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div><strong>Total Sales:</strong> ₱{data.totals.sales.toLocaleString()}</div>
                <div><strong>Total Payments:</strong> ₱{data.totals.payments.toLocaleString()}</div>
                <div><strong>Total Expenses:</strong> ₱{data.totals.expenses.toLocaleString()}</div>
                <div><strong>Total Profit:</strong> ₱{data.totals.profit.toLocaleString()}</div>
              </div>
              <h3>Monthly Breakdown</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%' }}>
                  <thead><tr><th>Month</th><th>Sales</th><th>Payments</th><th>Profit</th></tr></thead>
                  <tbody>
                    {data.months.map(m => (
                      <tr key={m.month}><td>{m.month}</td><td>₱{m.sales.amount.toLocaleString()}</td><td>₱{m.payments.toLocaleString()}</td><td>₱{m.netProfit.toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
