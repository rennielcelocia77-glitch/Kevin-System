import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { localDate } from '../utils/date';

export default function NewExpense() {
  const [expenseType, setExpenseType] = useState('general');
  const [form, setForm] = useState({ category: 'GASOLINE', description: '', amount: '', expenseDate: localDate(), notes: '' });
  const [gasolineForm, setGasolineForm] = useState({ quantityLiters: '', pricePerLiter: '', totalAmount: '', expenseDate: localDate(), vehicleDescription: '', notes: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  async function submitGeneral(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api.expenses.create({ ...form, amount: Number(form.amount) });
      setMessage('Expense recorded.');
      setTimeout(() => navigate('/expenses'), 700);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function submitGasoline(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api.expenses.recordGasoline({
        quantityLiters: gasolineForm.quantityLiters ? Number(gasolineForm.quantityLiters) : null,
        pricePerLiter: gasolineForm.pricePerLiter ? Number(gasolineForm.pricePerLiter) : null,
        totalAmount: Number(gasolineForm.totalAmount),
        expenseDate: gasolineForm.expenseDate,
        vehicleDescription: gasolineForm.vehicleDescription,
        notes: gasolineForm.notes
      });
      setMessage('Gasoline expense recorded.');
      setTimeout(() => navigate('/expenses'), 700);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="page-section narrow">
      <div className="section-intro">
        <div><p className="eyebrow">Cost entry</p><h2>Record Expense</h2></div>
      </div>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setExpenseType('general')} style={{ flex: 1, padding: '10px', background: expenseType === 'general' ? '#da765f' : '#ddd', color: expenseType === 'general' ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>General Expense</button>
        <button onClick={() => setExpenseType('gasoline')} style={{ flex: 1, padding: '10px', background: expenseType === 'gasoline' ? '#da765f' : '#ddd', color: expenseType === 'gasoline' ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Gasoline</button>
      </div>

      {expenseType === 'general' ? (
        <form className="form-card" onSubmit={submitGeneral}>
          <label>Category
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option>GASOLINE</option><option>LABOR</option><option>SUPPLIES</option><option>MAINTENANCE</option><option>OTHER</option>
            </select>
          </label>
          <label>Description<input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <label>Amount (₱)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label>
          <label>Date<input required type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} /></label>
          <label>Notes<textarea rows="4" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
          {message && <p className={message.includes('recorded') ? 'form-success' : 'form-error'}>{message}</p>}
          <button className="primary-button" type="submit">Record Expense</button>
        </form>
      ) : (
        <form className="form-card" onSubmit={submitGasoline}>
          <label>Quantity (Liters)<input type="number" min="0" step="0.01" value={gasolineForm.quantityLiters} onChange={e => setGasolineForm({ ...gasolineForm, quantityLiters: e.target.value })} placeholder="Optional" /></label>
          <label>Price per Liter (₱)<input type="number" min="0" step="0.01" value={gasolineForm.pricePerLiter} onChange={e => setGasolineForm({ ...gasolineForm, pricePerLiter: e.target.value })} placeholder="Optional" /></label>
          <label>Total Amount (₱)<input required type="number" min="0.01" step="0.01" value={gasolineForm.totalAmount} onChange={e => setGasolineForm({ ...gasolineForm, totalAmount: e.target.value })} /></label>
          <label>Date<input required type="date" value={gasolineForm.expenseDate} onChange={e => setGasolineForm({ ...gasolineForm, expenseDate: e.target.value })} /></label>
          <label>Vehicle<input type="text" value={gasolineForm.vehicleDescription} onChange={e => setGasolineForm({ ...gasolineForm, vehicleDescription: e.target.value })} placeholder="e.g., Delivery Truck" /></label>
          <label>Notes<textarea rows="4" value={gasolineForm.notes} onChange={e => setGasolineForm({ ...gasolineForm, notes: e.target.value })} /></label>
          {message && <p className={message.includes('recorded') ? 'form-success' : 'form-error'}>{message}</p>}
          <button className="primary-button" type="submit">Record Gasoline</button>
        </form>
      )}
    </section>
  );
}
