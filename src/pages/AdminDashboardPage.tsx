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

const metricIcons = {
  revenue: "M8 9.5V7a4 4 0 0 1 8 0v2.5m-8 0h8m-10 0h12l-1 10H7L6 9.5Zm6 3v4m-2-2h4",
  commission: "M7 8.5h10M7 12h10M7 15.5h10M5.5 5.5h13v13h-13z",
  transactions: "M8 6.5h8M8 11h8M8 15.5h5M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v14A1.5 1.5 0 0 1 18 20.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z",
  distributors: "M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19c.7-3 2.45-5 5-5s4.3 2 5 5m-2.5 0c.58-2.2 2.05-3.7 4.5-3.7 2.3 0 3.75 1.45 4.35 3.7",
};

function formatCurrency(value = 0) {
  return `HK$${value.toLocaleString()}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("CPR Admin");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [period, setPeriod] = useState("2026-04");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cpr_user");
    if (stored) {
      try {
        setUserName(JSON.parse(stored).name || "CPR Admin");
      } catch {
        setUserName("CPR Admin");
      }
    }

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

  const branches = stats?.by_branch || [];
  const filteredBranches = selectedBranch === "all"
    ? branches
    : branches.filter((branch) => branch.branch_name === selectedBranch);
  const totalRevenue = stats?.total_revenue || 0;
  const totalCommission = stats?.total_commission_paid || 0;
  const totalTransactions = stats?.completed_transactions || stats?.total_transactions || 0;
  const activeDistributors = stats?.active_distributors || 0;
  const target = 1500000;
  const targetProgress = Math.min(100, Math.round((totalRevenue / target) * 1000) / 10);
  const remaining = Math.max(0, target - totalRevenue);

  const metricCards = [
    { label: "總銷售額 (HKD)", value: formatCurrency(totalRevenue), delta: "18.6%", icon: metricIcons.revenue },
    { label: "Partner Earnings (HKD)", value: formatCurrency(totalCommission), delta: "18.6%", icon: metricIcons.commission },
    { label: "交易宗數", value: totalTransactions.toLocaleString(), delta: "12.4%", icon: metricIcons.transactions },
    { label: "Active Channel Partners", value: activeDistributors.toLocaleString(), delta: "8.0%", icon: metricIcons.distributors },
  ];

  const periodLabel = period === "2026-05"
    ? "2026年5月1日 – 2026年5月31日"
    : "2026年4月1日 – 2026年4月30日";

  const exportBranchReport = () => {
    const rows = [
      ["分店名稱", "總銷售額", "交易宗數", "平均交易額", "Partner Earnings"],
      ...filteredBranches.map((branch) => {
        const revenue = branch.revenue || 0;
        const average = branch.transaction_count ? Math.round(revenue / branch.transaction_count) : 0;
        return [
          branch.branch_name,
          String(revenue),
          String(branch.transaction_count),
          String(average),
          String(Math.round(revenue * 0.1))
        ];
      })
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `branch-performance-${period}-${selectedBranch === "all" ? "all" : selectedBranch}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cpr-dashboard">
      <header className="cpr-dashboard-header">
        <div>
          <h2>銷售總覽</h2>
          <p>
            你好， {userName}！以下是截至 <strong>2026年4月30日</strong> 的業績概覽。
          </p>
        </div>
        <div className="cpr-dashboard-actions">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            aria-label="選擇結算期"
          >
            <option value="2026-04">2026年4月1日 – 2026年4月30日</option>
            <option value="2026-05">2026年5月1日 – 2026年5月31日</option>
          </select>
          <button type="button" onClick={() => setShowFilters((value) => !value)}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M8 12h8M10.5 17h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            篩選
          </button>
        </div>
      </header>

      {showFilters && (
        <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-500 mb-1">分店</label>
              <select
                value={selectedBranch}
                onChange={(event) => setSelectedBranch(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">全部分店</option>
                {branches.map((branch) => (
                  <option key={branch.branch_name} value={branch.branch_name}>{branch.branch_name}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => setSelectedBranch("all")} className="px-4 py-2 border border-gray-300 rounded-lg">
              重設
            </button>
          </div>
        </section>
      )}

      <section className="cpr-metric-grid" aria-label="Sales metrics">
        {metricCards.map((metric) => (
          <article className="cpr-metric-card" key={metric.label}>
            <div>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>較上月同期 <b>▲ {metric.delta}</b></span>
            </div>
            <div className="cpr-metric-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d={metric.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </article>
        ))}
      </section>

      <section className="cpr-performance-panel">
        <div className="cpr-panel-heading">
          <h3>分店業績表現</h3>
          <div>
            <button type="button" onClick={() => setShowFilters(true)}>
              {selectedBranch === "all" ? "全部分店" : selectedBranch}
            </button>
            <button type="button" onClick={exportBranchReport}>匯出報表</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="cpr-performance-table">
            <thead>
              <tr>
                <th></th>
                <th>分店名稱</th>
                <th className="text-right">總銷售額 (HKD)</th>
                <th className="text-center">較上月同期</th>
                <th className="text-center">交易宗數</th>
                <th className="text-right">平均交易額 (HKD)</th>
                <th className="text-right">Partner Earnings (HKD)</th>
                <th className="text-center">達成率</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch, index) => {
                const rank = index + 1;
                const revenue = branch.revenue || 0;
                const average = branch.transaction_count ? Math.round(revenue / branch.transaction_count) : 0;
                const commission = Math.round(revenue * 0.1);
                const progress = Math.max(52, Math.min(108, Math.round((revenue / Math.max(totalRevenue, 1)) * 360)));
                const delta = index === 4 ? "-2.1%" : `${(24.5 - index * 3.8).toFixed(1)}%`;

                return (
                  <tr key={branch.branch_name}>
                    <td><span className="cpr-rank">{rank}</span></td>
                    <td className="font-medium">{branch.branch_name}</td>
                    <td className="text-right">{formatCurrency(revenue)}</td>
                    <td className={index === 4 ? "cpr-negative text-center" : "cpr-positive text-center"}>
                      {index === 4 ? "▼" : "▲"} {delta}
                    </td>
                    <td className="text-center">{branch.transaction_count}</td>
                    <td className="text-right">{formatCurrency(average)}</td>
                    <td className="text-right">{formatCurrency(commission)}</td>
                    <td>
                      <div className="cpr-progress-cell">
                        <span><i style={{ width: `${Math.min(progress, 100)}%` }} /></span>
                        <b>{progress}%</b>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td>總計</td>
                <td className="text-right">{formatCurrency(totalRevenue)}</td>
                <td className="cpr-positive text-center">▲ 18.6%</td>
                <td className="text-center">{totalTransactions}</td>
                <td className="text-right">{formatCurrency(totalTransactions ? Math.round(totalRevenue / totalTransactions) : 0)}</td>
                <td className="text-right">{formatCurrency(totalCommission)}</td>
                <td className="text-right">85%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="cpr-target-strip">
        <div className="cpr-target-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-4.5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <p>本月個人目標</p>
          <strong>{formatCurrency(target)}</strong>
          <span>目標達成率</span>
        </div>
        <div className="cpr-target-progress">
          <strong>{targetProgress}%</strong>
          <span><i style={{ width: `${targetProgress}%` }} /></span>
          <p>已達成 {formatCurrency(totalRevenue)} / 目標 {formatCurrency(target)}</p>
        </div>
        <div>
          <p>距離目標差額</p>
          <strong>{formatCurrency(remaining)}</strong>
          <span>{periodLabel}</span>
        </div>
      </section>
    </div>
  );
}
