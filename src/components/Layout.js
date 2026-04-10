import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const DASHBOARD_TABS = [
  { id: 'items', label: 'Stock & items' },
  { id: 'nozzles', label: 'Nozzle readings' },
  { id: 'creditors', label: 'Due sheet' }
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDashboard = location.pathname === '/dashboard';
  const activeDashTab = searchParams.get('tab') || 'items';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/add-item', label: 'Add Item', roles: ['admin', 'super_admin', 'sales'] },
    { path: '/sell-item', label: 'Sell Item' },
    // { path: '/return-item', label: 'Return Item' },
    { path: '/parties', label: 'Creditors' },
    // { path: '/add-seller-party', label: 'Add Creditor', roles: ['admin', 'super_admin'] },
    { path: '/nozzle-reading', label: 'Daily Nozzle Reading' },
    { path: '/nozzles', label: 'Manage Nozzles', roles: ['admin', 'super_admin'] },
    { path: '/attendants', label: 'Manage Attendants', roles: ['admin', 'super_admin'] },
    { path: '/sell-report', label: 'Sell Report' },
    { path: '/day-wise-reports', label: 'Day-wise Reports' },
    { path: '/expenses', label: 'Expenses' },
    { path: '/sell-report-items', label: 'Item-wise Sell Report', roles: ['admin', 'super_admin'] },
    // { path: '/return-report', label: 'Return Report' },
    { path: '/order-sheet', label: 'Order Sheet' },
    // { path: '/creditor-dashboard', label: 'Creditor Dashboard', roles: ['super_admin'] },
    { path: '/due-sheet', label: 'Due Sheet', roles: ['super_admin'] }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true; // No role restriction
    return item.roles.includes(user?.role);
  });

  const getRoleLabel = (role) => {
    const roles = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      sales: 'Sales'
    };
    return roles[role] || role;
  };

  return (
    <div className="layout">
      <header className={`header${isDashboard ? ' header--dashboard-tabs' : ''}`}>
        <div className={`header-content${isDashboard ? ' header-content--dashboard-tabs' : ''}`}>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <h1>Steepray Information Services Private Limited</h1>
          {isDashboard && (
            <nav className="header-dashboard-tabs pp-seg" aria-label="Dashboard section">
              {DASHBOARD_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`pp-seg__btn${activeDashTab === t.id ? ' pp-seg__btn--active' : ''}`}
                  onClick={() => setSearchParams({ tab: t.id }, { replace: true })}
                  aria-current={activeDashTab === t.id ? 'page' : undefined}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          )}
          <div className="header-right">
            <span className="user-info">
              {user?.user_id} ({getRoleLabel(user?.role)})
            </span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Overlay when sidebar is open - click to close */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="layout-body">
        <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <span className="sidebar-title">Menu</span>
            <button
              className="sidebar-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <ul className="menu">
            {filteredMenuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="main-content">
          {children}
        </main>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <p className="footer-copyright">
              © {new Date().getFullYear()} Steepray Information Services Private Limited. All rights reserved.
            </p>
          </div>
          <div className="footer-section">
            <p className="footer-credits">
              Designed and Developed by <strong>Steepray Information Services Private Limited</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

