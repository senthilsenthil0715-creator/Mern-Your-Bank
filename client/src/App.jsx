import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Layout from './components/Layout';
import Background3D from './components/Background3D';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Money from './pages/Money';
import Transfer from './pages/Transfer';
import Transactions from './pages/Transactions';
import Cards from './pages/Cards';
import Loans from './pages/Loans';
import Bills from './pages/Bills';
import Profile from './pages/Profile';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminActivity from './pages/admin/AdminActivity';

function Splash() {
  return (
    <div className="splash">
      <Background3D />
      <div className="spinner" />
    </div>
  );
}

function Protected() {
  const { user, loading } = useApp();
  if (loading) return <Splash />;
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

function AdminOnly({ children }) {
  const { user } = useApp();
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

function Public({ children }) {
  const { user, loading } = useApp();
  if (loading) return <Splash />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Public><Auth mode="login" /></Public>} />
      <Route path="/register" element={<Public><Auth mode="register" /></Public>} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="money" element={<Money />} />
        <Route path="transfer" element={<Transfer />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="cards" element={<Cards />} />
        <Route path="loans" element={<Loans />} />
        <Route path="bills" element={<Bills />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<AdminOnly><AdminOverview /></AdminOnly>} />
        <Route path="admin/users" element={<AdminOnly><AdminUsers /></AdminOnly>} />
        <Route path="admin/transactions" element={<AdminOnly><AdminActivity /></AdminOnly>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
