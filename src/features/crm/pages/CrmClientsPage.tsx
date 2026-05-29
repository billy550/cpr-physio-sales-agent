import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  DollarSign,
  Edit3,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  Stethoscope,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { createCrmClient, fetchCrmClients, updateCrmClient } from "../api";
import type { CrmClient, CrmClientForm, CrmClientStatus, CrmStats } from "../types";

type DraftClient = {
  client_code: string;
  name: string;
  phone: string;
  email: string;
  age: string;
  gender: string;
  occupation: string;
  address: string;
  status: CrmClientStatus;
  tags: string;
  amount: string;
  diagnosis: string;
  complaint: string;
  treatment_modality: string;
  findings: string;
  medical_history: string;
  current_symptoms: string;
  pain_level: string;
  posture_score: string;
  last_visit_date: string;
  next_appointment_date: string;
  vibe_score: string;
  remarks: string;
  referred_by: string;
  referred_by_partner_id: string;
  referral_revenue: string;
  case_captain: string;
  social_history: string;
  contraindications: string;
  post_treatment_condition: string;
  next_plan: string;
};

const emptyDraft: DraftClient = {
  client_code: "",
  name: "",
  phone: "",
  email: "",
  age: "",
  gender: "",
  occupation: "",
  address: "",
  status: "Lead",
  tags: "",
  amount: "0",
  diagnosis: "",
  complaint: "",
  treatment_modality: "",
  findings: "",
  medical_history: "",
  current_symptoms: "",
  pain_level: "",
  posture_score: "",
  last_visit_date: new Date().toISOString().split("T")[0],
  next_appointment_date: "",
  vibe_score: "50",
  remarks: "",
  referred_by: "",
  referred_by_partner_id: "",
  referral_revenue: "0",
  case_captain: "",
  social_history: "",
  contraindications: "",
  post_treatment_condition: "",
  next_plan: "",
};

const statusLabel: Record<CrmClientStatus, string> = {
  Active: "活躍",
  Inactive: "非活躍",
  Churned: "已流失",
  Lead: "潛在客戶",
};

function currency(value = 0) {
  return `HK$${Math.round(value).toLocaleString()}`;
}

function toDraft(client: CrmClient): DraftClient {
  return {
    client_code: client.client_code || "",
    name: client.name || "",
    phone: client.phone || "",
    email: client.email || "",
    age: client.age ? String(client.age) : "",
    gender: client.gender || "",
    occupation: client.occupation || "",
    address: client.address || "",
    status: client.status,
    tags: client.tags?.join(", ") || "",
    amount: String(client.amount || 0),
    diagnosis: client.diagnosis || "",
    complaint: client.complaint || "",
    treatment_modality: client.treatment_modality || "",
    findings: client.findings || "",
    medical_history: client.medical_history?.join(", ") || "",
    current_symptoms: client.current_symptoms?.join(", ") || "",
    pain_level: client.pain_level !== undefined ? String(client.pain_level) : "",
    posture_score: client.posture_score !== undefined ? String(client.posture_score) : "",
    last_visit_date: client.last_visit_date || new Date().toISOString().split("T")[0],
    next_appointment_date: client.next_appointment_date || "",
    vibe_score: String(client.vibe_score || 50),
    remarks: client.remarks || "",
    referred_by: client.referred_by || "",
    referred_by_partner_id: client.referred_by_partner_id ? String(client.referred_by_partner_id) : "",
    referral_revenue: String(client.referral_revenue || 0),
    case_captain: client.case_captain || "",
    social_history: client.social_history || "",
    contraindications: client.contraindications?.join(", ") || "",
    post_treatment_condition: client.post_treatment_condition || "",
    next_plan: client.next_plan || "",
  };
}

