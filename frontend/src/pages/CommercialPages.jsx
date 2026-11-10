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
    {rows.length ? rows.map((row, index) => <tr key={row.id ?? index}>{columns.map(column => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '-'}</td>)}</tr>) : <tr><td className="empty" colSpan={columns.length}>{empty}</td></tr>}
  </tbody></table></div>;
}

function ItemSelect({ label, value, items, onChange, required = true }) {
  return <label>{label}<select required={required} value={value} onChange={onChange}>
    <option value="">Choose an item</option>
    {items.map(item => <option key={item.id} value={item.id}>{item.item_name} — {item.current_quantity} {item.unit} available</option>)}
  </select></label>;
}

export function CustomerPage() {
  const { user } = useAuth();
  const { data, error, refresh } = useLoad(api.customers);
  const [form, setForm] = useState({ name: '', contact: '', address: '' });
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault(); setMessage('');
    try {
      await api.createCustomer(form);
      setForm({ name: '', contact: '', address: '' });
      setMessage('Customer created.');
      await refresh();
    } catch (err) { setMessage(err.message); }
  }
  return <section className="page-section"><div className="section-intro"><div><p className="eyebrow">Accounts receivable</p><h2>Customers</h2></div></div><div className="split-grid">
    {user?.role === 'OWNER' ? <form className="form-card" onSubmit={submit}><div><p className="eyebrow">Customer profile</p><h3>Add customer</h3></div><label>Name<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label><label>Contact<input value={form.contact} onChange={event => setForm({ ...form, contact: event.target.value })} /></label><label>Address<input value={form.address} onChange={event => setForm({ ...form, address: event.target.value })} /></label><Message text={message} success={message.endsWith('.')} /><button className="primary-button">Save customer</button></form> : <p className="muted">Customer records can be added by an owner.</p>}
    <div><h3>Customer directory</h3><Message text={error} /><Table columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'contact', label: 'Contact' }, { key: 'status', label: 'Status' }]} rows={data} /></div>
  </div></section>;
}

