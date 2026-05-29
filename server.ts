import { Hono } from "hono";
import { cors } from "hono/cors";
import { join } from "node:path";

const app = new Hono();

// Middleware
app.use(cors());

// In-memory database for demo (replace with SQLite in production)
interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  type: "admin" | "distributor" | "sub_agent";
  distributor_id?: number;
}

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

interface CorporateClient {
  id: number;
  company_name: string;
  created_at: string;
}

interface Transaction {
  id: number;
  distributor_id: number;
  corporate_client_id: number;
  branch_id: number;
  employee_name: string;
  service_item: string;
  amount: number;
  commission_amount: number;
  transaction_date: string;
  status: "completed" | "refunded";
  created_at: string;
}

interface Branch {
  id: number;
  name: string;
  location: string;
  status: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

interface TreatmentDetail {
  modality: string;
  body_part: string;
  by: string;
}

interface CrmClient {
  id: string;
  client_code: string;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: string;
  occupation?: string;
  address?: string;
  status: "Active" | "Inactive" | "Churned" | "Lead";
  tags: string[];
  amount: number;
  diagnosis: string;
  complaint?: string;
  treatment_modality: string;
  findings: string;
  medical_history: string[];
  current_symptoms: string[];
  pain_level?: number;
  posture_score?: number;
  last_visit_date: string;
  next_appointment_date?: string;
  vibe_score: number;
  remarks: string;
  referred_by?: string;
  referred_by_partner_id?: number;
  referral_revenue: number;
  branch_id?: number;
  case_captain?: string;
  social_history?: string;
  contraindications: string[];
  post_treatment_condition?: string;
  next_plan?: string;
  treatments: TreatmentDetail[];
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

// Demo data store
const users: User[] = [
  { id: 1, email: "admin@cprphysio.hk", password: "admin123", name: "CPR Admin", type: "admin" },
  { id: 2, email: "partner1@cprphysio.hk", password: "partner123", name: "陳嘉敏 Clara Chan", type: "distributor", distributor_id: 1 },
  { id: 3, email: "partner2@cprphysio.hk", password: "partner123", name: "黃俊傑 Jason Wong", type: "sub_agent", distributor_id: 2 },
  { id: 4, email: "mei.lau@cprphysio.hk", password: "partner123", name: "劉美琪 Mei Lau", type: "distributor", distributor_id: 3 },
  { id: 5, email: "karen.yip@cprphysio.hk", password: "partner123", name: "葉凱欣 Karen Yip", type: "sub_agent", distributor_id: 5 },
  { id: 6, email: "oscar.ho@cprphysio.hk", password: "partner123", name: "何家朗 Oscar Ho", type: "distributor", distributor_id: 6 },
];

const distributors: Distributor[] = [
  { id: 1, name: "康卓企業健康顧問", type: "总代理", commission_rate: 0.12, email: "partner1@cprphysio.hk", phone: "91234567", status: "active", created_at: "2026-01-03" },
  { id: 2, name: "FitLink HR Wellness", type: "二级代理", parent_id: 1, commission_rate: 0.08, email: "partner2@cprphysio.hk", phone: "92345678", status: "active", created_at: "2026-01-18" },
  { id: 3, name: "港島運動醫療轉介", type: "总代理", commission_rate: 0.10, email: "mei.lau@cprphysio.hk", phone: "93456789", status: "active", created_at: "2026-02-02" },
  { id: 4, name: "灣區保險伙伴", type: "总代理", commission_rate: 0.09, email: "insurance@cprphysio.hk", phone: "94567890", status: "inactive", created_at: "2026-02-21" },
  { id: 5, name: "卓健中小企福利", type: "二级代理", parent_id: 3, commission_rate: 0.07, email: "karen.yip@cprphysio.hk", phone: "95678901", status: "active", created_at: "2026-03-05" },
  { id: 6, name: "MediBridge Referral", type: "总代理", commission_rate: 0.09, email: "oscar.ho@cprphysio.hk", phone: "96789012", status: "active", created_at: "2026-03-16" },
];

const branches: Branch[] = [
  { id: 1, name: "西營盤旗艦中心", location: "香港西營盤皇后大道西", status: "active" },
  { id: 2, name: "中環企業健康中心", location: "香港中環德輔道中", status: "active" },
  { id: 3, name: "尖沙咀運動復康", location: "九龍尖沙咀廣東道", status: "active" },
  { id: 4, name: "銅鑼灣女性健康", location: "香港銅鑼灣軒尼詩道", status: "active" },
  { id: 5, name: "旺角痛症治療", location: "九龍旺角彌敦道", status: "active" },
  { id: 6, name: "機場員工復康站", location: "香港國際機場員工服務大樓", status: "active" },
];

const corporateClients: CorporateClient[] = [
  { id: 1, company_name: "Cathay Ground Services", created_at: "2026-01-05" },
  { id: 2, company_name: "MTR Corporate Wellness", created_at: "2026-01-12" },
  { id: 3, company_name: "Jardine Restaurant Group", created_at: "2026-01-28" },
  { id: 4, company_name: "Harbour Logistics HK", created_at: "2026-02-03" },
  { id: 5, company_name: "Pacific Finance Centre", created_at: "2026-02-19" },
  { id: 6, company_name: "HKU SPACE Staff Club", created_at: "2026-03-01" },
  { id: 7, company_name: "Sino Retail Management", created_at: "2026-03-11" },
  { id: 8, company_name: "Island Hotels Group", created_at: "2026-03-24" },
  { id: 9, company_name: "Kowloon Tech Hub", created_at: "2026-04-02" },
  { id: 10, company_name: "BrightStart Education", created_at: "2026-04-18" },
];

const crmClients: CrmClient[] = [
  {
    id: "crm_1",
    client_code: "JP21040001",
    name: "Sarah Jenkins",
    phone: "98765432",
    email: "sarah.j@example.com",
    age: 34,
    gender: "Female",
    occupation: "Flight Attendant",
    address: "Mid-Levels, Central",
    status: "Active",
    tags: ["痛症", "肩頸", "VIP"],
    amount: 15000,
    diagnosis: "Cervical Spondylosis",
    complaint: "Neck stiffness and headaches after long-haul flights",
    treatment_modality: "Manual therapy, acupuncture, exercise",
    findings: "C5-C6 disc bulge, tight upper trapezius",
    medical_history: ["Asthma", "Previous whiplash injury"],
    current_symptoms: ["Neck stiffness", "Occasional headaches", "Right arm numbness"],
    pain_level: 6,
    posture_score: 65,
    last_visit_date: "2026-05-18",
    next_appointment_date: "2026-06-01",
    vibe_score: 95,
    remarks: "Frequent flyer, prefers morning sessions.",
    referred_by: "康卓企業健康顧問",
    referred_by_partner_id: 1,
    referral_revenue: 15000,
    branch_id: 3,
    case_captain: "Rachel T",
    social_history: "Social drinker, non-smoker",
    contraindications: ["No pregnancy", "OK acupuncture"],
    post_treatment_condition: "Improved cervical ROM",
    next_plan: "Continue manual therapy and home exercise plan",
    treatments: [{ modality: "MT", body_part: "Neck", by: "Rachel T" }],
    attachments: [],
    created_at: "2026-04-08",
    updated_at: "2026-05-18"
  },
  {
    id: "crm_2",
    client_code: "JP21040002",
    name: "Michael Wong",
    phone: "91234567",
    email: "mwong.finance@example.com",
    age: 42,
    gender: "Male",
    occupation: "Investment Banker",
    address: "Happy Valley",
    status: "Inactive",
    tags: ["運動創傷", "肩痛"],
    amount: 8500,
    diagnosis: "Rotator Cuff Tendinitis",
    complaint: "Shoulder pain when lifting arm",
    treatment_modality: "Shockwave, exercise",
    findings: "Supraspinatus tendinopathy",
    medical_history: ["Hypertension", "High cholesterol"],
    current_symptoms: ["Shoulder pain", "Weakness"],
    pain_level: 4,
    posture_score: 78,
    last_visit_date: "2026-04-20",
    vibe_score: 88,
    remarks: "Talkative, responds well to WhatsApp follow-up.",
    referred_by: "Sarah Jenkins",
    referral_revenue: 8500,
    branch_id: 2,
    case_captain: "Alan",
    social_history: "Non-smoker",
    contraindications: ["No metal implant"],
    post_treatment_condition: "Pain reduced to 2/10",
    next_plan: "Discharge if pain free",
    treatments: [{ modality: "SW", body_part: "Shoulder", by: "Alan" }],
    attachments: [],
    created_at: "2026-04-11",
    updated_at: "2026-04-20"
  },
  {
    id: "crm_3",
    client_code: "JP21040003",
    name: "Emily Chen",
    phone: "92345678",
    email: "emily.chen@example.com",
    age: 28,
    gender: "Female",
    occupation: "Software Engineer",
    address: "Kwun Tong",
    status: "Active",
    tags: ["痛症", "腰痛", "需跟進"],
    amount: 22000,
    diagnosis: "Lumbar Disc Herniation",
    complaint: "Lower back pain with left leg referral",
    treatment_modality: "Manual therapy, traction",
    findings: "L4-L5 herniation, sciatica",
    medical_history: [],
    current_symptoms: ["Lower back pain", "Radiating pain", "Sitting intolerance"],
    pain_level: 8,
    posture_score: 52,
    last_visit_date: "2026-04-12",
    next_appointment_date: "2026-06-03",
    vibe_score: 92,
    remarks: "Needs ergonomic advice for desk setup.",
    referred_by: "港島運動醫療轉介",
    referred_by_partner_id: 3,
    referral_revenue: 22000,
    branch_id: 5,
    case_captain: "Janice",
    social_history: "Long sitting hours",
    contraindications: [],
    post_treatment_condition: "Pain centralised after traction",
    next_plan: "Review neuro signs next visit",
    treatments: [{ modality: "Trac", body_part: "Lumbar", by: "Janice" }],
    attachments: [],
    created_at: "2026-04-15",
    updated_at: "2026-04-28"
  },
  {
    id: "crm_4",
    client_code: "JP21040004",
    name: "David Lee",
    phone: "93456789",
    email: "david.lee.arch@example.com",
    age: 55,
    gender: "Male",
    occupation: "Architect",
    address: "Kowloon Tong",
    status: "Active",
    tags: ["膝痛", "退化", "長期管理"],
    amount: 32000,
    diagnosis: "Knee Osteoarthritis",
    complaint: "Knee stiffness in morning and pain climbing stairs",
    treatment_modality: "Ultrasound, exercise, manual therapy",
    findings: "Medial compartment narrowing, osteophytes",
    medical_history: ["Type 2 Diabetes", "Previous meniscus tear"],
    current_symptoms: ["Morning stiffness", "Stair pain", "Swelling"],
    pain_level: 5,
    posture_score: 60,
    last_visit_date: "2026-05-10",
    next_appointment_date: "2026-06-07",
    vibe_score: 85,
    remarks: "Prefers morning appointments.",
    referral_revenue: 0,
    branch_id: 5,
    case_captain: "Chris",
    social_history: "Walks daily",
    contraindications: ["Diabetes mellitus"],
    post_treatment_condition: "Less swelling after session",
    next_plan: "Strength progression",
    treatments: [{ modality: "Ex", body_part: "Knee", by: "Chris" }],
    attachments: [],
    created_at: "2026-04-22",
    updated_at: "2026-05-10"
  },
  {
    id: "crm_5",
    client_code: "JP21040005",
    name: "Jessica Ho",
    phone: "94567890",
    email: "jessica.ho.pt@example.com",
    age: 29,
    gender: "Female",
    occupation: "Personal Trainer",
    address: "Causeway Bay",
    status: "Lead",
    tags: ["運動創傷", "復健", "高潛力"],
    amount: 45000,
    diagnosis: "ACL Reconstruction Rehab",
    complaint: "Return-to-sport rehabilitation",
    treatment_modality: "Exercise, NMES, manual therapy",
    findings: "Post-op week 12, slight quad deficit",
    medical_history: [],
    current_symptoms: ["Mild swelling", "Quad weakness"],
    pain_level: 2,
    posture_score: 88,
    last_visit_date: "2026-05-25",
    next_appointment_date: "2026-06-02",
    vibe_score: 98,
    remarks: "Highly motivated, likely package conversion.",
    referred_by: "MediBridge Referral",
    referred_by_partner_id: 6,
    referral_revenue: 45000,
    branch_id: 3,
    case_captain: "Rachel T",
    social_history: "Athletic training 4x/week",
    contraindications: [],
    post_treatment_condition: "Good tolerance",
    next_plan: "Plyometric readiness testing",
    treatments: [{ modality: "Ex", body_part: "Knee", by: "Rachel T" }],
    attachments: [],
    created_at: "2026-05-21",
    updated_at: "2026-05-25"
  },
  {
    id: "crm_6",
    client_code: "JP21040006",
    name: "Amanda Yeung",
    phone: "96789012",
    email: "amanda.y.design@example.com",
    age: 31,
    gender: "Female",
    occupation: "Graphic Designer",
    address: "Tsuen Wan",
    status: "Churned",
    tags: ["頸痛", "頭痛", "姿勢不良"],
    amount: 18500,
    diagnosis: "Tension Headaches and Cervicogenic Pain",
    complaint: "Daily headaches and neck tightness",
    treatment_modality: "Manual therapy, acupuncture, ergonomics",
    findings: "Severe forward head posture",
    medical_history: ["Migraines"],
    current_symptoms: ["Daily headaches", "Neck tightness", "Eye strain"],
    pain_level: 7,
    posture_score: 45,
    last_visit_date: "2026-03-14",
    vibe_score: 90,
    remarks: "Win-back candidate; needs ergonomic package.",
    referred_by: "卓健中小企福利",
    referred_by_partner_id: 5,
    referral_revenue: 18500,
    branch_id: 2,
    case_captain: "Alan",
    social_history: "Home office",
    contraindications: [],
    post_treatment_condition: "Temporary relief",
    next_plan: "Win-back call and posture scan review",
    treatments: [{ modality: "MT", body_part: "Neck", by: "Alan" }],
    attachments: [],
    created_at: "2026-03-01",
    updated_at: "2026-03-14"
  }
];

const transactions: Transaction[] = [
  { id: 1, distributor_id: 1, corporate_client_id: 1, branch_id: 6, employee_name: "陳大明", service_item: "機場地勤肩頸痛治療", amount: 1280, commission_amount: 154, transaction_date: "2026-02-03", status: "completed", created_at: "2026-02-03" },
  { id: 2, distributor_id: 3, corporate_client_id: 5, branch_id: 2, employee_name: "Sarah Lee", service_item: "辦公室人體工學評估", amount: 980, commission_amount: 98, transaction_date: "2026-02-07", status: "completed", created_at: "2026-02-07" },
  { id: 3, distributor_id: 1, corporate_client_id: 3, branch_id: 5, employee_name: "吳家豪", service_item: "腰背痛治療", amount: 1180, commission_amount: 142, transaction_date: "2026-02-14", status: "completed", created_at: "2026-02-14" },
  { id: 4, distributor_id: 4, corporate_client_id: 4, branch_id: 3, employee_name: "Marco Cheng", service_item: "運動創傷評估", amount: 1680, commission_amount: 151, transaction_date: "2026-02-22", status: "completed", created_at: "2026-02-22" },
  { id: 5, distributor_id: 2, corporate_client_id: 2, branch_id: 2, employee_name: "林穎怡", service_item: "企業員工復康套票", amount: 2200, commission_amount: 176, transaction_date: "2026-03-02", status: "completed", created_at: "2026-03-02" },
  { id: 6, distributor_id: 5, corporate_client_id: 6, branch_id: 1, employee_name: "何佩珊", service_item: "姿勢矯正課程", amount: 960, commission_amount: 67, transaction_date: "2026-03-06", status: "completed", created_at: "2026-03-06" },
  { id: 7, distributor_id: 6, corporate_client_id: 8, branch_id: 4, employee_name: "Emily Wong", service_item: "女性盆底肌治療", amount: 1450, commission_amount: 131, transaction_date: "2026-03-11", status: "completed", created_at: "2026-03-11" },
  { id: 8, distributor_id: 3, corporate_client_id: 7, branch_id: 5, employee_name: "曾志遠", service_item: "膝關節復康", amount: 1320, commission_amount: 132, transaction_date: "2026-03-16", status: "completed", created_at: "2026-03-16" },
  { id: 9, distributor_id: 1, corporate_client_id: 1, branch_id: 6, employee_name: "梁淑芬", service_item: "足底筋膜炎治療", amount: 880, commission_amount: 106, transaction_date: "2026-03-22", status: "completed", created_at: "2026-03-22" },
  { id: 10, distributor_id: 2, corporate_client_id: 3, branch_id: 5, employee_name: "蔡文傑", service_item: "痛症治療覆診", amount: 760, commission_amount: 61, transaction_date: "2026-03-29", status: "refunded", created_at: "2026-03-29" },
  { id: 11, distributor_id: 1, corporate_client_id: 1, branch_id: 6, employee_name: "陳偉明", service_item: "肩頸痛治療", amount: 1200, commission_amount: 144, transaction_date: "2026-04-01", status: "completed", created_at: "2026-04-01" },
  { id: 12, distributor_id: 1, corporate_client_id: 2, branch_id: 2, employee_name: "李詠欣", service_item: "企業健康評估", amount: 1800, commission_amount: 216, transaction_date: "2026-04-02", status: "completed", created_at: "2026-04-02" },
  { id: 13, distributor_id: 2, corporate_client_id: 3, branch_id: 5, employee_name: "王子軒", service_item: "腰背痛治療", amount: 980, commission_amount: 78, transaction_date: "2026-04-03", status: "completed", created_at: "2026-04-03" },
  { id: 14, distributor_id: 3, corporate_client_id: 6, branch_id: 1, employee_name: "張佩儀", service_item: "頸椎復康療程", amount: 1500, commission_amount: 150, transaction_date: "2026-04-05", status: "completed", created_at: "2026-04-05" },
  { id: 15, distributor_id: 5, corporate_client_id: 9, branch_id: 3, employee_name: "Kelvin Lam", service_item: "運動專科評估", amount: 1680, commission_amount: 118, transaction_date: "2026-04-06", status: "completed", created_at: "2026-04-06" },
  { id: 16, distributor_id: 6, corporate_client_id: 8, branch_id: 4, employee_name: "陳慧敏", service_item: "女性健康物理治療", amount: 1320, commission_amount: 119, transaction_date: "2026-04-08", status: "completed", created_at: "2026-04-08" },
  { id: 17, distributor_id: 1, corporate_client_id: 4, branch_id: 3, employee_name: "Michael Ho", service_item: "運動創傷治療", amount: 2100, commission_amount: 252, transaction_date: "2026-04-10", status: "completed", created_at: "2026-04-10" },
  { id: 18, distributor_id: 3, corporate_client_id: 5, branch_id: 2, employee_name: "周美玲", service_item: "姿勢矯正課程", amount: 880, commission_amount: 88, transaction_date: "2026-04-12", status: "completed", created_at: "2026-04-12" },
  { id: 19, distributor_id: 2, corporate_client_id: 2, branch_id: 2, employee_name: "郭俊熙", service_item: "肩周炎治療", amount: 1180, commission_amount: 94, transaction_date: "2026-04-14", status: "completed", created_at: "2026-04-14" },
  { id: 20, distributor_id: 5, corporate_client_id: 10, branch_id: 4, employee_name: "何嘉欣", service_item: "產後復康評估", amount: 1480, commission_amount: 104, transaction_date: "2026-04-16", status: "completed", created_at: "2026-04-16" },
  { id: 21, distributor_id: 1, corporate_client_id: 7, branch_id: 5, employee_name: "黃國強", service_item: "痛症治療套票", amount: 2600, commission_amount: 312, transaction_date: "2026-04-18", status: "completed", created_at: "2026-04-18" },
  { id: 22, distributor_id: 6, corporate_client_id: 9, branch_id: 3, employee_name: "Anson Yu", service_item: "跑步姿勢分析", amount: 980, commission_amount: 88, transaction_date: "2026-04-20", status: "completed", created_at: "2026-04-20" },
  { id: 23, distributor_id: 3, corporate_client_id: 6, branch_id: 1, employee_name: "梁詠詩", service_item: "脊椎側彎評估", amount: 1260, commission_amount: 126, transaction_date: "2026-04-22", status: "completed", created_at: "2026-04-22" },
  { id: 24, distributor_id: 2, corporate_client_id: 3, branch_id: 5, employee_name: "鄭志明", service_item: "膝關節復康", amount: 1380, commission_amount: 110, transaction_date: "2026-04-23", status: "refunded", created_at: "2026-04-23" },
  { id: 25, distributor_id: 1, corporate_client_id: 1, branch_id: 6, employee_name: "Nina Cheng", service_item: "員工復康覆診", amount: 820, commission_amount: 98, transaction_date: "2026-04-24", status: "completed", created_at: "2026-04-24" },
  { id: 26, distributor_id: 4, corporate_client_id: 4, branch_id: 3, employee_name: "馮浩然", service_item: "工傷復康評估", amount: 1750, commission_amount: 158, transaction_date: "2026-04-26", status: "completed", created_at: "2026-04-26" },
  { id: 27, distributor_id: 3, corporate_client_id: 5, branch_id: 2, employee_name: "許嘉琳", service_item: "辦公室痛症治療", amount: 920, commission_amount: 92, transaction_date: "2026-04-28", status: "completed", created_at: "2026-04-28" },
  { id: 28, distributor_id: 6, corporate_client_id: 8, branch_id: 4, employee_name: "Yuki Tam", service_item: "女性健康覆診", amount: 760, commission_amount: 68, transaction_date: "2026-04-30", status: "completed", created_at: "2026-04-30" },
  { id: 29, distributor_id: 1, corporate_client_id: 2, branch_id: 2, employee_name: "何俊傑", service_item: "企業健康講座", amount: 3200, commission_amount: 384, transaction_date: "2026-05-03", status: "completed", created_at: "2026-05-03" },
  { id: 30, distributor_id: 3, corporate_client_id: 6, branch_id: 1, employee_name: "陳曉彤", service_item: "頸椎復康覆診", amount: 860, commission_amount: 86, transaction_date: "2026-05-06", status: "completed", created_at: "2026-05-06" },
  { id: 31, distributor_id: 2, corporate_client_id: 9, branch_id: 3, employee_name: "Brian Ng", service_item: "運動創傷治療", amount: 1580, commission_amount: 126, transaction_date: "2026-05-09", status: "completed", created_at: "2026-05-09" },
  { id: 32, distributor_id: 5, corporate_client_id: 10, branch_id: 4, employee_name: "林雅雯", service_item: "產後復康療程", amount: 2400, commission_amount: 168, transaction_date: "2026-05-12", status: "completed", created_at: "2026-05-12" },
  { id: 33, distributor_id: 6, corporate_client_id: 8, branch_id: 4, employee_name: "Grace Lau", service_item: "盆底肌治療覆診", amount: 820, commission_amount: 74, transaction_date: "2026-05-15", status: "completed", created_at: "2026-05-15" },
  { id: 34, distributor_id: 1, corporate_client_id: 7, branch_id: 5, employee_name: "羅文浩", service_item: "痛症治療覆診", amount: 760, commission_amount: 91, transaction_date: "2026-05-18", status: "completed", created_at: "2026-05-18" },
  { id: 35, distributor_id: 3, corporate_client_id: 5, branch_id: 2, employee_name: "梁凱琪", service_item: "姿勢矯正覆診", amount: 780, commission_amount: 78, transaction_date: "2026-05-21", status: "completed", created_at: "2026-05-21" },
  { id: 36, distributor_id: 2, corporate_client_id: 3, branch_id: 5, employee_name: "鍾志豪", service_item: "腰背痛覆診", amount: 720, commission_amount: 58, transaction_date: "2026-05-25", status: "completed", created_at: "2026-05-25" },
];

// Auth middleware
const auth = (c: any, next: () => Promise<void>) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = header.slice(7);
  let user = users.find(u => (u as any)._token === token);
  if (!user) {
    const [id] = Buffer.from(token, "base64").toString("utf8").split(":");
    user = users.find(u => u.id === Number(id));
  }
  if (!user) {
    return c.json({ error: "Invalid token" }, 401);
  }
  (c as any).user = user;
  return next();
};

// ============ AUTH ROUTES ============

app.post("/api/auth/login", async (c) => {
  const { email, password } = await c.req.json();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  
  // Generate simple token (in production, use JWT)
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");
  (user as any)._token = token;
  
  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, type: user.type, distributor_id: user.distributor_id }
  });
});

