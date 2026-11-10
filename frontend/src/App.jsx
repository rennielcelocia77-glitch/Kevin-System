import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import InventoryItem from './pages/InventoryItem';
import OpeningStock from './pages/OpeningStock';
import Placeholder from './pages/Placeholder';
import { WashingPage, LaborPage, PurchasePage } from './pages/WorkflowPages';
import { ProductionPage, CustomerPage, SalesPage } from './pages/CommercialPages';
import Deliveries from './pages/Deliveries';
import NewDelivery from './pages/NewDelivery';
import Expenses from './pages/Expenses';
import NewExpense from './pages/NewExpense';
import Reports from './pages/Reports';
import History from './pages/History';
import Employees from './pages/Employees';
import Suppliers from './pages/Suppliers';
import './styles.css';

function Protected() { 
  const { user, loading } = useAuth();
  if (loading) return <main className="page-section"><p className="muted">Restoring your session...</p></main>;
  return user ? <Layout /> : <Navigate to="/login" replace />; 
}

export default function App() { 
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/item/:id" element={<InventoryItem />} />
            <Route path="/inventory/opening-stock" element={<OpeningStock />} />
            <Route path="/processing/washing" element={<WashingPage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/labor" element={<LaborPage />} />
            <Route path="/purchases" element={<PurchasePage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/customers" element={<CustomerPage />} />
            <Route path="/deliveries" element={<Deliveries />} />
            <Route path="/deliveries/new" element={<NewDelivery />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/expenses/new" element={<NewExpense />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/history" element={<History />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/suppliers" element={<Suppliers />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
