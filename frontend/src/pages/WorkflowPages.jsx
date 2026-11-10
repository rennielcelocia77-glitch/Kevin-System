import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { localDate } from '../utils/date';

function useLoad(loader) {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  async function refresh() {
    setError('');
    try { setData((await loader()).data); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { refresh(); }, [loader]);
  return { data, error, refresh };
}

function Message({ text, success = false }) {
  return text ? <p className={success ? 'form-success' : 'form-error'}>{text}</p> : null;
}

function Table({ columns, rows, empty = 'No records yet.' }) {
  return <div className="table-wrap"><table><thead><tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>
    {rows.length ? rows.map((row, index) => <tr key={row.id ?? index}>{columns.map(column => <td key={column.key}>{row[column.key] ?? '-'}</td>)}</tr>) : <tr><td className="empty" colSpan={columns.length}>{empty}</td></tr>}
  </tbody></table></div>;
}

function ItemSelect({ label, value, items, onChange }) {
  return <label>{label}<select required value={value} onChange={onChange}><option value="">Choose an item</option>
    {items.map(item => <option key={item.id} value={item.id}>{item.item_name} — {item.current_quantity} {item.unit} available</option>)}
  </select></label>;
}

export function WashingPage() {
  const { user } = useAuth();
  const batches = useLoad(api.washing);
  const { data: workers } = useLoad(api.laborers);
  const [form, setForm] = useState({ date: localDate(), rawPinanitanBangan: '', washedPinanitanBangan: '', laborerName: '', laborCost: '', notes: '' });
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault(); setMessage('');
    try {
      await api.createWashing({ date: form.date, rawPinanitanBangan: Number(form.rawPinanitanBangan), washedPinanitanBangan: Number(form.washedPinanitanBangan), laborerName: form.laborerName.trim() || undefined, laborCost: Number(form.laborCost || 0), notes: form.notes });
      setMessage('Washing batch created.');
      setForm(current => ({ ...current, rawPinanitanBangan: '', washedPinanitanBangan: '', laborCost: '', notes: '' }));
      await batches.refresh();
    } catch (err) { setMessage(err.message); }
  }
  return <section className="page-section"><div className="section-intro"><div><p className="eyebrow">Processing</p><h2>Washing batches</h2></div></div><Message text={batches.error} /><div className="split-grid">
    {user?.role === 'OWNER' ? <form className="form-card" onSubmit={submit}><div><p className="eyebrow">Transaction entry</p><h3>Record washing</h3><p className="muted">Record raw input and washed output separately, both in BANGAN.</p></div>
      <label>Date<input type="date" required value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label>
      <label>Raw Pinanitan used (BANGAN)<input type="number" step="0.001" min="0.001" required value={form.rawPinanitanBangan} onChange={event => setForm({ ...form, rawPinanitanBangan: event.target.value })} /></label>
      <label>Washed Pinanitan produced (BANGAN)<input type="number" step="0.001" min="0.001" required value={form.washedPinanitanBangan} onChange={event => setForm({ ...form, washedPinanitanBangan: event.target.value })} /></label>
      <label>Laborer<input list="washing-laborers" placeholder="Type or choose a laborer" value={form.laborerName} onChange={event => setForm({ ...form, laborerName: event.target.value })} /><datalist id="washing-laborers">{workers.map(worker => <option key={worker.id} value={worker.name} />)}</datalist><small>New names are added when the batch is recorded.</small></label>
      <label>Labor payment<input type="number" min="0" step="0.01" value={form.laborCost} onChange={event => setForm({ ...form, laborCost: event.target.value })} /></label>
      <label>Notes<textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></label><Message text={message} success={message.endsWith('.')} /><button className="primary-button">Save transaction</button>
    </form> : <p className="muted">Washing batches can be recorded by an owner.</p>}
    <div><h3>Recent batches</h3><Table columns={[{ key: 'id', label: 'Batch' }, { key: 'washing_date', label: 'Date' }, { key: 'raw_quantity', label: 'Raw Bangan' }, { key: 'washed_quantity', label: 'Washed Bangan' }, { key: 'laborer_name', label: 'Laborer' }]} rows={batches.data} /></div>
  </div></section>;
}