export function ProductionPage() {
  const { user } = useAuth();
  const batches = useLoad(api.production);
  const inventoryResource = useLoad(api.inventory);
  const inventory = inventoryResource.data;
  const [form, setForm] = useState({ productionDate: localDate(), washedPinanitanItemId: '', washedPinanitanQuantity: '', bambooHandleItemId: '', bambooHandleQuantity: '', polyCordItemId: '', polyCordQuantity: '', finishedBroomItemId: '', broomsProduced: '', notes: '' });
  const [message, setMessage] = useState('');
  const materials = {
    washed: inventory.filter(item => item.item_name === 'Washed Pinanitan' && item.item_type === 'PROCESSED_MATERIAL' && item.unit === 'BANGAN'),
    handles: inventory.filter(item => item.item_name === 'Bamboo Handle' && item.item_type === 'RAW_MATERIAL' && item.unit === 'PIECE'),
    cord: inventory.filter(item => item.item_name === 'Poly Cord' && item.item_type === 'RAW_MATERIAL'),
    brooms: inventory.filter(item => item.item_name === 'Finished Broom' && item.item_type === 'FINISHED_PRODUCT' && item.unit === 'PIECE')
  };
  async function submit(event) {
    event.preventDefault(); setMessage('');
    try {
      const payload = { ...form };
      for (const key of ['washedPinanitanItemId', 'bambooHandleItemId', 'polyCordItemId', 'finishedBroomItemId', 'washedPinanitanQuantity', 'bambooHandleQuantity', 'polyCordQuantity', 'broomsProduced']) payload[key] = Number(payload[key]);
      await api.createProduction(payload);
      setMessage('Production batch created.');
      setForm(current => ({ ...current, washedPinanitanQuantity: '', bambooHandleQuantity: '', polyCordQuantity: '', broomsProduced: '', notes: '' }));
      await Promise.all([batches.refresh(), inventoryResource.refresh()]);
    } catch (err) { setMessage(err.message); }
  }
  return <section className="page-section"><div className="section-intro"><div><p className="eyebrow">Assembly floor</p><h2>Production</h2></div></div><Message text={batches.error} />
    <div className="split-grid">{user?.role === 'OWNER' ? <form className="form-card" onSubmit={submit}><div><p className="eyebrow">Material consumption</p><h3>Record production</h3><p className="muted">Select materials from inventory and enter the quantities used.</p></div>
      <label>Date<input type="date" required value={form.productionDate} onChange={event => setForm({ ...form, productionDate: event.target.value })} /></label>
      <ItemSelect label="Washed Pinanitan" value={form.washedPinanitanItemId} items={materials.washed} onChange={event => setForm({ ...form, washedPinanitanItemId: event.target.value })} />
      <label>Washed Pinanitan used (BANGAN)<input required type="number" min="0.001" step="0.001" value={form.washedPinanitanQuantity} onChange={event => setForm({ ...form, washedPinanitanQuantity: event.target.value })} /></label>
      <ItemSelect label="Bamboo Handle" value={form.bambooHandleItemId} items={materials.handles} onChange={event => setForm({ ...form, bambooHandleItemId: event.target.value })} />
      <label>Bamboo Handles used (PIECE)<input required type="number" min="0.001" step="0.001" value={form.bambooHandleQuantity} onChange={event => setForm({ ...form, bambooHandleQuantity: event.target.value })} /></label>
      <ItemSelect label="Poly Cord" value={form.polyCordItemId} items={materials.cord} onChange={event => setForm({ ...form, polyCordItemId: event.target.value })} />
      <label>Poly Cord used<input required type="number" min="0.001" step="0.001" value={form.polyCordQuantity} onChange={event => setForm({ ...form, polyCordQuantity: event.target.value })} /></label>
      <ItemSelect label="Finished Broom output" value={form.finishedBroomItemId} items={materials.brooms} onChange={event => setForm({ ...form, finishedBroomItemId: event.target.value })} />
      <label>Brooms produced<input required type="number" min="0.001" step="0.001" value={form.broomsProduced} onChange={event => setForm({ ...form, broomsProduced: event.target.value })} /></label>
      <label>Notes<textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /></label><Message text={message} success={message.endsWith('.')} /><button className="primary-button">Save production</button>
    </form> : <p className="muted">Production batches can be recorded by an owner.</p>}
    <div><h3>Recent batches</h3><Table columns={[{ key: 'id', label: 'Batch' }, { key: 'production_date', label: 'Date' }, { key: 'output_item_name', label: 'Output' }, { key: 'output_quantity', label: 'Brooms' }, { key: 'total_cost', label: 'Cost' }]} rows={batches.data} /></div></div>
  </section>;
}

