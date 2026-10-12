import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.expenses.list({ category })
      .then(result => setExpenses(result.data))
      .catch(err => setError(err.message));
  }, [category]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <section className="page-section">
      <div className="section-intro">
        <div><p className="eyebrow">Cost tracking</p><h2>Expenses</h2><p className="muted">Total: ₱{totalExpenses.toLocaleString()}</p></div>
        <button className="primary-button compact" onClick={() => navigate('/expenses/new')}>+ Record Expense</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      
      <div style={{ marginBottom: '20px' }}>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="">All Categories</option>
          <option value="GASOLINE">Gasoline</option>
          <option value="LABOR">Labor</option>
          <option value="SUPPLIES">Supplies</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {expenses.length ? expenses.map(e => (
              <tr key={e.id}><td>{e.expense_date}</td><td><strong>{e.category}</strong></td><td className="muted">{e.description}</td><td>₱{e.amount.toLocaleString()}</td></tr>
            )) : <tr><td colSpan="4" className="empty">No expenses recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