// ============ DISTRIBUTOR ROUTES ============

// Get distributor info
app.get("/api/distributor/:id", auth, async (c) => {
  const id = parseInt(c.req.param("id"));
  const distributor = distributors.find(d => d.id === id);
  if (!distributor) {
    return c.json({ error: "Distributor not found" }, 404);
  }
  return c.json(distributor);
});

// Get commission summary
app.get("/api/distributor/:id/commissions", auth, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = (c as any).user as User;
  
  // Filter transactions based on user type
  let filteredTransactions = transactions.filter(t => {
    if (user.type === "admin") return true;
    if (user.type === "distributor") return t.distributor_id === id;
    if (user.type === "sub_agent") return t.distributor_id === id;
    return false;
  });

  // Calculate commissions by branch
  const byBranch = branches.map(branch => {
    const branchTx = filteredTransactions.filter(t => t.branch_id === branch.id && t.status === "completed");
    return {
      branch_id: branch.id,
      branch_name: branch.name,
      total_amount: branchTx.reduce((sum, t) => sum + t.amount, 0),
      total_commission: branchTx.reduce((sum, t) => sum + t.commission_amount, 0),
      transaction_count: branchTx.length
    };
  });

  // Calculate commissions by corporate client
  const byCorporate = corporateClients.map(client => {
    const clientTx = filteredTransactions.filter(t => t.corporate_client_id === client.id && t.status === "completed");
    return {
      client_id: client.id,
      company_name: client.company_name,
      total_amount: clientTx.reduce((sum, t) => sum + t.amount, 0),
      total_commission: clientTx.reduce((sum, t) => sum + t.commission_amount, 0),
      transaction_count: clientTx.length
    };
  });

  // Monthly summary
  const monthlyTx = filteredTransactions.filter(t => t.status === "completed");
  const totalCommission = monthlyTx.reduce((sum, t) => sum + t.commission_amount, 0);
  const totalAmount = monthlyTx.reduce((sum, t) => sum + t.amount, 0);

  return c.json({
    total_commission: totalCommission,
    total_amount: totalAmount,
    transaction_count: monthlyTx.length,
    by_branch: byBranch,
    by_corporate: byCorporate
  });
});

