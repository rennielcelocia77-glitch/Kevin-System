import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { localDate } from '../utils/date';

export default function NewDelivery() {
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ saleId: '', deliveryDate: localDate(), deliveryAddress: '', driverName: '', notes: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.sales().then(result => setSales(result.data.filter(sale => sale.status === 'COMPLETED'))).catch(err => setError(err.message));
  }, []);

  async function submit(event) {
    event.preventDefault(); setMessage('');
    try {
      await api.deliveries.create({ ...form, saleId: Number(form.saleId) });
      setMessage('Delivery created.');
      setTimeout(() => navigate('/deliveries'), 700);
    } catch (err) { setMessage(err.message); }
  }

  return <section className="page-section narrow"><div className="section-intro"><div><p className="eyebrow">New shipment</p><h2>Record Delivery</h2></div></div>
    {error && <p className="form-error">{error}</p>}
    <form className="form-card" onSubmit={submit}>
      <label>Sale<select required value={form.saleId} onChange={event => setForm({ ...form, saleId: event.target.value })}><option value="">Choose completed sale</option>{sales.map(sale => <option key={sale.id} value={sale.id}>#{sale.id} — {sale.customer_name || 'Customer'} — {sale.sale_date} — ₱{Number(sale.total_amount).toLocaleString()}</option>)}</select></label>
      <small>The delivery inherits the customer from the sale.</small>
      <label>Delivery date<input required type="date" value={form.deliveryDate} onChange={event => setForm({ ...form, deliveryDate: event.target.value })} /></label>
      <label>Address<input type="text" value={form.deliveryAddress} onChange={event => setForm({ ...form, deliveryAddress: event.target.value })} placeholder="Delivery address" /></label>
      <label>Driver<input type="text" value={form.driverName} onChange={event => setForm({ ...form, driverName: event.target.value })} placeholder="Driver name" /></label>
      <label>Notes<textarea rows="4" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></label>
      {message && <p className={message.endsWith('.') ? 'form-success' : 'form-error'}>{message}</p>}
      <button className="primary-button" type="submit" disabled={!sales.length}>Create Delivery</button>
    </form>
  </section>;
}
