import { useEffect, useState } from 'react';
import { api } from '../services/api';

const today = new Date().toISOString().slice(0, 10);
const blankAdvance = { employeeId: '', advanceDate: today, amount: '', notes: '' };
const blankPayment = { advanceId: '', paymentDate: today, amount: '', notes: '' };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [advance, setAdvance] = useState(blankAdvance);
  const [payment, setPayment] = useState(blankPayment);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function loadData() {
    Promise.all([api.laborers(), api.employeeAdvances()])
      .then(([employeeResult, advanceResult]) => { setEmployees(employeeResult.data); setAdvances(advanceResult.data); })
      .catch(err => setError(err.message));
  }

  useEffect(() => { loadData(); }, []);

  async function submitAdvance(event) {
    event.preventDefault(); setMessage(''); setError('');
    try { await api.addEmployeeAdvance({ ...advance, employeeId: Number(advance.employeeId), amount: Number(advance.amount) }); setAdvance(blankAdvance); setMessage('Cash advance added.'); loadData(); }
    catch (err) { setError(err.message); }
  }

  async function submitPayment(event) {
    event.preventDefault(); setMessage(''); setError('');
    try { await api.payEmployeeAdvance(Number(payment.advanceId), { paymentDate: payment.paymentDate, amount: Number(payment.amount), notes: payment.notes }); setPayment(blankPayment); setMessage('Advance payment recorded.'); loadData(); }
    catch (err) { setError(err.message); }
  }

  const openAdvances = advances.filter(item => Number(item.balance) > 0);
  return <section className="page-section">
    <div className="section-intro"><div><p className="eyebrow">People and employee finances</p><h2>Employees</h2><p className="muted">Manage employees, cash advances, and repayments in one place.</p></div></div>
    {message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}
    <div className="split-grid">
      <form className="form-card" onSubmit={submitAdvance}><div><p className="eyebrow">Employee finance</p><h3>Add cash advance</h3></div><label>Employee<select required value={advance.employeeId} onChange={event => setAdvance({ ...advance, employeeId: event.target.value })}><option value="">Choose employee</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label><label>Advance date<input required type="date" value={advance.advanceDate} onChange={event => setAdvance({ ...advance, advanceDate: event.target.value })} /></label><label>Amount<input required type="number" min="0.01" step="0.01" value={advance.amount} onChange={event => setAdvance({ ...advance, amount: event.target.value })} /></label><label>Notes<textarea rows="3" value={advance.notes} onChange={event => setAdvance({ ...advance, notes: event.target.value })} /></label><button className="primary-button" type="submit">Add advance</button></form>
      <form className="form-card" onSubmit={submitPayment}><div><p className="eyebrow">Employee finance</p><h3>Pay advance</h3></div><label>Outstanding advance<select required value={payment.advanceId} onChange={event => setPayment({ ...payment, advanceId: event.target.value })}><option value="">Choose employee advance</option>{openAdvances.map(item => <option key={item.id} value={item.id}>{item.employee_name} · Balance ₱{Number(item.balance).toLocaleString()}</option>)}</select></label><label>Payment date<input required type="date" value={payment.paymentDate} onChange={event => setPayment({ ...payment, paymentDate: event.target.value })} /></label><label>Payment amount<input required type="number" min="0.01" step="0.01" value={payment.amount} onChange={event => setPayment({ ...payment, amount: event.target.value })} /></label><label>Notes<textarea rows="3" value={payment.notes} onChange={event => setPayment({ ...payment, notes: event.target.value })} /></label><button className="primary-button" type="submit" disabled={!openAdvances.length}>Record payment</button></form>
    </div>
    <div className="section-intro advance-list-heading"><div><p className="eyebrow">Employee records</p><h3>Cash advance balances</h3></div></div>
    <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Advance date</th><th>Advance</th><th>Paid</th><th>Remaining</th><th>Status</th></tr></thead><tbody>{advances.length ? advances.map(item => <tr key={item.id}><td><strong>{item.employee_name}</strong></td><td>{item.advance_date}</td><td>₱{Number(item.amount).toLocaleString()}</td><td>₱{Number(item.paid_amount).toLocaleString()}</td><td>₱{Number(item.balance).toLocaleString()}</td><td><span className={Number(item.balance) > 0 ? 'status low' : 'status'}>{Number(item.balance) > 0 ? 'Outstanding' : 'Paid'}</span></td></tr>) : <tr><td colSpan="6" className="empty">No employee cash advance records yet.</td></tr>}</tbody></table></div>
  </section>;
}