// Get transaction list
app.get("/api/distributor/:id/transactions", auth, async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = (c as any).user as User;
  const { month, client_id, branch_id } = c.req.query();

  let filtered = transactions.filter(t => {
    if (user.type === "admin") return true;
    return t.distributor_id === id;
  });

  if (month) {
    filtered = filtered.filter(t => t.transaction_date.startsWith(month));
  }
  if (client_id) {
    filtered = filtered.filter(t => t.corporate_client_id === parseInt(client_id));
  }
  if (branch_id) {
    filtered = filtered.filter(t => t.branch_id === parseInt(branch_id));
  }

  // Enrich with related data
  const enriched = filtered.map(t => ({
    ...t,
    branch_name: branches.find(b => b.id === t.branch_id)?.name || "",
    company_name: corporateClients.find(c => c.id === t.corporate_client_id)?.company_name || "",
    distributor_name: distributors.find(d => d.id === t.distributor_id)?.name || ""
  }));

  return c.json({ transactions: enriched });
});

// ============ ADMIN ROUTES ============

// Get all distributors
app.get("/api/admin/distributors", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }
  return c.json({ distributors });
});

// Create distributor
app.post("/api/admin/distributors", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }
  
  const data = await c.req.json();
  const newDistributor: Distributor = {
    id: distributors.length + 1,
    name: data.name,
    type: data.type,
    parent_id: data.parent_id ? parseInt(data.parent_id) : undefined,
    commission_rate: Number(data.commission_rate),
    email: data.email,
    phone: data.phone,
    status: "active",
    created_at: new Date().toISOString().split("T")[0]
  };
  
  distributors.push(newDistributor);
  
  // Create user account
  const newUser: User = {
    id: users.length + 1,
    email: data.email,
    password: data.password || "default123",
    name: data.name,
    type: data.type === "总代理" ? "distributor" : "sub_agent",
    distributor_id: newDistributor.id
  };
  users.push(newUser);
  
  return c.json({ success: true, distributor: newDistributor }, 201);
});

