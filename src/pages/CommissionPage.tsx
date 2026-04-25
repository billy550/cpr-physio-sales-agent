import { useState, useEffect } from "react";

interface CommissionPageProps {
  distributorId: number;
  isAdmin: boolean;
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
}

export default function CommissionPage({ distributorId, isAdmin }: CommissionPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ month: "2026-04", client_id: "", branch_id: "" });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("cpr_token");
      const url = isAdmin 
        ? `/api/admin/transactions?month=${filter.month}`
        : `/api/distributor/${distributorId}/transactions?month=${filter.month}`;
      
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        console.error("Failed to fetch", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter, distributorId, isAdmin]);

  const totalCommission = transactions
    .filter(t => t.status !== "refunded")
    .reduce((sum, t) => sum + t.commission_amount, 0);

  const totalAmount = transactions
    .filter(t => t.status !== "refunded")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isAdmin ? "所有佣金報表" : "我的佣金報表"}
        </h2>
        <div className="flex gap-2">
          <select
            value={filter.month}
            onChange={(e) => setFilter({ ...filter, month: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="2026-04">2026年4月</option>
            <option value="2026-03">2026年3月</option>
            <option value="2026-02">2026年2月</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">佣金總額</p>
          <p className="text-3xl font-bold text-green-600">HK${totalCommission.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">消費總額</p>
          <p className="text-3xl font-bold text-blue-600">HK${totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">交易筆數</p>
          <p className="text-3xl font-bold text-gray-700">{transactions.filter(t => t.status !== "refunded").length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">日期</th>
                {isAdmin && <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分銷商</th>}
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
                  {isAdmin && <td className="py-3 px-4 text-sm">{tx.distributor_name}</td>}
                  <td className="py-3 px-4 text-sm font-medium">{tx.employee_name}</td>
                  <td className="py-3 px-4 text-sm">{tx.company_name}</td>
                  <td className="py-3 px-4 text-sm">{tx.branch_name}</td>
                  <td className="py-3 px-4 text-sm">{tx.service_item}</td>
                  <td className="text-right py-3 px-4 text-sm">HK${tx.amount}</td>
                  <td className={`text-right py-3 px-4 text-sm font-medium ${tx.status === "refunded" ? "text-red-500 line-through" : "text-green-600"}`}>
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