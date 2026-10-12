import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';

function formatAction(action) { return action.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()); }

export default function InventoryItem() {
  const { id } = useParams();
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.inventoryItem(id).then(result => setDetails(result.data)).catch(err => setError(err.message)); }, [id]);
  if (error) return <section className="page-section"><p className="form-error">Unable to load item. {error}</p><Link className="text-link" to="/dashboard">&larr; Back to Dashboard</Link></section>;
  if (!details) return <section className="page-section"><p className="empty-state">Loading item details...</p></section>;
  const { item, transactions, purchases } = details;
  return <section className="page-section">
    <Link className="text-link" to="/dashboard">&larr; Back to Dashboard</Link>
    <div className="item-detail-header"><div><p className="eyebrow">Inventory item</p><h2>{item.item_name}</h2><p className="muted">{item.item_type.replaceAll('_', ' ')} · measured in {item.unit}</p></div><div className="item-balance"><small>Current balance</small><strong>{item.current_quantity}</strong><span>{item.unit}</span></div></div>
    <div className="detail-grid"><article className="detail-stat"><span>Reorder level</span><strong>{item.reorder_level} {item.unit}</strong></article><article className="detail-stat"><span>Cost per unit</span><strong>₱{Number(item.cost_per_unit).toLocaleString()}</strong></article><article className="detail-stat"><span>Last updated</span><strong>{new Date(item.updated_at).toLocaleDateString()}</strong></article></div>
    <div className="detail-section"><div className="section-intro"><div><p className="eyebrow">Supply trail</p><h3>Purchase batches and suppliers</h3></div></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Supplier</th><th>Reference</th><th>Quantity</th><th>Unit cost</th><th>Total</th></tr></thead><tbody>{purchases.length ? purchases.map(purchase => <tr key={purchase.id}><td>{purchase.purchase_date}</td><td><strong>{purchase.supplier_name || 'Supplier not recorded'}</strong></td><td>{purchase.reference_number || '-'}</td><td>{purchase.quantity} {purchase.unit}</td><td>₱{Number(purchase.unit_cost).toLocaleString()}</td><td>₱{Number(purchase.total_cost).toLocaleString()}</td></tr>) : <tr><td colSpan="6" className="empty">No purchase batches recorded for this item.</td></tr>}</tbody></table></div></div>
    <div className="detail-section"><div className="section-intro"><div><p className="eyebrow">Stock trail</p><h3>All item movements</h3></div></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Action</th><th>Quantity</th><th>Reason</th><th>Reference</th><th>Notes</th></tr></thead><tbody>{transactions.length ? transactions.map(transaction => <tr key={transaction.id}><td>{new Date(transaction.created_at).toLocaleString()}</td><td><strong>{formatAction(transaction.transaction_type)}</strong></td><td>{transaction.quantity} {transaction.unit}</td><td>{transaction.reason || '-'}</td><td>{transaction.reference_type ? `${transaction.reference_type} #${transaction.reference_id || ''}` : '-'}</td><td className="muted">{transaction.notes || '-'}</td></tr>) : <tr><td colSpan="6" className="empty">No stock movements recorded for this item.</td></tr>}</tbody></table></div></div>
  </section>;
}