// Get all transactions (admin view)
app.get("/api/admin/transactions", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }
  const { month, distributor_id, client_id, branch_id, status } = c.req.query();
  
  let filtered = [...transactions];

  if (month) {
    filtered = filtered.filter(t => t.transaction_date.startsWith(month));
  }
  if (distributor_id) {
    filtered = filtered.filter(t => t.distributor_id === parseInt(distributor_id));
  }
  if (client_id) {
    filtered = filtered.filter(t => t.corporate_client_id === parseInt(client_id));
  }
  if (branch_id) {
    filtered = filtered.filter(t => t.branch_id === parseInt(branch_id));
  }
  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }

  const enriched = filtered.map(t => ({
    ...t,
    branch_name: branches.find(b => b.id === t.branch_id)?.name || "",
    company_name: corporateClients.find(c => c.id === t.corporate_client_id)?.company_name || "",
    distributor_name: distributors.find(d => d.id === t.distributor_id)?.name || ""
  }));
  
  return c.json({ transactions: enriched });
});

// Create transaction
app.post("/api/admin/transactions", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }
  
  const data = await c.req.json();
  
  const amount = Number(data.amount);
  const distributor = distributors.find(d => d.id === Number(data.distributor_id));
  const commissionRate = distributor?.commission_rate ?? 0.10;
  const commissionAmount = amount * commissionRate;
  
  const newTransaction: Transaction = {
    id: transactions.length + 1,
    distributor_id: Number(data.distributor_id),
    corporate_client_id: Number(data.corporate_client_id),
    branch_id: Number(data.branch_id),
    employee_name: data.employee_name,
    service_item: data.service_item,
    amount,
    commission_amount: commissionAmount,
    transaction_date: data.transaction_date,
    status: "completed",
    created_at: new Date().toISOString().split("T")[0]
  };
  
  transactions.push(newTransaction);
  
  return c.json({ success: true, transaction: newTransaction }, 201);
});

