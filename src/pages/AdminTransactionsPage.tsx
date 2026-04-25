import { useState, useEffect } from "react";

interface Branch {
  id: number;
  name: string;
  location: string;
}

interface CorporateClient {
  id: number;
  company_name: string;
}

interface Distributor {
  id: number;
  name: string;
  type: string;
}

interface Transaction {
  id: number;
  employee_name: string;
  service_item: string;
  amount: number;
  commission_amount: number;
  transaction_date: string;
  branch_name: string;
  company_name: string;
  distributor_name: string;
  status: "completed" | "refunded";
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [clients, setClients] = useState<CorporateClient[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    distributor_id: "",
    corporate_client_id: "",
    branch_id: "",
    employee_name: "",
    service_item: "",
    amount: "",
    transaction_date: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("cpr_token");
    try {
      const [txRes, branchRes, clientRes, distRes] = await Promise.all([
        fetch("/api/admin/transactions", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/corporate-clients", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/distributors", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [txData, branchData, clientData, distData] = await Promise.all([
        txRes.json(),
        branchRes.json(),
        clientRes.json(),
        distRes.json()
      ]);

      setTransactions(txData.transactions || []);
      setBranches(branchData.branches || []);
      setClients(clientData.corporate_clients || []);
      setDistributors(distData.distributors || []);
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
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          distributor_id: parseInt(form.distributor_id),
          corporate_client_id: parseInt(form.corporate_client_id),
          branch_id: parseInt(form.branch_id),
          amount: parseFloat(form.amount)
        })
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ distributor_id: "", corporate_client_id: "", branch_id: "", employee_name: "", service_item: "", amount: "", transaction_date: "" });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">交易管理</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新增交易
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">日期</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分銷商</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">員工</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">公司</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分店</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">服務</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">金額</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">佣金</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">狀態</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm">{tx.transaction_date}</td>
                  <td className="py-3 px-4 text-sm">{tx.distributor_name}</td>
                  <td className="py-3 px-4 text-sm font-medium">{tx.employee_name}</td>
                  <td className="py-3 px-4 text-sm">{tx.company_name}</td>
                  <td className="py-3 px-4 text-sm">{tx.branch_name}</td>
                  <td className="py-3 px-4 text-sm">{tx.service_item}</td>
                  <td className="text-right py-3 px-4 text-sm">HK${tx.amount}</td>
                  <td className={`text-right py-3 px-4 text-sm font-medium ${tx.status === "refunded" ? "text-red-500" : "text-green-600"}`}>
                    HK${tx.commission_amount}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${tx.status === "refunded" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {tx.status === "refunded" ? "已退款" : "已完成"}
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
            <h3 className="text-lg font-semibold mb-4">新增交易</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">分銷商</label>
                <select
                  value={form.distributor_id}
                  onChange={(e) => setForm({ ...form, distributor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">請選擇</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">企業客戶</label>
                <select
                  value={form.corporate_client_id}
                  onChange={(e) => setForm({ ...form, corporate_client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">請選擇</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">分店</label>
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">請選擇</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">員工姓名</label>
                <input
                  type="text"
                  value={form.employee_name}
                  onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">服務項目</label>
                <input
                  type="text"
                  value={form.service_item}
                  onChange={(e) => setForm({ ...form, service_item: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="如：痛症治療"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">消費金額 (HK$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">消費日期</label>
                <input
                  type="date"
                  value={form.transaction_date}
                  onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
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