export function LaborPage() {
  const { user } = useAuth();
  const records = useLoad(api.labor);
  const { data: workers } = useLoad(api.laborers);
  const [form, setForm] = useState({ laborerId: '', workDate: localDate(), workType: 'Broom Stitching', quantity: '', unit: 'PIECE', amount: '', notes: '' });
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault(); setMessage('');
    try {
      await api.createLabor({ ...form, laborerId: Number(form.laborerId), quantity: form.quantity ? Number(form.quantity) : undefined, amount: Number(form.amount) });
      setMessage('Labor record created.');
      setForm(current => ({ ...current, quantity: '', amount: '', notes: '' }));
      await records.refresh();
    } catch (err) { setMessage(err.message); }
  }
  return <section className="page-section"><div className="section-intro"><div><p className="eyebrow">People and cost</p><h2>Labor records</h2></div></div><Message text={records.error} /><div className="split-grid">
    {user?.role === 'OWNER' ? <form className="form-card" onSubmit={submit}><div><p className="eyebrow">Transaction entry</p><h3>Add work record</h3><p className="muted">Record the work performed and the amount paid.</p></div>
      <label>Laborer<select required value={form.laborerId} onChange={event => setForm({ ...form, laborerId: event.target.value })}><option value="">Choose laborer</option>{workers.filter(worker => worker.status === 'ACTIVE').map(worker => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select></label>
      <label>Date<input type="date" required value={form.workDate} onChange={event => setForm({ ...form, workDate: event.target.value })} /></label><label>Work type<input required value={form.workType} onChange={event => setForm({ ...form, workType: event.target.value })} /></label>
      <label>Quantity<input type="number" min="0" step="0.001" value={form.quantity} onChange={event => setForm({ ...form, quantity: event.target.value })} /></label><label>Unit<input value={form.unit} onChange={event => setForm({ ...form, unit: event.target.value })} /></label>
      <label>Amount paid<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} /></label><label>Notes<textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></label><Message text={message} success={message.endsWith('.')} /><button className="primary-button">Save transaction</button>
    </form> : <p className="muted">Labor records can be added by an owner.</p>}
    <div><h3>Recent labor</h3><Table columns={[{ key: 'work_date', label: 'Date' }, { key: 'laborer_name', label: 'Laborer' }, { key: 'work_type', label: 'Work' }, { key: 'total_amount', label: 'Amount' }, { key: 'payment_status', label: 'Status' }]} rows={records.data} /></div>
  </div></section>;
}

export function PurchasePage() {
  const { user } = useAuth();
  const purchases = useLoad(api.purchases);
  const { data: suppliers } = useLoad(api.suppliers);
  const { data: inventory } = useLoad(api.inventory);
  const purchasableItems = inventory.filter(item => item.item_type !== 'FINISHED_PRODUCT');
  const [form, setForm] = useState({ supplierId: '', purchaseDate: localDate(), itemId: '', quantity: '', unitCost: '', notes: '' });
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault(); setMessage('');
    try {
      await api.createPurchase({ ...form, supplierId: form.supplierId ? Number(form.supplierId) : undefined, itemId: Number(form.itemId), quantity: Number(form.quantity), unitCost: Number(form.unitCost) });
      setMessage('Purchase created.');
      setForm(current => ({ ...current, itemId: '', quantity: '', unitCost: '', notes: '' }));
      await purchases.refresh();
    } catch (err) { setMessage(err.message); }
  }
  return <section className="page-section"><div className="section-intro"><div><p className="eyebrow">Materials in</p><h2>Purchases</h2></div></div><Message text={purchases.error} />
    {user?.role === 'OWNER' ? <form className="form-card" onSubmit={submit}><div><p className="eyebrow">Transaction entry</p><h3>Record material purchase</h3><p className="muted">Choose a supplier and an inventory item. Stock updates when saved.</p></div>
      <label>Supplier<select value={form.supplierId} onChange={event => setForm({ ...form, supplierId: event.target.value })}><option value="">Supplier not recorded</option>{suppliers.filter(supplier => supplier.status === 'ACTIVE').map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.supplier_name}</option>)}</select></label>
      <label>Purchase date<input type="date" required value={form.purchaseDate} onChange={event => setForm({ ...form, purchaseDate: event.target.value })} /></label><ItemSelect label="Inventory item" value={form.itemId} items={purchasableItems} onChange={event => setForm({ ...form, itemId: event.target.value })} />
      <label>Quantity<input type="number" min="0.001" step="0.001" required value={form.quantity} onChange={event => setForm({ ...form, quantity: event.target.value })} /></label><label>Unit cost<input type="number" min="0" step="0.01" required value={form.unitCost} onChange={event => setForm({ ...form, unitCost: event.target.value })} /></label>
      <label>Notes<textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></label><Message text={message} success={message.endsWith('.')} /><button className="primary-button">Save transaction</button>
    </form> : <p className="muted">Purchases can be recorded by an owner.</p>}
    <h3>Recent purchases</h3><Table columns={[{ key: 'id', label: 'Purchase' }, { key: 'purchase_date', label: 'Date' }, { key: 'supplier_name', label: 'Supplier' }, { key: 'total_cost', label: 'Total' }]} rows={purchases.data} />
  </section>;
}