// Get branches
app.get("/api/branches", auth, async (c) => {
  return c.json({ branches });
});

// Get corporate clients
app.get("/api/corporate-clients", auth, async (c) => {
  return c.json({ corporate_clients: corporateClients });
});

// ============ CRM ADMIN ROUTES ============

const validCrmStatuses = ["Active", "Inactive", "Churned", "Lead"] as const;

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map(item => item.trim()).filter(Boolean);
  }
  return [];
};

const enrichCrmClient = (client: CrmClient) => {
  const linkedAppointments = appointments.filter(appt =>
    appt.employee_phone === client.phone || appt.employee_name === client.name
  );
  const linkedTransactions = transactions.filter(tx => tx.employee_name === client.name);
  const partner = client.referred_by_partner_id
    ? distributors.find(d => d.id === client.referred_by_partner_id)
    : undefined;

  return {
    ...client,
    branch_name: client.branch_id ? branches.find(b => b.id === client.branch_id)?.name || "" : "",
    referred_by_partner_name: partner?.name || client.referred_by || "",
    appointment_count: linkedAppointments.length,
    transaction_count: linkedTransactions.length,
    linked_revenue: linkedTransactions
      .filter(tx => tx.status === "completed")
      .reduce((sum, tx) => sum + tx.amount, 0)
  };
};

