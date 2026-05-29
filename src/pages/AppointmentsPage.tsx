import { useState, useEffect } from "react";

interface Appointment {
  id: string;
  branch_id: number;
  branch_name: string;
  corporate_client_id: number;
  company_name: string;
  employee_name: string;
  employee_phone: string;
  service_item: string;
  appointment_date: string;
  appointment_time: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  notes: string;
}

interface Branch {
  id: number;
  name: string;
  location: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [corporateClients, setCorporateClients] = useState<Array<{id: number; company_name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedBranch, setSelectedBranch] = useState<number | "all">("all");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState("");
  const [form, setForm] = useState({
    branch_id: "",
    corporate_client_id: "",
    employee_name: "",
    employee_phone: "",
    service_item: "",
    appointment_date: "",
    appointment_time: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, [selectedBranch, selectedDate]);

  const fetchData = async () => {
    const token = localStorage.getItem("cpr_token");
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        ...(selectedBranch !== "all" && { branch_id: String(selectedBranch) })
      });
      const [apptRes, branchRes, clientRes] = await Promise.all([
        fetch(`/api/appointments?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/corporate-clients", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [apptData, branchData, clientData] = await Promise.all([apptRes.json(), branchRes.json(), clientRes.json()]);
      setAppointments(apptData.appointments || []);
      setBranches(branchData.branches || []);
      setCorporateClients(clientData.corporate_clients || []);
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("cpr_token");
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          branch_id: parseInt(form.branch_id),
          corporate_client_id: parseInt(form.corporate_client_id)
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        const createdDate = form.appointment_date;
        setForm({ branch_id: '', corporate_client_id: '', employee_name: '', employee_phone: '', service_item: '', appointment_date: '', appointment_time: '', notes: '' });
        if (createdDate && createdDate !== selectedDate) {
          setSelectedDate(createdDate);
        } else {
          fetchData();
        }
        
        // If calendar sync is needed, call API to create Google Calendar event
        if (result.needs_calendar_sync && result.calendar_event_details) {
          const eventDetails = result.calendar_event_details;
          try {
            const calResponse = await fetch('/api/google-calendar/events', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                summary: eventDetails.summary,
                description: eventDetails.description,
                start: { dateTime: eventDetails.start },
                end: { dateTime: eventDetails.end },
              }),
            });
            const calResult = await calResponse.json();
            if (calResult.success) {
              setShowSuccessMessage('預約已建立並同步到 Google Calendar');
            }
          } catch (calError) {
            console.error('Calendar sync error:', calError);
            setShowSuccessMessage('預約已建立（Google Calendar 同步稍後）');
          }
        } else {
          setShowSuccessMessage('預約已建立');
        }
        
        setShowModal(false);
        setTimeout(() => setShowSuccessMessage(''), 3000);
      } else {
        setError(result.error || '建立預約失敗');
      }
    } catch (err) {
      setError('建立預約時發生錯誤');
    }
  };

  const getCalendarDays = () => {
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<{ date: string; appointments: Appointment[] }> = [];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        date: dateStr,
        appointments: appointments.filter(a => a.appointment_date === dateStr)
      });
    }
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">預約管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            新增預約
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-lg ${view === "list" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
          >
            列表
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded-lg ${view === "calendar" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
          >
            日曆
          </button>
        </div>

        <select
          value={selectedBranch === "all" ? "all" : selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value === "all" ? "all" : parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">全部分店</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {view === "list" ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">時間</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分店</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">員工</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">公司</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">服務</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">狀態</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">暫時沒有預約</td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm">{appt.appointment_date}</td>
                      <td className="py-3 px-4 text-sm">{appt.appointment_time}</td>
                      <td className="py-3 px-4 text-sm">{appt.branch_name}</td>
                      <td className="py-3 px-4 text-sm font-medium">{appt.employee_name}</td>
                      <td className="py-3 px-4 text-sm">{appt.company_name}</td>
                      <td className="py-3 px-4 text-sm">{appt.service_item}</td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          appt.status === "confirmed" ? "bg-green-100 text-green-700" :
                          appt.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          appt.status === "completed" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {appt.status === "confirmed" ? "已確認" :
                           appt.status === "pending" ? "待確認" :
                           appt.status === "completed" ? "已完成" : "已取消"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-7 gap-2">
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
              <div key={d} className="text-center py-2 text-sm font-medium text-gray-500">{d}</div>
            ))}
            {getCalendarDays().map((day) => (
              <div key={day.date} className="min-h-24 border border-gray-100 rounded-lg p-2">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {new Date(day.date).getDate()}
                </div>
                {day.appointments.slice(0, 3).map((appt) => (
                  <div key={appt.id} className="text-xs bg-blue-100 text-blue-700 rounded px-1 py-0.5 mb-1 truncate">
                    {appt.appointment_time} {appt.employee_name}
                  </div>
                ))}
                {day.appointments.length > 3 && (
                  <div className="text-xs text-gray-400">+{day.appointments.length - 3} 更多</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新增預約</h3>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
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
                <label className="block text-sm text-gray-500 mb-1">企業客戶</label>
                <select
                  value={form.corporate_client_id}
                  onChange={(e) => setForm({ ...form, corporate_client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">請選擇</option>
                  {corporateClients.map((client) => (
                    <option key={client.id} value={client.id}>{client.company_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm text-gray-500 mb-1">聯絡電話</label>
                  <input
                    type="tel"
                    value={form.employee_phone}
                    onChange={(e) => setForm({ ...form, employee_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">日期</label>
                  <input
                    type="date"
                    value={form.appointment_date}
                    onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">時間</label>
                  <input
                    type="time"
                    value={form.appointment_time}
                    onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">備註</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
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
