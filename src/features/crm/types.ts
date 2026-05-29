export type CrmClientStatus = "Active" | "Inactive" | "Churned" | "Lead";

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface TreatmentDetail {
  modality: string;
  body_part: string;
  by: string;
}

export interface CrmClient {
  id: string;
  client_code: string;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: string;
  occupation?: string;
  address?: string;
  status: CrmClientStatus;
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
  referred_by_partner_name?: string;
  referral_revenue: number;
  branch_id?: number;
  branch_name?: string;
  case_captain?: string;
  social_history?: string;
  contraindications: string[];
  post_treatment_condition?: string;
  next_plan?: string;
  treatments: TreatmentDetail[];
  attachments: Attachment[];
  appointment_count?: number;
  transaction_count?: number;
  linked_revenue?: number;
  created_at: string;
  updated_at: string;
}

export interface CrmStats {
  total_clients: number;
  active_clients: number;
  lead_clients: number;
  needs_follow_up: number;
  total_client_value: number;
  total_referral_revenue: number;
  average_vibe_score: number;
}

export type CrmClientForm = Partial<Omit<CrmClient, "id" | "created_at" | "updated_at">> & {
  id?: string;
};