const buildCrmStats = (clientList: CrmClient[]) => {
  const now = new Date();
  const needsFollowUp = clientList.filter(client => {
    if (client.status !== "Active") return false;
    const lastVisit = new Date(client.last_visit_date);
    const diffDays = (now.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24);
    return diffDays > 30;
  }).length;

  return {
    total_clients: clientList.length,
    active_clients: clientList.filter(client => client.status === "Active").length,
    lead_clients: clientList.filter(client => client.status === "Lead").length,
    needs_follow_up: needsFollowUp,
    total_client_value: clientList.reduce((sum, client) => sum + client.amount, 0),
    total_referral_revenue: clientList.reduce((sum, client) => sum + client.referral_revenue, 0),
    average_vibe_score: Math.round(clientList.reduce((sum, client) => sum + client.vibe_score, 0) / Math.max(clientList.length, 1))
  };
};

app.get("/api/admin/crm/clients", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }

  const { search, status, tag, partner_id } = c.req.query();
  let filtered = [...crmClients];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(client =>
      client.name.toLowerCase().includes(q) ||
      client.phone.includes(q) ||
      client.client_code.toLowerCase().includes(q) ||
      (client.email || "").toLowerCase().includes(q) ||
      client.diagnosis.toLowerCase().includes(q)
    );
  }

  if (status && validCrmStatuses.includes(status as any)) {
    filtered = filtered.filter(client => client.status === status);
  }

  if (tag) {
    filtered = filtered.filter(client => client.tags.some(item => item.toLowerCase() === tag.toLowerCase()));
  }

  if (partner_id) {
    filtered = filtered.filter(client => client.referred_by_partner_id === Number(partner_id));
  }

  return c.json({
    clients: filtered.map(enrichCrmClient),
    stats: buildCrmStats(crmClients)
  });
});

app.get("/api/admin/crm/clients/:id", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }

  const client = crmClients.find(item => item.id === c.req.param("id"));
  if (!client) {
    return c.json({ error: "CRM client not found" }, 404);
  }

  return c.json({ client: enrichCrmClient(client) });
});

app.post("/api/admin/crm/clients", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }

  const data = await c.req.json();
  const now = new Date().toISOString().split("T")[0];
  const status = validCrmStatuses.includes(data.status) ? data.status : "Lead";
  const newClient: CrmClient = {
    id: `crm_${Date.now()}`,
    client_code: data.client_code || `CRM${String(crmClients.length + 1).padStart(5, "0")}`,
    name: data.name || "New Client",
    phone: data.phone || "",
    email: data.email || "",
    age: data.age ? Number(data.age) : undefined,
    gender: data.gender || "",
    occupation: data.occupation || "",
    address: data.address || "",
    status,
    tags: normalizeStringArray(data.tags),
    amount: Number(data.amount || 0),
    diagnosis: data.diagnosis || "",
    complaint: data.complaint || "",
    treatment_modality: data.treatment_modality || "",
    findings: data.findings || "",
    medical_history: normalizeStringArray(data.medical_history),
    current_symptoms: normalizeStringArray(data.current_symptoms),
    pain_level: data.pain_level ? Number(data.pain_level) : undefined,
    posture_score: data.posture_score ? Number(data.posture_score) : undefined,
    last_visit_date: data.last_visit_date || now,
    next_appointment_date: data.next_appointment_date || "",
    vibe_score: Number(data.vibe_score || 50),
    remarks: data.remarks || "",
    referred_by: data.referred_by || "",
    referred_by_partner_id: data.referred_by_partner_id ? Number(data.referred_by_partner_id) : undefined,
    referral_revenue: Number(data.referral_revenue || 0),
    branch_id: data.branch_id ? Number(data.branch_id) : undefined,
    case_captain: data.case_captain || "",
    social_history: data.social_history || "",
    contraindications: normalizeStringArray(data.contraindications),
    post_treatment_condition: data.post_treatment_condition || "",
    next_plan: data.next_plan || "",
    treatments: Array.isArray(data.treatments) ? data.treatments : [],
    attachments: [],
    created_at: now,
    updated_at: now
  };

  crmClients.unshift(newClient);
  return c.json({ success: true, client: enrichCrmClient(newClient) }, 201);
});

app.put("/api/admin/crm/clients/:id", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }

  const index = crmClients.findIndex(item => item.id === c.req.param("id"));
  if (index === -1) {
    return c.json({ error: "CRM client not found" }, 404);
  }

  const data = await c.req.json();
  const current = crmClients[index];
  const updated: CrmClient = {
    ...current,
    ...data,
    age: data.age === "" || data.age === undefined ? current.age : Number(data.age),
    amount: data.amount === undefined ? current.amount : Number(data.amount),
    pain_level: data.pain_level === "" || data.pain_level === undefined ? undefined : Number(data.pain_level),
    posture_score: data.posture_score === "" || data.posture_score === undefined ? undefined : Number(data.posture_score),
    vibe_score: data.vibe_score === undefined ? current.vibe_score : Number(data.vibe_score),
    referral_revenue: data.referral_revenue === undefined ? current.referral_revenue : Number(data.referral_revenue),
    referred_by_partner_id: data.referred_by_partner_id ? Number(data.referred_by_partner_id) : undefined,
    branch_id: data.branch_id ? Number(data.branch_id) : undefined,
    tags: data.tags === undefined ? current.tags : normalizeStringArray(data.tags),
    medical_history: data.medical_history === undefined ? current.medical_history : normalizeStringArray(data.medical_history),
    current_symptoms: data.current_symptoms === undefined ? current.current_symptoms : normalizeStringArray(data.current_symptoms),
    contraindications: data.contraindications === undefined ? current.contraindications : normalizeStringArray(data.contraindications),
    status: validCrmStatuses.includes(data.status) ? data.status : current.status,
    treatments: Array.isArray(data.treatments) ? data.treatments : current.treatments,
    attachments: Array.isArray(data.attachments) ? data.attachments : current.attachments,
    updated_at: new Date().toISOString().split("T")[0]
  };

  crmClients[index] = updated;
  return c.json({ success: true, client: enrichCrmClient(updated) });
});

app.get("/api/admin/crm/lead-engine", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }

  const { perspective = "high-vibe" } = c.req.query();
  const now = new Date();
  let result = [...crmClients];

  if (perspective === "needs-followup") {
    result = result.filter(client => {
      if (client.status !== "Active") return false;
      const lastVisit = new Date(client.last_visit_date);
      const diffDays = (now.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24);
      return diffDays > 30;
    }).sort((a, b) => new Date(a.last_visit_date).getTime() - new Date(b.last_visit_date).getTime());
  } else if (perspective === "recent-leads") {
    result = result.filter(client => client.status === "Lead")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (perspective === "churned") {
    result = result.filter(client => client.status === "Churned")
      .sort((a, b) => b.amount - a.amount);
  } else if (perspective === "high-referral") {
    result = result.filter(client => client.referral_revenue > 0)
      .sort((a, b) => b.referral_revenue - a.referral_revenue);
  } else {
    result = result.sort((a, b) => b.vibe_score - a.vibe_score).slice(0, 10);
  }

  return c.json({ clients: result.map(enrichCrmClient) });
});

