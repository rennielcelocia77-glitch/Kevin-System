import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OpeningStock() {
  const { user } = useAuth();
  const [form, setForm] = useState({ itemId: '', quantity: '', notes: '' }); const [items, setItems] = useState([]); const [message, setMessage] = useState(''); const navigate = useNavigate();
  useEffect(() => { api.inventory().then(result => setItems(result.data)).catch(err => setMessage(err.message)); }, []);
  async function submit(event) { event.preventDefault(); setMessage(''); try { await api.openingStock({ itemId: Number(form.itemId), quantity: Number(form.quantity), notes: form.notes }); setMessage('Opening stock recorded.'); setTimeout(() => navigate('/inventory'), 700); } catch (err) { setMessage(err.message); } }
  return <section className="page-section narrow"><div className="section-intro"><div><p className="eyebrow">Inventory setup</p><h2>Record opening stock</h2><p className="muted">Create the starting balance without inventing a purchase history.</p></div></div>{user?.role === 'OWNER' ? <form className="form-card" onSubmit={submit}><label>Inventory item<select required value={form.itemId} onChange={e => setForm({ ...form, itemId: e.target.value })}><option value="">Select an inventory item</option>{items.map(item => <option key={item.id} value={item.id}>{item.item_name} ({item.unit})</option>)}</select><small>Choose the material or finished product already on hand.</small></label><label>Quantity<input required type="number" min="0.001" step="0.001" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></label><label>Notes<textarea rows="4" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Existing stock before system implementation" /></label>{message && <p className={message.includes('recorded') ? 'form-success' : 'form-error'}>{message}</p>}<button className="primary-button" type="submit" disabled={!items.length}>Save opening stock</button></form> : <p className="muted">Opening stock can be entered by an owner.</p>}</section>;
}
