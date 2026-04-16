import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const DASHBOARD_TABS = [
  { id: 'items', label: 'Stock & products' },
  { id: 'nozzles', label: 'Pump readings' },
  { id: 'creditors', label: 'Money owed' }
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  /* Lock viewport scroll when nav is open (fixes touch/wheel scrolling content behind overlay). */
  useEffect(() => {
    if (!menuOpen) return undefined;
    const scrollY = window.scrollY || window.pageYOffset;
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBody = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    html.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.position = prevBody.position;
      document.body.style.top = prevBody.top;
      document.body.style.left = prevBody.left;
      document.body.style.right = prevBody.right;
      document.body.style.width = prevBody.width;
      document.body.style.overflow = prevBody.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

  const isDashboard = location.pathname === '/dashboard';
  const activeDashTab = searchParams.get('tab') || 'items';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Home / Dashboard' },
    { path: '/add-item', label: 'Add product to stock', roles: ['admin', 'super_admin', 'sales'] },
    { path: '/sell-item', label: 'New sale (billing)' },
    { path: '/parties', label: 'Suppliers & balances' },
    { path: '/nozzle-reading', label: 'Daily pump readings' },
    { path: '/pump-shift-reports', label: 'Pump shift reports' },
    { path: '/nozzles', label: 'Pumps & nozzles', roles: ['admin', 'super_admin'] },
    { path: '/attendants', label: 'Pump staff', roles: ['admin', 'super_admin'] },
    { path: '/sell-report', label: 'Sales report' },
    { path: '/day-wise-reports', label: 'Daily summaries' },
    { path: '/expenses', label: 'Expenses' },
    { path: '/sell-report-items', label: 'Sales by product', roles: ['admin', 'super_admin'] },
    { path: '/order-sheet', label: 'Orders' },
    { path: '/due-sheet', label: 'All dues & dates', roles: ['super_admin'] }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true; // No role restriction
    return item.roles.includes(user?.role);
  });

  const getRoleLabel = (role) => {
    const roles = {
      super_admin: 'Owner',
      admin: 'Manager',
      sales: 'Staff'
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
            <span className="user-info" title="Your login and access level">
              Signed in as {user?.user_id} · {getRoleLabel(user?.role)}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className={`layout-body${menuOpen ? ' layout-body--nav-open' : ''}`}>
        {/* Overlay must be a sibling of main *inside* layout-body so it paints above main (not below the whole column). */}
        {menuOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}
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

        <main className={`main-content${menuOpen ? ' main-content--nav-open' : ''}`}>
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