// Get admin dashboard stats
app.get("/api/admin/stats", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }
  
  const completedTx = transactions.filter(t => t.status === "completed");
  const totalCommission = completedTx.reduce((sum, t) => sum + t.commission_amount, 0);
  const totalAmount = completedTx.reduce((sum, t) => sum + t.amount, 0);
  
  return c.json({
    total_transactions: transactions.length,
    completed_transactions: completedTx.length,
    total_revenue: totalAmount,
    total_commission_paid: totalCommission,
    active_distributors: distributors.filter(d => d.status === "active").length,
    crm: buildCrmStats(crmClients),
    by_branch: branches.map(b => ({
      branch_name: b.name,
      transaction_count: completedTx.filter(t => t.branch_id === b.id).length,
      revenue: completedTx.filter(t => t.branch_id === b.id).reduce((sum, t) => sum + t.amount, 0)
    }))
  });
});

// ============ IMPORT ROUTES ============

interface ImportRow {
  distributor_id: string;
  corporate_client_id: string;
  branch_id: string;
  employee_name: string;
  service_item: string;
  amount: string;
  transaction_date: string;
}

app.post("/api/admin/import", auth, async (c) => {
  const user = (c as any).user as User;
  if (user.type !== "admin") {
    return c.json({ error: "Admin only" }, 403);
  }

  const { rows } = await c.req.json() as { rows: ImportRow[] };

  const result = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string }>
  };

  rows.forEach((row, index) => {
    try {
      const amount = parseFloat(row.amount);
      const distributorId = parseInt(row.distributor_id);
      const corporateClientId = parseInt(row.corporate_client_id);
      const branchId = parseInt(row.branch_id);

      if (isNaN(amount) || amount <= 0) {
        result.errors.push({ row: index + 1, error: "Invalid amount" });
        result.failed++;
        return;
      }
      if (!distributors.some(d => d.id === distributorId)) {
        result.errors.push({ row: index + 1, error: "Invalid channel partner ID" });
        result.failed++;
        return;
      }
      if (!corporateClients.some(client => client.id === corporateClientId)) {
        result.errors.push({ row: index + 1, error: "Invalid corporate client ID" });
        result.failed++;
        return;
      }
      if (!branches.some(branch => branch.id === branchId)) {
        result.errors.push({ row: index + 1, error: "Invalid branch ID" });
        result.failed++;
        return;
      }
      if (!row.employee_name || !row.service_item || !row.transaction_date) {
        result.errors.push({ row: index + 1, error: "Missing required fields" });
        result.failed++;
        return;
      }

      const distributor = distributors.find(d => d.id === distributorId);

      const newTransaction: Transaction = {
        id: transactions.length + 1,
        distributor_id: distributorId,
        corporate_client_id: corporateClientId,
        branch_id: branchId,
        employee_name: row.employee_name,
        service_item: row.service_item,
        amount: amount,
        commission_amount: amount * (distributor?.commission_rate ?? 0.10),
        transaction_date: row.transaction_date,
        status: "completed",
        created_at: new Date().toISOString().split("T")[0]
      };

      transactions.push(newTransaction);
      result.success++;
    } catch (e) {
      result.errors.push({ row: index + 1, error: String(e) });
      result.failed++;
    }
  });

  return c.json(result);
});

// ============ APPOINTMENT ROUTES ============

interface Appointment {
  id: string;
  branch_id: number;
  corporate_client_id: number;
  employee_name: string;
  employee_phone: string;
  service_item: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string;
}

const appointments: Appointment[] = [
  { id: "1", branch_id: 2, corporate_client_id: 2, employee_name: "何俊傑", employee_phone: "61234567", service_item: "企業健康講座後評估", appointment_date: "2026-05-27", appointment_time: "09:30", status: "confirmed", notes: "MTR HR team arranged follow-up for office posture screening." },
  { id: "2", branch_id: 4, corporate_client_id: 10, employee_name: "林雅雯", employee_phone: "62345678", service_item: "產後復康療程", appointment_date: "2026-05-27", appointment_time: "11:00", status: "confirmed", notes: "Preferred female therapist; bring previous ultrasound report." },
  { id: "3", branch_id: 6, corporate_client_id: 1, employee_name: "Nina Cheng", employee_phone: "63456789", service_item: "員工復康覆診", appointment_date: "2026-05-28", appointment_time: "10:30", status: "pending", notes: "Shift worker, may arrive 10 minutes early." },
  { id: "4", branch_id: 3, corporate_client_id: 9, employee_name: "Brian Ng", employee_phone: "64567890", service_item: "運動創傷治療", appointment_date: "2026-05-28", appointment_time: "15:00", status: "confirmed", notes: "Basketball ankle injury follow-up." },
  { id: "5", branch_id: 5, corporate_client_id: 7, employee_name: "羅文浩", employee_phone: "65678901", service_item: "痛症治療覆診", appointment_date: "2026-05-29", appointment_time: "14:30", status: "confirmed", notes: "Retail floor staff, lower back pain after long shifts." },
  { id: "6", branch_id: 1, corporate_client_id: 6, employee_name: "陳曉彤", employee_phone: "66789012", service_item: "頸椎復康覆診", appointment_date: "2026-05-30", appointment_time: "12:00", status: "completed", notes: "Completed morning session; next visit to be booked in two weeks." },
  { id: "7", branch_id: 4, corporate_client_id: 8, employee_name: "Grace Lau", employee_phone: "67890123", service_item: "盆底肌治療覆診", appointment_date: "2026-06-01", appointment_time: "16:00", status: "pending", notes: "Hotel group staff medical benefit claim." },
  { id: "8", branch_id: 2, corporate_client_id: 5, employee_name: "梁凱琪", employee_phone: "68901234", service_item: "姿勢矯正覆診", appointment_date: "2026-06-02", appointment_time: "10:00", status: "confirmed", notes: "Finance desk worker; request ergonomic checklist after session." },
  { id: "9", branch_id: 3, corporate_client_id: 4, employee_name: "馮浩然", employee_phone: "69012345", service_item: "工傷復康評估", appointment_date: "2026-06-03", appointment_time: "15:30", status: "pending", notes: "Insurance partner referral, claim number pending." },
  { id: "10", branch_id: 5, corporate_client_id: 3, employee_name: "鍾志豪", employee_phone: "60123456", service_item: "腰背痛覆診", appointment_date: "2026-06-04", appointment_time: "18:00", status: "confirmed", notes: "After-work slot requested." },
  { id: "11", branch_id: 1, corporate_client_id: 6, employee_name: "張佩儀", employee_phone: "61239876", service_item: "脊椎側彎評估", appointment_date: "2026-06-05", appointment_time: "09:00", status: "cancelled", notes: "Client rescheduled due to exam timetable." },
  { id: "12", branch_id: 6, corporate_client_id: 1, employee_name: "梁淑芬", employee_phone: "62348765", service_item: "足底筋膜炎治療", appointment_date: "2026-06-06", appointment_time: "13:00", status: "confirmed", notes: "Airport staff badge required for clinic access." },
];

