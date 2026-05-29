import { useState, useEffect } from "react";

interface Distributor {
  id: number;
  name: string;
  type: "总代理" | "二级代理";
  parent_id?: number;
  commission_rate: number;
  email: string;
  phone: string;
  status: "active" | "inactive";
  created_at: string;
}

export default function AdminDistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "总代理" as "总代理" | "二级代理",
    parent_id: "",
    commission_rate: 0.10,
    email: "",
    phone: "",
    password: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("cpr_token");
    try {
      const res = await fetch("/api/admin/distributors", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDistributors(data.distributors || []);
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("cpr_token");
    try {
      const res = await fetch("/api/admin/distributors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, parent_id: form.parent_id || undefined })
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ name: "", type: "总代理", parent_id: "", commission_rate: 0.10, email: "", phone: "", password: "" });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Channel Partners</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Channel Partner
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">名稱</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">類型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">上級</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Partner Earnings Rate</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">電郵</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">電話</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">狀態</th>
              </tr>
            </thead>
            <tbody>
              {distributors.map((d) => (
                <tr key={d.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{d.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${d.type === "总代理" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      Channel Partner
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {d.parent_id ? distributors.find(x => x.id === d.parent_id)?.name || "-" : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm">{(d.commission_rate * 100).toFixed(0)}%</td>
                  <td className="py-3 px-4 text-sm">{d.email}</td>
                  <td className="py-3 px-4 text-sm">{d.phone}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${d.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                      {d.status === "active" ? "啟用" : "停用"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Channel Partner</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">名稱</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">類型</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "总代理" | "二级代理" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="总代理">Channel Partner</option>
                  <option value="二级代理">Channel Partner</option>
                </select>
              </div>
              {form.type === "二级代理" && (
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Parent Channel Partner</label>
                  <select
                    value={form.parent_id}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">請選擇</option>
                    {distributors.filter(d => d.type === "总代理").map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-500 mb-1">Partner Earnings Rate</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">電郵</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">電話</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">密碼（可選）</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="預設：default123"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  確認
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
