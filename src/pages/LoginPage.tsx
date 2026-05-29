import { useState } from "react";

interface LoginPageProps {
  onLogin: (user: any, token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginWithCredentials = async (loginEmail = "admin@cprphysio.hk", loginPassword = "admin123") => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登入失敗");
        setLoading(false);
        return;
      }

      onLogin(data.user, data.token);
    } catch (err) {
      setError("網絡錯誤，請重試");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(email || "admin@cprphysio.hk", password || "admin123");
  };

  return (
    <div className="cpr-login min-h-screen flex items-center justify-center px-4">
      <div className="cpr-login-card bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img className="cpr-login-logo mx-auto mb-5" src="/images/cpr-logo.png" alt="CPR Physio" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CPR Physio</h1>
          <p className="text-gray-600">ERP Admin Portal</p>
        </div>

        <button
          type="button"
          onClick={() => loginWithCredentials()}
          disabled={loading}
          className="w-full py-3 mb-5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "登入中..." : "直接登入管理員"}
        </button>

        <div className="relative my-5 text-center text-xs text-gray-500">
          <span className="bg-white px-3">或使用指定測試帳號</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電郵（可留空）</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="admin@cprphysio.hk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼（可留空）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "登入中..." : "登入"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>留空按登入會使用 Admin 測試帳號。</p>
          <p>Channel Partner 測試：partner1@cprphysio.hk / partner123</p>
        </div>
      </div>
    </div>
  );
}