// Get appointments
app.get("/api/appointments", auth, async (c) => {
  const { branch_id, date } = c.req.query();
  let filtered = appointments;

  if (branch_id) {
    filtered = filtered.filter(a => a.branch_id === parseInt(branch_id));
  }
  if (date) {
    filtered = filtered.filter(a => a.appointment_date === date);
  }

  const enriched = filtered.map(a => ({
    ...a,
    branch_name: branches.find(b => b.id === a.branch_id)?.name || "",
    company_name: corporateClients.find(c => c.id === a.corporate_client_id)?.company_name || ""
  }));

  return c.json({ appointments: enriched });
});

// Create appointment
app.post("/api/appointments", auth, async (c) => {
  const data = await c.req.json();

  const newAppointment: Appointment = {
    id: String(Date.now()),
    branch_id: Number(data.branch_id),
    corporate_client_id: Number(data.corporate_client_id),
    employee_name: data.employee_name,
    employee_phone: data.employee_phone,
    service_item: data.service_item,
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    status: "pending",
    notes: data.notes || ""
  };

  appointments.push(newAppointment);

  const start = new Date(`${newAppointment.appointment_date}T${newAppointment.appointment_time}:00+08:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  
  // Return both the appointment and a flag to trigger Google Calendar sync
  return c.json({ 
    success: true, 
    appointment: newAppointment,
    needs_calendar_sync: true,
    calendar_event_details: {
      summary: `CPR Physio 預約 - ${newAppointment.employee_name}`,
      description: `服務：${newAppointment.service_item}\n分店：${branches.find(b => b.id === newAppointment.branch_id)?.name || ""}\n公司：${corporateClients.find(c => c.id === newAppointment.corporate_client_id)?.company_name || ""}`,
      start: `${newAppointment.appointment_date}T${newAppointment.appointment_time}:00+08:00`,
      end: end.toISOString(),
    }
  }, 201);
});

// Update appointment
app.put("/api/appointments/:id", auth, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();
  const index = appointments.findIndex(a => a.id === id);

  if (index === -1) {
    return c.json({ error: "Appointment not found" }, 404);
  }

  appointments[index] = { ...appointments[index], ...data };
  return c.json({ success: true, appointment: appointments[index] });
});

// ============ GOOGLE CALENDAR PROXY ROUTES ============
// These routes proxy Google Calendar API calls from the frontend

// Get events from Google Calendar
app.get("/api/google-calendar/events", auth, async (c) => {
  const user = (c as any).user as User;
  const { timeMin, timeMax, maxResults } = c.req.query();
  
  // For demo, return mock events if no real calendar
  // In production, this would call Google Calendar API
  const mockEvents = [
    { id: "1", summary: "CPR 預約 - 陳大明", start: { dateTime: "2026-04-13T10:00:00+08:00" }, end: { dateTime: "2026-04-13T11:00:00+08:00" }, status: "confirmed" },
    { id: "2", summary: "CPR 預約 - 李小姐", start: { dateTime: "2026-04-14T14:00:00+08:00" }, end: { dateTime: "2026-04-14T15:00:00+08:00" }, status: "confirmed" },
  ];
  
  return c.json({ events: mockEvents });
});

// Create event in Google Calendar
app.post("/api/google-calendar/events", auth, async (c) => {
  const user = (c as any).user as User;
  const data = await c.req.json();
  
  // In production, this would create a real Google Calendar event
  // For now, return mock success response
  const newEvent = {
    id: `mock_${Date.now()}`,
    summary: data.summary || "CPR Physio 預約",
    start: data.start,
    end: data.end,
    status: "confirmed"
  };
  
  return c.json({ success: true, event: newEvent }, 201);
});

// Update Google Calendar event
app.put("/api/google-calendar/events/:id", auth, async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();
  
  // In production, this would update a real Google Calendar event
  const updatedEvent = {
    id,
    ...data,
    status: "confirmed"
  };
  
  return c.json({ success: true, event: updatedEvent });
});

// Delete Google Calendar event
app.delete("/api/google-calendar/events/:id", auth, async (c) => {
  const id = c.req.param("id");
  // In production, this would delete a real Google Calendar event
  return c.json({ success: true });
});

// Fix for Cloudflare caching old index.html - redirect /src/main.tsx to assets
app.get("/src/main.tsx", (c) => {
  return c.redirect("/assets/index-DaI9Jj9t.js", 302);
});

app.get("/src/styles.css", (c) => {
  return c.redirect("/assets/index-C7EjixMT.css", 302);
});

// ============ STATIC FILE SERVING ============
const isProduction = process.env.NODE_ENV === "production";
const staticRoot = isProduction 
  ? join(process.cwd(), "dist") 
  : join(process.cwd(), "src", "pages");

// Serve static files from correct directory based on environment
app.get("*", async (c) => {
  const path = c.req.path;
  
  // Skip API routes
  if (path.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  
  // Try to serve the file
  let filePath = path === "/" ? "/index.html" : path;
  
  // For SPA, serve index.html for non-file routes
  const fullPath = join(staticRoot, filePath);
  
  try {
    const file = Bun.file(fullPath);
    if (await file.exists()) {
      const ext = filePath.split(".").pop() || "";
      const contentTypes: Record<string, string> = {
        html: "text/html",
        js: "application/javascript",
        css: "text/css",
        json: "application/json",
        png: "image/png",
        jpg: "image/jpeg",
        svg: "image/svg+xml",
      };
      return new Response(file, {
        headers: { "Content-Type": contentTypes[ext] || "text/plain" }
      });
    }
  } catch (e) {
    // File not found, continue to index.html
  }
  
  // Fallback to index.html for SPA routing
  const indexPath = join(staticRoot, "index.html");
  const indexFile = Bun.file(indexPath);
  if (await indexFile.exists()) {
    return new Response(indexFile, {
      headers: { "Content-Type": "text/html" }
    });
  }
  
  return c.json({ error: "Not found" }, 404);
});

export default app;
