import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CommissionPage from "./pages/CommissionPage";
import TransactionsPage from "./pages/TransactionsPage";
import AdminDistributorsPage from "./pages/AdminDistributorsPage";
import AdminTransactionsPage from "./pages/AdminTransactionsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminImportPage from "./pages/AdminImportPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import CrmClientsPage from "./features/crm/pages/CrmClientsPage";

interface User {
  id: number;
  email: string;
  name: string;
  type: "admin" | "distributor" | "sub_agent";
  distributor_id?: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cpr_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (userData: User, token: string) => {
    localStorage.setItem("cpr_user", JSON.stringify(userData));
    localStorage.setItem("cpr_token", token);
    window.history.replaceState(null, "", "/");
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("cpr_user");
    localStorage.removeItem("cpr_token");
    window.history.replaceState(null, "", "/");
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="cpr-app min-h-screen bg-gray-100">
        <nav className="cpr-topbar bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  className="cpr-menu-button"
                  aria-label={isSidebarCollapsed ? "Expand menu" : "Collapse menu"}
                  onClick={() => setIsSidebarCollapsed((value) => !value)}
                >
                  <span />
                  <span />
                  <span />
                </button>
                <img className="cpr-brand-logo" src="/images/cpr-logo.png" alt="CPR Physio" />
                <div className="cpr-topbar-divider" aria-hidden="true" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">CPR Physio Channel Partners</h1>
                  <p className="text-xs text-gray-500">Corporate wellness partner earnings portal</p>
                </div>
                <span className="cpr-role-chip text-sm text-gray-500">
                  {user.type === "admin" ? "管理員" : "Channel Partners"}
                </span>
              </div>
              <div className="cpr-topbar-actions relative flex items-center gap-4">
                <button
                  className="cpr-notification"
                  aria-label="Notifications"
                  onClick={() => setShowNotifications((value) => !value)}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 17H9m9-1.5c-.9-1.1-1.25-2.1-1.25-4.5a4.75 4.75 0 0 0-9.5 0c0 2.4-.35 3.4-1.25 4.5h12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span>3</span>
                </button>
                {showNotifications && (
                  <div className="cpr-notification-panel">
                    <strong>通知</strong>
                    <p>3 個待處理事項</p>
                    <ul>
                      <li>2 個 CRM 客戶需要跟進</li>
                      <li>1 個預約等待確認</li>
                      <li>本月 Partner Earnings 可匯出</li>
                    </ul>
                  </div>
                )}
                <span className="cpr-avatar" aria-hidden="true">{user.name.slice(0, 2).toUpperCase()}</span>
                <span className="cpr-user-chip text-sm text-gray-600">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {user.type === "admin" ? (
            <AdminRoutes isSidebarCollapsed={isSidebarCollapsed} />
          ) : (
            <DistributorRoutes distributorId={user.distributor_id || user.id} isSidebarCollapsed={isSidebarCollapsed} />
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}

function AdminRoutes({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const location = useLocation();
  const navItems = [
    { path: "/", label: "儀表板", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { path: "/crm/clients", label: "CRM 客戶", icon: "M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5 1.343 3.5 3 3.5ZM8 11c1.657 0 3-1.567 3-3.5S9.657 4 8 4 5 5.567 5 7.5 6.343 11 8 11Zm8 2c-2.67 0-5 1.3-5 3.5V19h10v-2.5c0-2.2-2.33-3.5-5-3.5ZM8 13c-2.67 0-5 1.3-5 3.5V19h6v-2.5c0-1.25.55-2.43 1.55-3.35A7.3 7.3 0 008 13Z" },
    { path: "/commissions", label: "Partner Earnings", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { path: "/transactions", label: "交易管理", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 7h3m-3-7h3m-3-7h3" },
    { path: "/distributors", label: "Channel Partners", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { path: "/appointments", label: "預約管理", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { path: "/import", label: "Excel導入", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  ];

  return (
    <div className="cpr-layout flex gap-6">
      <aside className={`cpr-sidebar w-56 bg-white rounded-xl shadow-sm p-4 h-fit ${isSidebarCollapsed ? "cpr-sidebar-collapsed" : ""}`}>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === item.path
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="cpr-nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="cpr-sidebar-summary">
          <p>本月結算期</p>
          <strong>2026年4月1日 – 2026年4月30日</strong>
          <span>結算日：2026年5月10日</span>
        </div>
        <p className="cpr-sidebar-version">版本：1.2.0</p>
      </aside>

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="/crm/clients" element={<CrmClientsPage />} />
          <Route path="/distributors" element={<AdminDistributorsPage />} />
          <Route path="/transactions" element={<AdminTransactionsPage />} />
          <Route path="/commissions" element={<CommissionPage isAdmin={true} />} />
          <Route path="/import" element={<AdminImportPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function DistributorRoutes({ distributorId, isSidebarCollapsed }: { distributorId: number; isSidebarCollapsed: boolean }) {
  const location = useLocation();
  const navItems = [
    { path: "/", label: "儀表板", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { path: "/commissions", label: "Partner Earnings", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { path: "/transactions", label: "交易記錄", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { path: "/appointments", label: "預約", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  return (
    <div className="cpr-layout flex gap-6">
      <aside className={`cpr-sidebar w-56 bg-white rounded-xl shadow-sm p-4 h-fit ${isSidebarCollapsed ? "cpr-sidebar-collapsed" : ""}`}>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === item.path
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="cpr-nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="cpr-sidebar-summary">
          <p>本月結算期</p>
          <strong>2026年4月1日 – 2026年4月30日</strong>
          <span>結算日：2026年5月10日</span>
        </div>
        <p className="cpr-sidebar-version">版本：1.2.0</p>
      </aside>

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<DashboardPage distributorId={distributorId} />} />
          <Route path="/commissions" element={<CommissionPage distributorId={distributorId} isAdmin={false} />} />
          <Route path="/transactions" element={<TransactionsPage distributorId={distributorId} />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
