import { Database } from "bun:sqlite";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bearerAuth } from "hono/bearer-auth";
import { serveStatic } from "hono/bun";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const app = new Hono();

// Middleware
app.use(cors());
app.use(typeof Bun !== "undefined" ? serveStatic({ root: "./src/pages" }) : (async (c) => c.next()));

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

// Demo data store
const users: User[] = [
  { id: 1, email: "admin@cprphysio.hk", password: "admin123", name: "CPR Admin", type: "admin" },
  { id: 2, email: "agent1@cprphysio.hk", password: "agent123", name: "總代理A", type: "distributor", distributor_id: 1 },
  { id: 3, email: "agent2@cprphysio.hk", password: "agent123", name: "二級代理B", type: "sub_agent", distributor_id: 2 },
];

const distributors: Distributor[] = [
  { id: 1, name: "總代理A", type: "总代理", commission_rate: 0.10, email: "agent1@cprphysio.hk", phone: "91234567", status: "active", created_at: "2026-01-01" },
  { id: 2, name: "二級代理B", type: "二级代理", parent_id: 1, commission_rate: 0.10, email: "agent2@cprphysio.hk", phone: "92345678", status: "active", created_at: "2026-01-15" },
];

const branches: Branch[] = [
  { id: 1, name: "西環總店", location: "香港西環", status: "active" },
  { id: 2, name: "旺角分店", location: "九龍旺角", status: "active" },
  { id: 3, name: "尖沙咀", location: "九龍尖沙咀", status: "active" },
  { id: 4, name: "機場", location: "香港國際機場", status: "active" },
];

const corporateClients: CorporateClient[] = [
  { id: 1, company_name: "ABC Corp", created_at: "2026-01-01" },
  { id: 2, company_name: "XYZ Ltd", created_at: "2026-01-10" },
];

const transactions: Transaction[] = [
  { id: 1, distributor_id: 1, corporate_client_id: 1, branch_id: 1, employee_name: "陳大明", service_item: "痛症治療", amount: 1200, commission_amount: 108, transaction_date: "2026-04-01", status: "completed", created_at: "2026-04-01" },
  { id: 2, distributor_id: 1, corporate_client_id: 2, branch_id: 2, employee_name: "李小姐", service_item: "女性健康", amount: 800, commission_amount: 72, transaction_date: "2026-04-02", status: "completed", created_at: "2026-04-02" },
  { id: 3, distributor_id: 2, corporate_client_id: 1, branch_id: 1, employee_name: "王先生", service_item: "運動專科", amount: 1500, commission_amount: 135, transaction_date: "2026-04-03", status: "completed", created_at: "2026-04-03" },
  { id: 4, distributor_id: 1, corporate_client_id: 2, branch_id: 3, employee_name: "張太", service_item: "體質管理", amount: 600, commission_amount: 54, transaction_date: "2026-04-05", status: "completed", created_at: "2026-04-05" },
  { id: 5, distributor_id: 2, corporate_client_id: 1, branch_id: 2, employee_name: "阿強", service_item: "痛症治療", amount: 900, commission_amount: 81, transaction_date: "2026-04-07", status: "refunded", created_at: "2026-04-07" },
];

// Auth middleware
const auth = (c: any, next: () => Promise<void>) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = header.slice(7);
  const user = users.find(u => (u as any)._token === token);
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
    parent_id: data.parent_id,
    commission_rate: data.commission_rate,
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
  
  const enriched = transactions.map(t => ({
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
  
  // Calculate commission (10% of amount)
  const commissionAmount = data.amount * 0.10;
  
  const newTransaction: Transaction = {
    id: transactions.length + 1,
    distributor_id: data.distributor_id,
    corporate_client_id: data.corporate_client_id,
    branch_id: data.branch_id,
    employee_name: data.employee_name,
    service_item: data.service_item,
    amount: data.amount,
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
      if (isNaN(amount) || amount <= 0) {
        result.errors.push({ row: index + 1, error: "Invalid amount" });
        result.failed++;
        return;
      }

      const newTransaction: Transaction = {
        id: transactions.length + 1,
        distributor_id: parseInt(row.distributor_id),
        corporate_client_id: parseInt(row.corporate_client_id),
        branch_id: parseInt(row.branch_id),
        employee_name: row.employee_name,
        service_item: row.service_item,
        amount: amount,
        commission_amount: amount * 0.10,
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
  { id: "1", branch_id: 1, corporate_client_id: 1, employee_name: "陳大明", employee_phone: "91234567", service_item: "痛症治療", appointment_date: "2026-04-15", appointment_time: "10:00", status: "confirmed", notes: "" },
  { id: "2", branch_id: 2, corporate_client_id: 2, employee_name: "李小姐", employee_phone: "92345678", service_item: "女性健康", appointment_date: "2026-04-16", appointment_time: "14:00", status: "pending", notes: "" },
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
    branch_id: data.branch_id,
    corporate_client_id: data.corporate_client_id,
    employee_name: data.employee_name,
    employee_phone: data.employee_phone,
    service_item: data.service_item,
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    status: "pending",
    notes: data.notes || ""
  };

  appointments.push(newAppointment);
  
  // Return both the appointment and a flag to trigger Google Calendar sync
  return c.json({ 
    success: true, 
    appointment: newAppointment,
    needs_calendar_sync: true,
    calendar_event_details: {
      summary: `CPR Physio 預約 - ${newAppointment.employee_name}`,
      description: `服務：${newAppointment.service_item}\n分店：${branches.find(b => b.id === newAppointment.branch_id)?.name || ""}\n公司：${corporateClients.find(c => c.id === newAppointment.corporate_client_id)?.company_name || ""}`,
      start: `${newAppointment.appointment_date}T${newAppointment.appointment_time}:00+08:00`,
      end: `${newAppointment.appointment_date}T${newAppointment.appointment_time}:00+08:00`, // 1 hour duration
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
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const isProduction = process.env.NODE_ENV === "production";
const staticRoot = isProduction 
  ? join(process.cwd(), "dist") 
  : join(process.cwd(), "src", "pages");

// Serve static files from correct directory based on environment
app.get("*", async (c) => {
  const path = c.req.path;
  
  // Skip API routes
  if (path.startsWith("/api/")) {
    return c.next();
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