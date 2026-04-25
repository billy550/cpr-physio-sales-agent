import { useState, useEffect } from "react";

interface Stats {
  total_transactions: number;
  completed_transactions: number;
  total_revenue: number;
  total_commission_paid: number;
  active_distributors: number;
  by_branch: Array<{
    branch_name: string;
    transaction_count: number;
    revenue: number;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("cpr_token");
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">管理員儀表板</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">總收入</p>
          <p className="text-2xl font-bold text-blue-600">HK${stats?.total_revenue?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">佣金總額</p>
          <p className="text-2xl font-bold text-green-600">HK${stats?.total_commission_paid?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">交易筆數</p>
          <p className="text-2xl font-bold text-gray-700">{stats?.completed_transactions || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">活躍分銷商</p>
          <p className="text-2xl font-bold text-purple-600">{stats?.active_distributors || 0}</p>
        </div>
      </div>

      {/* By Branch */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">各分店表現</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分店</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">交易筆數</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">收入</th>
              </tr>
            </thead>
            <tbody>
              {stats?.by_branch?.map((b, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{b.branch_name}</td>
                  <td className="text-right py-3 px-4">{b.transaction_count}</td>
                  <td className="text-right py-3 px-4">HK${b.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}