import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.deliveries.list()
      .then(result => setDeliveries(result.data))
      .catch(err => setError(err.message));
  }, []);

  async function updateStatus(deliveryId, status) {
    try {
      await api.deliveries.updateStatus(deliveryId, status);
      setDeliveries(deliveries.map(d => d.id === deliveryId ? { ...d, status } : d));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-section">
      <div className="section-intro">
        <div><p className="eyebrow">Logistics</p><h2>Deliveries</h2></div>
        <button className="primary-button compact" onClick={() => navigate('/deliveries/new')}>+ New Delivery</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Customer</th><th>Date</th><th>Address</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length ? deliveries.map(d => (
              <tr key={d.id}>
                <td>#{d.id}</td>
                <td>{d.customer_name || 'N/A'}</td>
                <td>{d.delivery_date}</td>
                <td className="muted">{d.delivery_address || '—'}</td>
                <td><span className={`status ${d.status.toLowerCase().replace(/_/g, '-')}`}>{d.status.replace(/_/g, ' ')}</span></td>
                <td>
                  {d.status === 'PENDING' && <button onClick={() => updateStatus(d.id, 'OUT_FOR_DELIVERY')} className="action-link">Start</button>}
                  {d.status === 'OUT_FOR_DELIVERY' && <button onClick={() => updateStatus(d.id, 'DELIVERED')} className="action-link">Complete</button>}
                </td>
              </tr>
            )) : <tr><td colSpan="6" className="empty">No deliveries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
