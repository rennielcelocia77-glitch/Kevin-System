import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const metrics = [['Raw Pinanitan', 'BANGAN', 'Materials'], ['Washed Pinanitan', 'BANGAN', 'Processed'], ['Bamboo Handle', 'PIECE', 'Production input'], ['Finished Broom', 'PIECE', 'Ready for sale'], ['Poly Cord', 'ROLL', 'Configurable unit']];

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.inventory().then(result => setItems(result.data)).catch(err => setError(err.message));
  }, []);

  return <section className="page-section"><div className="section-intro"><div><p className="eyebrow">Today at a glance</p><h2>Production floor overview</h2></div><span className="date-chip">Live inventory</span></div>{error && <p className="form-error">{error}</p>}<div className="metric-grid">{metrics.map(([name, unit, label], index) => { const item = items.find(entry => entry.item_name === name); return <Link className="metric" to={item ? `/inventory/item/${item.id}` : '/inventory'} key={name}><span className={`metric-index index-${index}`}>0{index + 1}</span><p>{label}</p><h3>{item ? item.current_quantity : '--'}</h3><strong>{name}</strong><small>{item?.unit || unit}</small></Link>; })}</div>{user?.role === 'OWNER' && <div className="notice-band"><div><p className="eyebrow">Next step</p><h3>Set your opening balances</h3><p>Record what is already on hand so the ledger starts with a real, auditable position.</p></div><Link to="/inventory/opening-stock" className="text-link">Open stock entry &rarr;</Link></div>}</section>;
}
