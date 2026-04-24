import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewCustomerStep1 from './pages/NewCustomerStep1';
import Catalogue from './pages/Catalogue';
import CatalogueAdmin from './pages/CatalogueAdmin';
import JewelleryTryOn from './pages/JewelleryTryOn';
import Customers from './pages/Customers';
import Plans from './pages/Plans';
import Processing from './pages/Processing';
import TryOnResult from './pages/TryOnResult';
import PhotoError from './pages/PhotoError';
import SystemError from './pages/SystemError';
import Placeholder from './pages/Placeholder';
import { DashboardLayout } from './components/DashboardLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/login"  element={<Login />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="customer/new"           element={<NewCustomerStep1 />} />
          <Route path="customer/new/catalogue" element={<Catalogue />} />
          <Route path="catalogue"              element={<CatalogueAdmin />} />
          <Route path="jewellery-tryon/:sessionId" element={<JewelleryTryOn />} />
          <Route path="tryon/:sessionId"             element={<Processing />} />
          <Route path="tryon/:sessionId/result"      element={<TryOnResult />} />
          <Route path="tryon/:sessionId/photo-error" element={<PhotoError />} />
          <Route path="tryon/:sessionId/failed"      element={<SystemError />} />
          <Route path="customers" element={<Customers />} />
          <Route path="history"   element={<Placeholder title="Try-on History" subtitle="इतिहास" />} />
          <Route path="plan"      element={<Plans />} />
          <Route path="settings"  element={<Placeholder title="Settings" subtitle="सेटिंग" />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
