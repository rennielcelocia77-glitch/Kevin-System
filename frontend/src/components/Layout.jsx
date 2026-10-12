import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigation = [
  ['Dashboard', '/dashboard'], ['Inventory', '/inventory'], ['Processing', '/processing/washing'], ['Production', '/production'],
  ['Labor', '/labor'], ['Purchases', '/purchases'], ['Sales', '/sales'], ['Customers', '/customers'], ['Deliveries', '/deliveries'], ['Expenses', '/expenses'],
  ['Reports', '/reports'], ['History', '/history'], ['Employees', '/employees'], ['Suppliers', '/suppliers']
];

export default function Layout() {
  const { user, logout } = useAuth();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">B</span><span>Broom<br /><strong>Operations</strong></span></div>
      <nav>{navigation.map(([label, path]) => path === '#' ? <span className="nav-disabled" key={label}>{label}<small>Soon</small></span> : <NavLink key={label} to={path} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}</nav>
      <div className="sidebar-footer"><span>{user?.name}</span><button onClick={logout}>Sign out</button></div>
    </aside>
    <main className="main-content"><header><div><p className="eyebrow">Broom business system</p><h1>Good morning, {user?.name?.split(' ')[0] || 'Owner'}.</h1></div><span className="role-tag">{user?.role}</span></header><Outlet /></main>
  </div>;
}