function toPayload(draft: DraftClient): CrmClientForm {
  return {
    client_code: draft.client_code,
    name: draft.name,
    phone: draft.phone,
    email: draft.email,
    age: draft.age ? Number(draft.age) : undefined,
    gender: draft.gender,
    occupation: draft.occupation,
    address: draft.address,
    status: draft.status,
    tags: draft.tags as unknown as string[],
    amount: Number(draft.amount || 0),
    diagnosis: draft.diagnosis,
    complaint: draft.complaint,
    treatment_modality: draft.treatment_modality,
    findings: draft.findings,
    medical_history: draft.medical_history as unknown as string[],
    current_symptoms: draft.current_symptoms as unknown as string[],
    pain_level: draft.pain_level ? Number(draft.pain_level) : undefined,
    posture_score: draft.posture_score ? Number(draft.posture_score) : undefined,
    last_visit_date: draft.last_visit_date,
    next_appointment_date: draft.next_appointment_date,
    vibe_score: Number(draft.vibe_score || 50),
    remarks: draft.remarks,
    referred_by: draft.referred_by,
    referred_by_partner_id: draft.referred_by_partner_id ? Number(draft.referred_by_partner_id) : undefined,
    referral_revenue: Number(draft.referral_revenue || 0),
    case_captain: draft.case_captain,
    social_history: draft.social_history,
    contraindications: draft.contraindications as unknown as string[],
    post_treatment_condition: draft.post_treatment_condition,
    next_plan: draft.next_plan,
  };
}

function statusClass(status: CrmClientStatus) {
  if (status === "Active") return "bg-green-100 text-green-700";
  if (status === "Lead") return "bg-blue-100 text-blue-700";
  if (status === "Inactive") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-700";
}

