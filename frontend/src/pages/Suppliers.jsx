import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const categories = ['Pinanitan', 'Bamboo Handle', 'Poly Cord', 'Washed Pinanitan', 'Finished Broom', 'Other'];
const blankForm = { supplierName: '', contactPerson: '', phone: '', address: '', itemCategories: [], notes: '' };

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function loadSuppliers() { api.suppliers().then(result => setSuppliers(result.data)).catch(err => setError(err.message)); }
  useEffect(() => { loadSuppliers(); }, []);

  function toggleCategory(category) {
    setForm(current => ({ ...current, itemCategories: current.itemCategories.includes(category) ? current.itemCategories.filter(item => item !== category) : [...current.itemCategories, category] }));
  }

  async function submit(event) {
    event.preventDefault(); setMessage(''); setError('');
    try { await api.createSupplier(form); setForm(blankForm); setMessage('Supplier created.'); loadSuppliers(); } catch (err) { setError(err.message); }
  }

  return <section className="page-section"><div className="section-intro"><div><p className="eyebrow">Supply network</p><h2>Suppliers</h2><p className="muted">Track who provides each material and product category.</p></div></div>{message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}<div className="split-grid">{user?.role === 'OWNER' ? <form className="form-card" onSubmit={submit}><div><p className="eyebrow">Supplier profile</p><h3>Add supplier</h3></div><label>Supplier name<input required value={form.supplierName} onChange={event => setForm({ ...form, supplierName: event.target.value })} /></label><label>Contact person<input value={form.contactPerson} onChange={event => setForm({ ...form, contactPerson: event.target.value })} /></label><label>Phone<input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></label><label>Address<input value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} /></label><fieldset className="category-field"><legend>Items supplied</legend><div className="category-options">{categories.map(category => <label className="category-option" key={category}><input type="checkbox" checked={form.itemCategories.includes(category)} onChange={() => toggleCategory(category)} />{category}</label>)}</div></fieldset><label>Notes<textarea rows="3" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></label><button className="primary-button" type="submit">Save supplier</button></form> : <p className="muted">Supplier records can be added by an owner.</p>}<div><h3>Supplier directory</h3><div className="table-wrap"><table><thead><tr><th>Supplier</th><th>Items supplied</th><th>Contact</th><th>Status</th></tr></thead><tbody>{suppliers.length ? suppliers.map(supplier => <tr key={supplier.id}><td><strong>{supplier.supplier_name}</strong></td><td>{supplier.item_categories || 'No categories added'}</td><td>{supplier.phone || supplier.contact_person || '-'}</td><td><span className="status">{supplier.status}</span></td></tr>) : <tr><td colSpan="4" className="empty">No suppliers recorded yet.</td></tr>}</tbody></table></div></div></div></section>;
}
