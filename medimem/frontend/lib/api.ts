const BASE = "http://localhost:8000";

async function req<T>(method: string, path: string, body?: unknown, isForm = false): Promise<T> {
  const headers: Record<string,string> = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// Get normalized doctor name — same normalization as backend
function getDoctorName(): string {
  try {
    const d = localStorage.getItem("medimem_doctor");
    return d ? (JSON.parse(d).name || "").trim().toLowerCase() : "";
  } catch { return ""; }
}

export const api = {
  // Patients — each doctor sees only their own
  listPatients: () => {
    const doctor = getDoctorName();
    return req<any>("GET", `/patients/list${doctor ? `?doctor=${encodeURIComponent(doctor)}` : ""}`);
  },
  getPatient:    (id: string) => req<any>("GET",    `/patients/${id}`),
  createPatient: (d: any)     => req<any>("POST",   "/patients/create", {
    ...d,
    doctor: getDoctorName(), // normalized name attached automatically
  }),
  deletePatient: (id: string) => req<any>("DELETE", `/patients/${id}`),

  // Upload
  uploadDoc: (patientId: string, file: File) => {
    const fd = new FormData(); fd.append("file", file);
    return req<any>("POST", `/upload/${patientId}`, fd, true);
  },
  getDocs: (id: string) => req<any>("GET", `/upload/${id}/docs`),

  // Chat
  chat:    (id: string, question: string) => req<any>("POST", `/chat/${id}`, { question }),
  history: (id: string)                   => req<any>("GET",  `/chat/${id}/history`),

  // Brief
  getBrief: (id: string) => req<any>("POST", `/brief/${id}`),

  // Memory
  getSnapshot: (id: string) => req<any>("GET", `/memory/${id}/snapshot`),
  getTimeline: (id: string) => req<any>("GET", `/memory/${id}/timeline`),
  getMindmap:  (id: string) => req<any>("GET", `/memory/${id}/mindmap`),

  // Alerts
  getAlerts:    ()            => req<any>("GET",    "/alerts"),
  getAlertCount:()            => req<any>("GET",    "/alerts/count"),
  markRead:     (id: string)  => req<any>("PATCH",  `/alerts/${id}/read`),
  dismissAlert: (id: string)  => req<any>("DELETE", `/alerts/${id}`),
  markAllRead:  ()            => req<any>("POST",   "/alerts/mark-all-read"),

  // Settings
  getStatus:         ()       => req<any>("GET",  "/settings/status"),
  saveKeys:          (d: any) => req<any>("POST", "/settings/keys", d),
  getNotifications:  ()       => req<any>("GET",  "/settings/notifications"),
  saveNotifications: (d: any) => req<any>("POST", "/settings/notifications", d),
};