export function SalesPage() {
  const { user } = useAuth();
  const sales = useLoad(api.sales);
  const { data: customers } = useLoad(api.customers);
  const { data: inventory } = useLoad(api.inventory);
  const finishedProducts = inventory.filter(item => item.item_type === 'FINISHED_PRODUCT' && item.unit === 'PIECE');
  const [form, setForm] = useState({ customerId: '', saleDate: localDate(), inventoryItemId: '', quantity: '', unitPrice: '', amountPaid: '' });
  const [paymentForm, setPaymentForm] = useState({ saleId: '', paymentDate: localDate(), amount: '', referenceNumber: '', notes: '' });
  const [message, setMessage] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  async function submit(event) {
    event.preventDefault(); setMessage('');
    try {
      await api.createSale({ customerId: Number(form.customerId), saleDate: form.saleDate, items: [{ inventoryItemId: Number(form.inventoryItemId), quantity: Number(form.quantity), unitPrice: Number(form.unitPrice) }], amountPaid: Number(form.amountPaid || 0) });
      setMessage('Sale created.');
      setForm(current => ({ ...current, inventoryItemId: '', quantity: '', unitPrice: '', amountPaid: '' }));
      await sales.refresh();
    } catch (err) { setMessage(err.message); }
  }
  async function submitPayment(event) {
    event.preventDefault(); setPaymentMessage('');
    try {
      await api.createPayment({ ...paymentForm, saleId: Number(paymentForm.saleId), amount: Number(paymentForm.amount) });
      setPaymentMessage('Payment recorded.');
      setPaymentForm(current => ({ ...current, saleId: '', amount: '', referenceNumber: '', notes: '' }));
      await sales.refresh();
    } catch (err) { setPaymentMessage(err.message); }
  }
  const unpaidSales = sales.data.filter(sale => sale.status === 'COMPLETED' && Number(sale.balance) > 0);
  return <section className="page-section"><div className="section-intro"><div><p className="eyebrow">Outbound sales</p><h2>Sales and debt</h2></div></div><Message text={sales.error} />
    <div className="split-grid"><div style={{ display: 'grid', gap: '20px' }}>{user?.role === 'OWNER' ? <><form className="form-card" onSubmit={submit}><div><p className="eyebrow">Completed sale</p><h3>Record broom sale</h3><p className="muted">Inventory decreases even when a balance remains.</p></div>
      <label>Customer<select required value={form.customerId} onChange={event => setForm({ ...form, customerId: event.target.value })}><option value="">Choose customer</option>{customers.filter(customer => customer.status === 'ACTIVE').map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
      <label>Sale date<input type="date" required value={form.saleDate} onChange={event => setForm({ ...form, saleDate: event.target.value })} /></label>
      <ItemSelect label="Finished product" value={form.inventoryItemId} items={finishedProducts} onChange={event => setForm({ ...form, inventoryItemId: event.target.value })} />
      <label>Quantity<input required type="number" min="0.001" step="0.001" value={form.quantity} onChange={event => setForm({ ...form, quantity: event.target.value })} /></label>
      <label>Unit price<input required type="number" min="0" step="0.01" value={form.unitPrice} onChange={event => setForm({ ...form, unitPrice: event.target.value })} /></label>
      <label>Amount paid<input type="number" min="0" step="0.01" value={form.amountPaid} onChange={event => setForm({ ...form, amountPaid: event.target.value })} /></label>
      <Message text={message} success={message.endsWith('.')} /><button className="primary-button">Save sale</button>
    </form><form className="form-card" onSubmit={submitPayment}><div><p className="eyebrow">Accounts receivable</p><h3>Record a payment</h3><p className="muted">Apply a receipt to an outstanding sale.</p></div>
      <label>Outstanding sale<select required value={paymentForm.saleId} onChange={event => setPaymentForm({ ...paymentForm, saleId: event.target.value })}><option value="">Choose sale</option>{unpaidSales.map(sale => <option key={sale.id} value={sale.id}>#{sale.id} — {sale.customer_name} — Balance ₱{Number(sale.balance).toLocaleString()}</option>)}</select></label>
      <label>Payment date<input type="date" required value={paymentForm.paymentDate} onChange={event => setPaymentForm({ ...paymentForm, paymentDate: event.target.value })} /></label>
      <label>Amount<input required type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={event => setPaymentForm({ ...paymentForm, amount: event.target.value })} /></label>
      <label>Reference number<input value={paymentForm.referenceNumber} onChange={event => setPaymentForm({ ...paymentForm, referenceNumber: event.target.value })} /></label>
      <label>Notes<textarea value={paymentForm.notes} onChange={event => setPaymentForm({ ...paymentForm, notes: event.target.value })} /></label>
      <Message text={paymentMessage} success={paymentMessage.endsWith('.')} /><button className="primary-button" disabled={!unpaidSales.length}>Record payment</button>
    </form></> : <p className="muted">Sales and customer payments can be recorded by an owner.</p>}</div>
    <div><h3>Recent sales</h3><Table columns={[{ key: 'id', label: 'Sale' }, { key: 'sale_date', label: 'Date' }, { key: 'customer_name', label: 'Customer' }, { key: 'total_amount', label: 'Total' }, { key: 'balance', label: 'Balance' }, { key: 'payment_status', label: 'Status' }]} rows={sales.data} /></div></div>
  </section>;
}
