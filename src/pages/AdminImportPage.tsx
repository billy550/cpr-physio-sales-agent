import { useState, useEffect, useRef } from "react";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>([]);
  const [corporateClients, setCorporateClients] = useState<Array<{ id: number; company_name: string }>>([]);
  const [distributors, setDistributors] = useState<Array<{ id: number; name: string }>>([]);
  const [templateUrl, setTemplateUrl] = useState("");

  useEffect(() => {
    fetchDropdownData();
    generateTemplate();
  }, []);

  const fetchDropdownData = async () => {
    const token = localStorage.getItem("cpr_token");
    try {
      const [branchRes, clientRes, distRes] = await Promise.all([
        fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/corporate-clients", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/distributors", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [branchData, clientData, distData] = await Promise.all([
        branchRes.json(),
        clientRes.json(),
        distRes.json()
      ]);
      setBranches(branchData.branches || []);
      setCorporateClients(clientData.corporate_clients || []);
      setDistributors(distData.distributors || []);
    } catch (err) {
      console.error("Failed to fetch dropdown data", err);
    }
  };

  const generateTemplate = () => {
    const headers = ["分銷商ID", "企業客戶ID", "分店ID", "員工姓名", "服務項目", "消費金額", "消費日期"];
    const example = ["1", "1", "1", "陳大文", "痛症治療", "1000", "2026-04-01"];
    const csv = [headers.join(","), example.join(",")];
    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    setTemplateUrl(URL.createObjectURL(blob));
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("cpr_token");
    try {
      const res = await fetch("/api/admin/transactions/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Import failed", err);
      setResult({ success: 0, failed: 0, errors: [{ row: 0, error: "上傳失敗，請稍後再試" }] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Excel 批量導入</h2>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">下載模板</h3>
        <p className="text-sm text-gray-500 mb-4">
          先下載 Excel 模板，填好數據後再上傳。
        </p>
        <a
          href={templateUrl}
          download="cpr_transactions_template.csv"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下載 CSV 模板
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">上傳文件</h3>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-4">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 mb-1">
              {file ? file.name : "點擊選擇文件 或 拖放文件到這裡"}
            </p>
            <p className="text-xs text-gray-400">支援 CSV, XLSX 格式</p>
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "上傳中..." : "上傳並導入"}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">導入結果</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{result.success}</p>
              <p className="text-sm text-gray-600">成功導入</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{result.failed}</p>
              <p className="text-sm text-gray-600">導入失敗</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-700 mb-2">錯誤列表：</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i}>第 {err.row} 行：{err.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">格式說明</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>分銷商ID：</strong>從分銷商管理頁面獲取</p>
          <p><strong>企業客戶ID：</strong>從企業客戶管理頁面獲取</p>
          <p><strong>分店ID：</strong>1=西環, 2=旺角, 3=尖沙咀, 4=機場</p>
          <p><strong>消費日期：</strong>格式 YYYY-MM-DD</p>
        </div>
      </div>
    </div>
  );
}
