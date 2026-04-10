import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddItem from './pages/AddItem';
import SellItem from './pages/SellItem';
import SellItemV2 from './pages/SellItemV2';
import SellItem2 from './pages/SellItem2';
import AddSellerParty from './pages/AddSellerParty';
import Parties from './pages/Parties';
import SellReport from './pages/SellReport';
import ItemWiseSellReport from './pages/ItemWiseSellReport';
import ReturnReport from './pages/ReturnReport';
import ReturnItem from './pages/ReturnItem';
import OrderSheet from './pages/OrderSheet';
import DueSheet from './pages/DueSheet';
import Nozzles from './pages/Nozzles';
import Attendants from './pages/Attendants';
import NozzleReading from './pages/NozzleReading';
import DayWiseReports from './pages/DayWiseReports';
import Expenses from './pages/Expenses';
import CreditorDashboard from './pages/CreditorDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PetrolNozzleLoader from './components/PetrolNozzleLoader';
import config from './config/config';
import './App.css';

const usePetrolLoader = config.app.theme === 'petrol_pump';

const Router = typeof window !== 'undefined' && window.electronAPI?.isElectron ? HashRouter : BrowserRouter;

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px', background: '#f8fafc' }}>
        {usePetrolLoader && <PetrolNozzleLoader size="large" />}
        <span style={{ color: usePetrolLoader ? '#64748b' : '#1e293b', fontWeight: 500 }}>Loading…</span>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ToastProvider>
          <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-item"
            element={
              <PrivateRoute>
                <AddItem />
              </PrivateRoute>
            }
          />
          <Route
            path="/sell-item"
            element={
              <PrivateRoute>
                <SellItem />
              </PrivateRoute>
            }
          />
          <Route
            path="/sell-item-2"
            element={
              <PrivateRoute>
                <SellItemV2 />
              </PrivateRoute>
            }
          />
          <Route
            path="/sell-item-v3"
            element={
              <PrivateRoute>
                <SellItem2 />
              </PrivateRoute>
            }
          />
          <Route path="/add-buyer-party" element={<Navigate to="/parties" replace />} />
          <Route
            path="/add-seller-party"
            element={
              <PrivateRoute>
                <AddSellerParty />
              </PrivateRoute>
            }
          />
          <Route
            path="/parties"
            element={
              <PrivateRoute>
                <Parties />
              </PrivateRoute>
            }
          />
          <Route
            path="/sell-report"
            element={
              <PrivateRoute>
                <SellReport />
              </PrivateRoute>
            }
          />
          <Route
            path="/day-wise-reports"
            element={
              <PrivateRoute>
                <DayWiseReports />
              </PrivateRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <PrivateRoute>
                <Expenses />
              </PrivateRoute>
            }
          />
          <Route
            path="/sell-report-items"
            element={
              <PrivateRoute>
                <ItemWiseSellReport />
              </PrivateRoute>
            }
          />
          <Route
            path="/return-report"
            element={
              <PrivateRoute>
                <ReturnReport />
              </PrivateRoute>
            }
          />
          <Route
            path="/return-item"
            element={
              <PrivateRoute>
                <ReturnItem />
              </PrivateRoute>
            }
          />
          <Route
            path="/order-sheet"
            element={
              <PrivateRoute>
                <OrderSheet />
              </PrivateRoute>
            }
          />
          <Route
            path="/due-sheet"
            element={
              <PrivateRoute>
                <DueSheet />
              </PrivateRoute>
            }
          />
          <Route
            path="/nozzles"
            element={
              <PrivateRoute>
                <Nozzles />
              </PrivateRoute>
            }
          />
          <Route
            path="/attendants"
            element={
              <PrivateRoute>
                <Attendants />
              </PrivateRoute>
            }
          />
          <Route
            path="/nozzle-reading"
            element={
              <PrivateRoute>
                <NozzleReading />
              </PrivateRoute>
            }
          />
          <Route
            path="/creditor-dashboard"
            element={
              <PrivateRoute>
                <CreditorDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
    </Provider>
  );
}

export default App;

