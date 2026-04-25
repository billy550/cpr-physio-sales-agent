import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CommissionPage from "./pages/CommissionPage";
import TransactionsPage from "./pages/TransactionsPage";
import AdminDistributorsPage from "./pages/AdminDistributorsPage";
import AdminTransactionsPage from "./pages/AdminTransactionsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminImportPage from "./pages/AdminImportPage";
import AppointmentsPage from "./pages/AppointmentsPage";

interface User {
  id: number;
  email: string;
  name: string;
  type: "admin" | "distributor" | "sub_agent";
  distributor_id?: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cpr_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (userData: User, token: string) => {
    localStorage.setItem("cpr_user", JSON.stringify(userData));
    localStorage.setItem("cpr_token", token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("cpr_user");
    localStorage.removeItem("cpr_token");
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="glass-ui min-h-screen bg-gray-100">
        <nav className="glass-surface bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900">CPR Physio Sales Agent</h1>
                <span className="text-sm text-gray-500">
                  {user.type === "admin" ? "管理員" : user.type === "distributor" ? "總代理" : "二級代理"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.name}</span>
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
            <AdminRoutes />
          ) : (
            <DistributorRoutes distributorId={user.distributor_id || user.id} />
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}

function AdminRoutes() {
  const location = useLocation();
  const navItems = [
    { path: "/", label: "儀表板", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { path: "/commissions", label: "佣金報表", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { path: "/transactions", label: "交易管理", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 7h3m-3-7h3m-3-7h3" },
    { path: "/distributors", label: "分銷商", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { path: "/appointments", label: "預約管理", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { path: "/import", label: "Excel導入", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  ];

  return (
    <div className="flex gap-6">
      <aside className="glass-surface w-56 bg-white rounded-xl shadow-sm p-4 h-fit">
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
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="/distributors" element={<AdminDistributorsPage />} />
          <Route path="/transactions" element={<AdminTransactionsPage />} />
          <Route path="/commissions" element={<CommissionPage isAdmin={true} />} />
          <Route path="/import" element={<AdminImportPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Routes>
      </div>
    </div>
  );
}

function DistributorRoutes({ distributorId }: { distributorId: number }) {
  const location = useLocation();
  const navItems = [
    { path: "/", label: "儀表板", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { path: "/commissions", label: "佣金報表", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { path: "/transactions", label: "交易記錄", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { path: "/appointments", label: "預約", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  return (
    <div className="flex gap-6">
      <aside className="glass-surface w-56 bg-white rounded-xl shadow-sm p-4 h-fit">
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
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<DashboardPage distributorId={distributorId} />} />
          <Route path="/commissions" element={<CommissionPage distributorId={distributorId} isAdmin={false} />} />
          <Route path="/transactions" element={<TransactionsPage distributorId={distributorId} />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;