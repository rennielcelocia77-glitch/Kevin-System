import { useEffect, useState } from 'react';
import { api } from '../services/api';

function formatAction(action) {
  return action.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function History() {
  const [records, setRecords] = useState([]);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.history(type ? { type } : {})
      .then(result => { if (active) setRecords(result.data); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type]);

  return <section className="page-section">
    <div className="section-intro">
      <div><p className="eyebrow">Activity ledger</p><h2>History</h2><p className="muted">All stock movements and business processes recorded by the system.</p></div>
      <select className="history-filter" value={type} onChange={event => setType(event.target.value)} aria-label="Filter history type">
        <option value="">All activity</option><option value="INVENTORY">Stock movements</option><option value="PROCESS">Processes</option><option value="EMPLOYEE_ADVANCE">Employees</option>
      </select>
    </div>
    {error && <p className="form-error">Unable to load history. {error}</p>}
    {loading ? <p className="empty-state">Loading history...</p> : <div className="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Action</th><th>Item / Record</th><th>Details</th><th>Recorded by</th></tr></thead><tbody>{records.length ? records.map((record, index) => <tr key={`${record.activity_type}-${record.id}-${index}`}><td>{new Date(record.activity_date).toLocaleString()}</td><td><span className="history-type">{record.activity_type}</span></td><td><strong>{formatAction(record.action)}</strong></td><td>{record.subject}</td><td className="history-detail">{record.detail || record.notes || '-'}</td><td>{record.user_name || 'System'}</td></tr>) : <tr><td colSpan="6" className="empty">No history records found.</td></tr>}</tbody></table></div>}
  </section>;
}