export default function CrmClientsPage() {
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [selected, setSelected] = useState<CrmClient | null>(null);
  const [draft, setDraft] = useState<DraftClient>(emptyDraft);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CrmClientStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "new">("view");
  const [error, setError] = useState("");

  const loadClients = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCrmClients({ search, status });
      setClients(data.clients);
      setStats(data.stats);
      setSelected(current => {
        if (!current) return data.clients[0] || null;
        return data.clients.find(client => client.id === current.id) || data.clients[0] || null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入 CRM 客戶失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(loadClients, 250);
    return () => window.clearTimeout(timeout);
  }, [search, status]);

  useEffect(() => {
    if (selected && mode === "view") {
      setDraft(toDraft(selected));
    }
  }, [selected, mode]);

  const allTags = useMemo(() => {
    return Array.from(new Set(clients.flatMap(client => client.tags))).slice(0, 12);
  }, [clients]);

  const startNew = () => {
    setDraft({ ...emptyDraft });
    setMode("new");
  };

  const startEdit = () => {
    if (!selected) return;
    setDraft(toDraft(selected));
    setMode("edit");
  };

  const saveClient = async () => {
    setSaving(true);
    setError("");
    try {
      const result = mode === "new"
        ? await createCrmClient(toPayload(draft))
        : selected
          ? await updateCrmClient(selected.id, toPayload(draft))
          : null;

      if (result) {
        setSelected(result.client);
        setMode("view");
        await loadClients();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存 CRM 客戶失敗");
    } finally {
      setSaving(false);
    }
  };

  const visibleClient = selected;
  const isEditing = mode === "edit" || mode === "new";

  return (
    <div className="crm-clients-page space-y-6">
      <header className="cpr-dashboard-header">
        <div>
          <h2>CRM 客戶管理</h2>
          <p>
            將 PhysioTrack CRM 併入 Admin 後台，集中管理客戶、病歷摘要、轉介收入與跟進狀態。
          </p>
        </div>
        <div className="cpr-dashboard-actions">
          <button type="button" onClick={startNew}>
            <Plus className="w-5 h-5" />
            新增客戶
          </button>
        </div>
      </header>

      {stats && (
        <section className="cpr-metric-grid">
          <Metric icon={Users} label="CRM 客戶" value={stats.total_clients.toLocaleString()} detail={`${stats.active_clients} 活躍`} />
          <Metric icon={Activity} label="平均 Vibe" value={String(stats.average_vibe_score)} detail={`${stats.lead_clients} 潛在客戶`} />
          <Metric icon={CalendarDays} label="需跟進" value={stats.needs_follow_up.toLocaleString()} detail="超過 30 日未到訪" />
          <Metric icon={DollarSign} label="轉介收入" value={currency(stats.total_referral_revenue)} detail="CRM linked value" />
        </section>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px] gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜尋姓名、電話、客戶編號、診斷..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as CrmClientStatus | "all")}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">全部狀態</option>
              <option value="Active">活躍</option>
              <option value="Lead">潛在客戶</option>
              <option value="Inactive">非活躍</option>
              <option value="Churned">已流失</option>
            </select>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {allTags.map(tag => (
                <span key={tag} className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">載入 CRM 客戶中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">客戶</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">狀態</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">診斷 / 方案</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">價值</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Vibe</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">跟進</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr
                      key={client.id}
                      onClick={() => {
                        setSelected(client);
                        setMode("view");
                      }}
                      className={`border-b border-gray-100 cursor-pointer ${visibleClient?.id === client.id ? "bg-blue-50" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold">{client.name}</div>
                        <div className="text-xs text-gray-500">{client.client_code} · {client.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${statusClass(client.status)}`}>
                          {statusLabel[client.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">{client.diagnosis || "-"}</div>
                        <div className="text-xs text-gray-500">{client.treatment_modality || "-"}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{currency(client.amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-10 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          {client.vibe_score}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>{client.last_visit_date || "-"}</div>
                        <div className="text-xs text-gray-500">{client.referred_by_partner_name || client.referred_by || "未連接 Channel Partner"}</div>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">沒有符合條件的 CRM 客戶</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="bg-white rounded-xl shadow-sm p-5 h-fit">
          {isEditing ? (
            <ClientForm
              draft={draft}
              saving={saving}
              title={mode === "new" ? "新增 CRM 客戶" : "編輯 CRM 客戶"}
              onChange={setDraft}
              onCancel={() => {
                setMode("view");
                if (selected) setDraft(toDraft(selected));
              }}
              onSave={saveClient}
            />
          ) : visibleClient ? (
            <ClientDetail client={visibleClient} onEdit={startEdit} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <UserRound className="w-10 h-10 mx-auto mb-3 opacity-50" />
              選擇或新增一位 CRM 客戶
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: string; detail: string }) {
  return (
    <article className="cpr-metric-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
      <div className="cpr-metric-icon">
        <Icon />
      </div>
    </article>
  );
}

function ClientDetail({ client, onEdit }: { client: CrmClient; onEdit: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-gray-500 font-semibold">{client.client_code}</div>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{client.name}</h3>
          <div className="mt-2">
            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${statusClass(client.status)}`}>
              {statusLabel[client.status]}
            </span>
          </div>
        </div>
        <button type="button" onClick={onEdit} className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
          <Edit3 className="w-4 h-4" />
          編輯
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Info icon={Phone} label="電話" value={client.phone || "-"} />
        <Info icon={Mail} label="電郵" value={client.email || "-"} />
        <Info icon={DollarSign} label="客戶價值" value={currency(client.amount)} />
        <Info icon={Activity} label="Vibe / 姿勢" value={`${client.vibe_score} / ${client.posture_score || "-"}`} />
      </div>

      <section className="space-y-3">
        <h4 className="font-bold flex items-center gap-2">
          <Stethoscope className="w-4 h-4" />
          臨床摘要
        </h4>
        <DetailRow label="診斷" value={client.diagnosis} />
        <DetailRow label="主訴" value={client.complaint} />
        <DetailRow label="治療方案" value={client.treatment_modality} />
        <DetailRow label="主要發現" value={client.findings} />
        <DetailRow label="下一步計劃" value={client.next_plan} />
      </section>

      <section className="space-y-3">
        <h4 className="font-bold flex items-center gap-2">
          <Users className="w-4 h-4" />
          商業連接
        </h4>
        <DetailRow label="轉介來源" value={client.referred_by_partner_name || client.referred_by} />
        <DetailRow label="轉介收入" value={currency(client.referral_revenue)} />
        <DetailRow label="分店 / Case Captain" value={`${client.branch_name || "-"} / ${client.case_captain || "-"}`} />
        <DetailRow label="預約 / 交易" value={`${client.appointment_count || 0} appointments / ${client.transaction_count || 0} transactions`} />
      </section>

      <div className="flex flex-wrap gap-2">
        {client.tags.map(tag => (
          <span key={tag} className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function ClientForm({
  draft,
  saving,
  title,
  onChange,
  onCancel,
  onSave,
}: {
  draft: DraftClient;
  saving: boolean;
  title: string;
  onChange: (draft: DraftClient) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const setField = (field: keyof DraftClient, value: string) => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold">{title}</h3>
        <button type="button" onClick={onCancel} className="p-2 bg-gray-100 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="客戶編號" value={draft.client_code} onChange={value => setField("client_code", value)} />
        <div>
          <label className="block text-xs text-gray-500 mb-1">狀態</label>
          <select value={draft.status} onChange={event => setField("status", event.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="Lead">潛在客戶</option>
            <option value="Active">活躍</option>
            <option value="Inactive">非活躍</option>
            <option value="Churned">已流失</option>
          </select>
        </div>
      </div>

      <Field label="姓名" value={draft.name} onChange={value => setField("name", value)} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="電話" value={draft.phone} onChange={value => setField("phone", value)} required />
        <Field label="電郵" value={draft.email} onChange={value => setField("email", value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="年齡" value={draft.age} onChange={value => setField("age", value)} type="number" />
        <Field label="性別" value={draft.gender} onChange={value => setField("gender", value)} />
        <Field label="Vibe" value={draft.vibe_score} onChange={value => setField("vibe_score", value)} type="number" />
      </div>
      <Field label="職業" value={draft.occupation} onChange={value => setField("occupation", value)} />
      <Field label="地址" value={draft.address} onChange={value => setField("address", value)} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="客戶價值" value={draft.amount} onChange={value => setField("amount", value)} type="number" />
        <Field label="轉介收入" value={draft.referral_revenue} onChange={value => setField("referral_revenue", value)} type="number" />
      </div>
      <Field label="轉介來源" value={draft.referred_by} onChange={value => setField("referred_by", value)} />

      <Field label="診斷" value={draft.diagnosis} onChange={value => setField("diagnosis", value)} />
      <TextArea label="主訴" value={draft.complaint} onChange={value => setField("complaint", value)} />
      <Field label="治療方案" value={draft.treatment_modality} onChange={value => setField("treatment_modality", value)} />
      <TextArea label="主要發現" value={draft.findings} onChange={value => setField("findings", value)} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="疼痛指數" value={draft.pain_level} onChange={value => setField("pain_level", value)} type="number" />
        <Field label="姿勢評分" value={draft.posture_score} onChange={value => setField("posture_score", value)} type="number" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="上次就診" value={draft.last_visit_date} onChange={value => setField("last_visit_date", value)} type="date" />
        <Field label="下次預約" value={draft.next_appointment_date} onChange={value => setField("next_appointment_date", value)} type="date" />
      </div>

      <TextArea label="症狀（用逗號分隔）" value={draft.current_symptoms} onChange={value => setField("current_symptoms", value)} />
      <TextArea label="病史（用逗號分隔）" value={draft.medical_history} onChange={value => setField("medical_history", value)} />
      <TextArea label="標籤（用逗號分隔）" value={draft.tags} onChange={value => setField("tags", value)} />
      <TextArea label="內部備註" value={draft.remarks} onChange={value => setField("remarks", value)} />
      <TextArea label="下一步計劃" value={draft.next_plan} onChange={value => setField("next_plan", value)} />

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-lg">
          取消
        </button>
        <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "儲存中..." : "儲存"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-sm font-semibold break-words">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm leading-relaxed">{value || "-"}</div>
    </div>
  );
}
