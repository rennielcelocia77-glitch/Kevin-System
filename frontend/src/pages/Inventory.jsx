import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Inventory() {
  const [items, setItems] = useState([]); const [error, setError] = useState('');
  useEffect(() => { api.inventory().then(result => setItems(result.data)).catch(err => setError(err.message)); }, []);
  return <section className="page-section"><div className="section-intro"><div><p className="eyebrow">Materials ledger</p><h2>Inventory position</h2></div><Link className="primary-button compact" to="/inventory/opening-stock">+ Opening stock</Link></div>{error && <p className="form-error">{error}</p>}<div className="table-wrap"><table><thead><tr><th>Item</th><th>Type</th><th>On hand</th><th>Unit</th><th>Reorder level</th><th>Status</th></tr></thead><tbody>{items.length ? items.map(item => <tr key={item.id}><td><Link className="item-table-link" to={`/inventory/item/${item.id}`}><strong>{item.item_name}</strong></Link></td><td>{item.item_type.replace('_', ' ')}</td><td>{item.current_quantity}</td><td>{item.unit}</td><td>{item.reorder_level}</td><td><span className={item.current_quantity <= item.reorder_level ? 'status low' : 'status'}>{item.current_quantity <= item.reorder_level ? 'Low stock' : 'Healthy'}</span></td></tr>) : <tr><td colSpan="6" className="empty">No inventory loaded. Connect the API and apply the seed data.</td></tr>}</tbody></table></div></section>;
}
