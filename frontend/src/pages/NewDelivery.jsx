import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function NewDelivery() {
  const [form, setForm] = useState({ saleId: '', customerId: '', deliveryDate: new Date().toISOString().split('T')[0], deliveryAddress: '', driverName: '', notes: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api.deliveries.create({ ...form, saleId: Number(form.saleId), customerId: form.customerId ? Number(form.customerId) : null });
      setMessage('Delivery created.');
      setTimeout(() => navigate('/deliveries'), 700);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="page-section narrow">
      <div className="section-intro">
        <div><p className="eyebrow">New shipment</p><h2>Record Delivery</h2></div>
      </div>
      <form className="form-card" onSubmit={submit}>
        <label>Sale ID<input required type="number" value={form.saleId} onChange={e => setForm({ ...form, saleId: e.target.value })} /></label>
        <label>Delivery Date<input required type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} /></label>
        <label>Address<input type="text" value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="Delivery address" /></label>
        <label>Driver<input type="text" value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} placeholder="Driver name" /></label>
        <label>Notes<textarea rows="4" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
        {message && <p className={message.includes('created') ? 'form-success' : 'form-error'}>{message}</p>}
        <button className="primary-button" type="submit">Create Delivery</button>
      </form>
    </section>
  );
}
