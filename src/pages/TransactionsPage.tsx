import { useState, useEffect } from "react";

interface TransactionsPageProps {
  distributorId: number;
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
  status: "completed" | "refunded";
}

interface Branch {
  id: number;
  name: string;
}

interface CorporateClient {
  id: number;
  company_name: string;
}

export default function TransactionsPage({ distributorId }: TransactionsPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [clients, setClients] = useState<CorporateClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ month: "", client_id: "", branch_id: "" });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("cpr_token");
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.month) params.append("month", filter.month);
      if (filter.client_id) params.append("client_id", filter.client_id);
      if (filter.branch_id) params.append("branch_id", filter.branch_id);

      try {
        const [txRes, branchRes, clientRes] = await Promise.all([
          fetch(`/api/distributor/${distributorId}/transactions?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/corporate-clients", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const [data, branchData, clientData] = await Promise.all([
          txRes.json(),
          branchRes.json(),
          clientRes.json()
        ]);
        setTransactions(data.transactions || []);
        setBranches(branchData.branches || []);
        setClients(clientData.corporate_clients || []);
      } catch (err) {
        console.error("Failed to fetch", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter, distributorId]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">交易記錄</h2>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-500 mb-1">月份</label>
          <select
            value={filter.month}
            onChange={(e) => setFilter({ ...filter, month: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部月份</option>
            <option value="2026-05">2026年5月</option>
            <option value="2026-04">2026年4月</option>
            <option value="2026-03">2026年3月</option>
            <option value="2026-02">2026年2月</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">企業客戶</label>
          <select
            value={filter.client_id}
            onChange={(e) => setFilter({ ...filter, client_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.company_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">分店</label>
          <select
            value={filter.branch_id}
            onChange={(e) => setFilter({ ...filter, branch_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setFilter({ month: "", client_id: "", branch_id: "" })}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
        >
          清除篩選
        </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading && <p className="text-sm text-gray-500 mb-3">載入中...</p>}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">日期</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">員工</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">公司</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分店</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">服務</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">金額</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Partner Earnings</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">狀態</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">沒有符合條件的交易</td>
                </tr>
              ) : transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm">{tx.transaction_date}</td>
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
    </div>
  );
}
