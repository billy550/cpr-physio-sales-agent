import { useState, useEffect } from "react";

interface DashboardPageProps {
  distributorId: number;
}

interface CommissionData {
  total_commission: number;
  total_amount: number;
  transaction_count: number;
  by_branch: Array<{
    branch_id: number;
    branch_name: string;
    total_amount: number;
    total_commission: number;
    transaction_count: number;
  }>;
  by_corporate: Array<{
    client_id: number;
    company_name: string;
    total_amount: number;
    total_commission: number;
    transaction_count: number;
  }>;
}

interface RecentTransaction {
  id: number;
  employee_name: string;
  service_item: string;
  amount: number;
  commission_amount: number;
  transaction_date: string;
  branch_name: string;
  company_name: string;
}

export default function DashboardPage({ distributorId }: DashboardPageProps) {
  const [data, setData] = useState<CommissionData | null>(null);
  const [recentTx, setRecentTx] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("cpr_token");
      try {
        const [commRes, txRes] = await Promise.all([
          fetch(`/api/distributor/${distributorId}/commissions`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`/api/distributor/${distributorId}/transactions?month=2026-04`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const commData = await commRes.json();
        const txData = await txRes.json();

        setData(commData);
        setRecentTx(txData.transactions?.slice(0, 5) || []);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [distributorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">我的儀表板</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Monthly Partner Earnings</p>
          <p className="text-3xl font-bold text-green-600">HK${data?.total_commission?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">本月消費額</p>
          <p className="text-3xl font-bold text-blue-600">HK${data?.total_amount?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">交易筆數</p>
          <p className="text-3xl font-bold text-gray-700">{data?.transaction_count || 0}</p>
        </div>
      </div>

      {/* By Branch */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">按分店分類</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分店</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">交易筆數</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">消費額</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Partner Earnings</th>
              </tr>
            </thead>
            <tbody>
              {data?.by_branch?.map((b) => (
                <tr key={b.branch_id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{b.branch_name}</td>
                  <td className="text-right py-3 px-4">{b.transaction_count}</td>
                  <td className="text-right py-3 px-4">HK${b.total_amount.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 text-green-600 font-medium">HK${b.total_commission.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Corporate Client */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">按企業客戶分類</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">公司</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">交易筆數</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">消費額</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Partner Earnings</th>
              </tr>
            </thead>
            <tbody>
              {data?.by_corporate?.map((c) => (
                <tr key={c.client_id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{c.company_name}</td>
                  <td className="text-right py-3 px-4">{c.transaction_count}</td>
                  <td className="text-right py-3 px-4">HK${c.total_amount.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 text-green-600 font-medium">HK${c.total_commission.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近交易</h3>
        <div className="space-y-3">
          {recentTx.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{tx.employee_name}</p>
                <p className="text-sm text-gray-500">{tx.company_name} · {tx.service_item} · {tx.branch_name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">HK${tx.amount}</p>
                <p className="text-sm text-green-600">+HK${tx.commission_amount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
