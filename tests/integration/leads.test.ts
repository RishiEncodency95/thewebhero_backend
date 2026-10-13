import request from "supertest";
import app from "../../src/app";
import { Role } from "../../src/modules/roles/role.model";
import { User } from "../../src/modules/users/user.model";
import { QuoteRequest } from "../../src/modules/leads/quote-request/quoteRequest.model";
import { ContactEnquiry } from "../../src/modules/leads/contact-enquiry/contactEnquiry.model";
import { Notification } from "../../src/modules/notifications/notification.model";
import { portfolio } from "../../src/content/editorial";

const EMAIL = "lead-admin@thewebhero.com";
const PASSWORD = "SuperSecret123";

async function loginAsAdmin() {
  const role = await Role.create({ name: "super-admin", permissions: [], isSystem: true });
  await User.create({ name: "Lead Admin", email: EMAIL, password: PASSWORD, role: role._id });
  const res = await request(app).post("/api/v1/auth/login").send({ email: EMAIL, password: PASSWORD });
  return res.body.data.accessToken as string;
}

// Shape sent by twh_frontend's QuoteForm (empty strings for untouched fields).
const quotePayload = {
  fullName: "Asha Verma",
  companyName: "",
  email: "Asha@Example.com",
  phone: "+91 90000 00000",
  country: "",
  preferredContactMethod: "WhatsApp",
  service: "Web Development",
  projectType: "Custom Web Application",
  industry: "Healthcare",
  existingUrl: "",
  projectStatus: "New Project",
  summary: "We need a patient booking portal with an admin dashboard.",
  goals: "",
  features: ["Online booking", "Payments"],
  platforms: ["Web Desktop"],
  technologyPreferences: ["Next.js / React"],
  referenceLinks: "",
  budget: "₹1–5 Lakh",
  timeline: "1 – 2 Months",
  priority: "Urgent",
  preferredStartDate: "",
  additionalNotes: "",
  consent: true,
  honeypot: "",
  pageUrl: "https://thewebhero.in/get-a-quote",
};

describe("Lead capture", () => {
  it("stores a quote request with every form field and returns only a reference id", async () => {
    await loginAsAdmin();

    const res = await request(app).post("/api/v1/quote-requests").send(quotePayload);

    expect(res.status).toBe(201);
    expect(Object.keys(res.body.data)).toEqual(["referenceId"]);
    expect(res.body.data.referenceId).toMatch(/^TWH-Q-\d{6}-[A-Z0-9]{4}$/);

    const saved = await QuoteRequest.findOne({ referenceId: res.body.data.referenceId }).lean();
    expect(saved).toMatchObject({
      fullName: "Asha Verma",
      email: "asha@example.com",
      preferredContactMethod: "WhatsApp",
      priority: "Urgent",
      features: ["Online booking", "Payments"],
      status: "new",
      consent: true,
    });
    expect(saved?.companyName).toBeUndefined();
    expect(saved?.meta?.pageUrl).toBe("https://thewebhero.in/get-a-quote");
  });

  it("ignores server-only fields sent by the public", async () => {
    const res = await request(app)
      .post("/api/v1/quote-requests")
      .send({ ...quotePayload, status: "resolved", notes: "hacked", referenceId: "X" });

    expect(res.status).toBe(201);
    const saved = await QuoteRequest.findOne({ referenceId: res.body.data.referenceId }).lean();
    expect(saved?.status).toBe("new");
    expect(saved?.notes).toBe("");
  });

  it("rejects a submission without consent", async () => {
    const res = await request(app).post("/api/v1/quote-requests").send({ ...quotePayload, consent: false });
    expect(res.status).toBe(400);
    expect(await QuoteRequest.countDocuments()).toBe(0);
  });

  it("silently drops honeypot submissions", async () => {
    const res = await request(app).post("/api/v1/contact-enquiries").send({
      name: "Bot",
      email: "bot@spam.com",
      message: "Buy cheap things now",
      consent: true,
      honeypot: "http://spam.example",
    });
    expect(res.status).toBe(201);
    expect(await ContactEnquiry.countDocuments()).toBe(0);
  });

  it("notifies admins about a new contact enquiry", async () => {
    await loginAsAdmin();
    await request(app)
      .post("/api/v1/contact-enquiries")
      .send({ name: "Ravi", email: "ravi@example.com", message: "Need an app quote", consent: true, service: "Mobile Apps" });

    // Notification is fire-and-forget; give it a tick.
    await new Promise((r) => setTimeout(r, 200));
    const n = await Notification.findOne().lean();
    expect(n?.title).toBe("New contact enquiry");
    expect(n?.message).toContain("Ravi");
  });

  it("lets admins list, search, update and count leads", async () => {
    const token = await loginAsAdmin();
    await request(app).post("/api/v1/quote-requests").send(quotePayload);
    await request(app).post("/api/v1/quote-requests").send({ ...quotePayload, fullName: "Karan Mehta", email: "karan@example.com" });

    expect((await request(app).get("/api/v1/quote-requests")).status).toBe(401);

    const auth = { Authorization: `Bearer ${token}` };
    const list = await request(app).get("/api/v1/quote-requests?search=karan").set(auth);
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);

    const id = list.body.data.items[0]._id;
    const patch = await request(app).patch(`/api/v1/quote-requests/${id}`).set(auth).send({ status: "in-progress", notes: "Called client" });
    expect(patch.status).toBe(200);
    expect(patch.body.data).toMatchObject({ status: "in-progress", notes: "Called client" });

    const stats = await request(app).get("/api/v1/quote-requests/stats").set(auth);
    expect(stats.body.data.total).toBe(2);
    expect(stats.body.data.byStatus).toMatchObject({ new: 1, "in-progress": 1 });
  });
});

describe("Public content reads", () => {
  it("hides drafts from the public but shows them to admins", async () => {
    const token = await loginAsAdmin();
    await portfolio.Model.create({ title: "Live Project", shortDescription: "x", status: "published" });
    await portfolio.Model.create({ title: "Secret Draft", shortDescription: "x", status: "draft" });

    const pub = await request(app).get("/api/v1/portfolio");
    expect(pub.body.data.items.map((p: { title: string }) => p.title)).toEqual(["Live Project"]);

    // Asking for drafts explicitly still only returns published records.
    const forcedDraft = await request(app).get("/api/v1/portfolio?status=draft");
    expect(forcedDraft.body.data.items.map((p: { title: string }) => p.title)).not.toContain("Secret Draft");

    const draftSlug = await request(app).get("/api/v1/portfolio/slug/secret-draft");
    expect(draftSlug.status).toBe(404);

    const admin = await request(app).get("/api/v1/portfolio").set({ Authorization: `Bearer ${token}` });
    expect(admin.body.data.items).toHaveLength(2);
  });
});
