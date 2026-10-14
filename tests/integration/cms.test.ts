import request from "supertest";
import app from "../../src/app";
import { Role } from "../../src/modules/roles/role.model";
import { User } from "../../src/modules/users/user.model";
import { signAccessToken } from "../../src/common/utils/tokens";

const EMAIL = "cms-admin@thewebhero.com";
const PASSWORD = "SuperSecret123";

// Signs the token directly: logging in for every test would trip the
// login rate limiter (10 attempts per window) - auth.test.ts covers login.
async function adminAuth() {
  const role = await Role.create({ name: "super-admin", permissions: [], isSystem: true });
  const user = await User.create({ name: "CMS Admin", email: EMAIL, password: PASSWORD, role: role._id });
  const token = signAccessToken({ sub: user.id, email: EMAIL, role: role.name, permissions: [] });
  return { Authorization: `Bearer ${token}` };
}

const service = (title: string, extra: Record<string, unknown> = {}) => ({
  title,
  shortDescription: `${title} short description`,
  category: "Development",
  categorySlug: "development",
  status: "published",
  ...extra,
});

describe("CMS content modules", () => {
  it("requires auth to create and validates required fields", async () => {
    expect((await request(app).post("/api/v1/services").send(service("Web Development"))).status).toBe(401);

    const auth = await adminAuth();
    const bad = await request(app).post("/api/v1/services").set(auth).send({ title: "" });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.data)).toEqual(expect.arrayContaining(["title", "shortDescription"]));
  });

  it("generates unique slugs from the title", async () => {
    const auth = await adminAuth();
    const a = await request(app).post("/api/v1/services").set(auth).send(service("Web Development"));
    const b = await request(app).post("/api/v1/services").set(auth).send(service("Web Development"));
    expect(a.body.data.slug).toBe("web-development");
    expect(b.body.data.slug).toBe("web-development-2");
  });

  it("serves only published content publicly and populates related items in order", async () => {
    const auth = await adminAuth();
    await request(app).post("/api/v1/services").set(auth).send(service("API Development"));
    await request(app).post("/api/v1/services").set(auth).send(service("Mobile Apps"));
    await request(app).post("/api/v1/services").set(auth).send(service("Hidden Draft", { status: "draft" }));
    await request(app)
      .post("/api/v1/services")
      .set(auth)
      .send(service("Web Development", { relatedServices: ["mobile-apps", "hidden-draft", "api-development"] }));

    const list = await request(app).get("/api/v1/services?view=summary");
    expect(list.body.data.items.map((s: { title: string }) => s.title)).not.toContain("Hidden Draft");
    expect(list.body.data.items[0]).not.toHaveProperty("faqs");

    expect((await request(app).get("/api/v1/services/slug/hidden-draft")).status).toBe(404);

    const detail = await request(app).get("/api/v1/services/slug/web-development");
    expect(detail.status).toBe(200);
    // Draft is skipped, order is kept, and refs carry display fields.
    expect(detail.body.data.relatedServices).toEqual([
      expect.objectContaining({ slug: "mobile-apps", title: "Mobile Apps", shortDescription: "Mobile Apps short description" }),
      expect.objectContaining({ slug: "api-development", title: "API Development" }),
    ]);

    const adminList = await request(app).get("/api/v1/services").set(auth);
    expect(adminList.body.data.items).toHaveLength(4);
  });

  it("filters, searches and rejects bad URLs and invalid JSON-LD", async () => {
    const auth = await adminAuth();
    await request(app).post("/api/v1/services").set(auth).send(service("Cloud Ops", { categorySlug: "cloud" }));
    await request(app).post("/api/v1/services").set(auth).send(service("React Apps"));

    const cloud = await request(app).get("/api/v1/services?categorySlug=cloud");
    expect(cloud.body.data.items.map((s: { title: string }) => s.title)).toEqual(["Cloud Ops"]);
    const search = await request(app).get("/api/v1/services?search=react");
    expect(search.body.data.items).toHaveLength(1);

    const badUrl = await request(app).post("/api/v1/services").set(auth).send(service("X", { heroImage: "javascript:alert(1)" }));
    expect(badUrl.status).toBe(400);
    const badJson = await request(app).post("/api/v1/services").set(auth).send(service("Y", { seo: { structuredData: "{oops" } }));
    expect(badJson.status).toBe(400);
  });

  it("updates, reorders and deletes", async () => {
    const auth = await adminAuth();
    const a = (await request(app).post("/api/v1/services").set(auth).send(service("Alpha"))).body.data;
    const b = (await request(app).post("/api/v1/services").set(auth).send(service("Beta"))).body.data;

    const upd = await request(app).put(`/api/v1/services/${a.id}`).set(auth).send({ seo: { title: "Alpha | Best", noindex: true } });
    expect(upd.status).toBe(200);
    expect(upd.body.data.seo).toMatchObject({ title: "Alpha | Best", noindex: true });
    expect(upd.body.data.title).toBe("Alpha");

    await request(app)
      .put("/api/v1/services/reorder")
      .set(auth)
      .send({ items: [{ id: a.id, sortOrder: 2 }, { id: b.id, sortOrder: 1 }] });
    const ordered = await request(app).get("/api/v1/services");
    expect(ordered.body.data.items.map((s: { title: string }) => s.title)).toEqual(["Beta", "Alpha"]);

    expect((await request(app).delete(`/api/v1/services/${a.id}`).set(auth)).status).toBe(200);
    expect((await request(app).get("/api/v1/services/slug/alpha")).status).toBe(404);
  });
});

describe("SEO", () => {
  it("looks up page SEO by normalised path", async () => {
    const auth = await adminAuth();
    const res = await request(app)
      .post("/api/v1/seo-pages")
      .set(auth)
      .send({ label: "About", path: "/Company/About/", seo: { title: "About TheWebHero" } });
    expect(res.status).toBe(201);
    expect(res.body.data.path).toBe("/company/about");

    const found = await request(app).get("/api/v1/seo-pages/by-path?path=company/about");
    expect(found.status).toBe(200);
    expect(found.body.data.seo.title).toBe("About TheWebHero");
  });

  it("builds a sitemap from published, indexable content and pages", async () => {
    const auth = await adminAuth();
    await request(app).post("/api/v1/services").set(auth).send(service("Visible"));
    await request(app).post("/api/v1/services").set(auth).send(service("No Index", { seo: { noindex: true } }));
    await request(app).post("/api/v1/blog").set(auth).send({ title: "Hello", excerpt: "e", content: "## Hi", status: "draft" });
    await request(app).post("/api/v1/seo-pages").set(auth).send({ label: "Home", path: "/" });

    const res = await request(app).get("/api/v1/sitemap");
    const paths = res.body.data.map((e: { path: string }) => e.path);
    expect(paths).toEqual(expect.arrayContaining(["/services/visible", "/"]));
    expect(paths).not.toContain("/services/no-index");
    expect(paths).not.toContain("/blog/hello");
  });
});

describe("Singletons and content types", () => {
  it("hides private settings from the public", async () => {
    const auth = await adminAuth();
    const put = await request(app)
      .put("/api/v1/settings")
      .set(auth)
      .send({ siteName: "TheWebHero", contact: { email: "hello@thewebhero.in" }, notifications: { leadsEmail: "sales@thewebhero.in" } });
    expect(put.status).toBe(200);

    const pub = await request(app).get("/api/v1/settings");
    expect(pub.body.data.siteName).toBe("TheWebHero");
    expect(pub.body.data.contact.email).toBe("hello@thewebhero.in");
    expect(pub.body.data).not.toHaveProperty("notifications");

    const adm = await request(app).get("/api/v1/settings/admin").set(auth);
    expect(adm.body.data.notifications.leadsEmail).toBe("sales@thewebhero.in");

    expect((await request(app).put("/api/v1/settings").send({ siteName: "Hacked" })).status).toBe(401);
  });

  it("describes content types for the admin forms", async () => {
    const auth = await adminAuth();
    const res = await request(app).get("/api/v1/content-types/portfolio").set(auth);
    expect(res.status).toBe(200);
    const keys = res.body.data.fields.map((fd: { key: string }) => fd.key);
    expect(keys).toEqual(expect.arrayContaining(["title", "challenge", "gallery", "seo", "status"]));
    const seo = res.body.data.fields.find((fd: { key: string }) => fd.key === "seo");
    expect(seo.of.map((fd: { key: string }) => fd.key)).toContain("focusKeyword");
  });
});

describe("Media uploads (local storage)", () => {
  it("stores files safely and serves them with a locked-down CSP", async () => {
    const auth = await adminAuth();
    // 1x1 transparent PNG
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    const up = await request(app).post("/api/v1/media").set(auth).field("folder", "../../etc").attach("file", png, "x.png");
    expect(up.status).toBe(201);
    expect(up.body.data.publicId).toMatch(/^etc\/[a-z0-9]+-[a-f0-9]{12}\.png$/);

    const path = new URL(up.body.data.url).pathname;
    const served = await request(app).get(path);
    expect(served.status).toBe(200);
    expect(served.headers["content-security-policy"]).toContain("sandbox");

    expect((await request(app).delete(`/api/v1/media/${up.body.data._id}`).set(auth)).status).toBe(200);
    expect((await request(app).get(path)).status).toBe(404);
  });
});

describe("Media cleanup when content changes", () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
  const upload = async (auth: Record<string, string>) => {
    const res = await request(app).post("/api/v1/media").set(auth).field("folder", "test").attach("file", png, "img.png");
    expect(res.status).toBe(201);
    return { id: res.body.data._id as string, url: res.body.data.url as string, path: new URL(res.body.data.url).pathname };
  };
  const exists = async (path: string) => (await request(app).get(path)).status === 200;

  it("deletes replaced, cleared and orphaned files but keeps shared ones", async () => {
    const auth = await adminAuth();
    const [a, b, c] = [await upload(auth), await upload(auth), await upload(auth)];

    const s1 = (await request(app).post("/api/v1/services").set(auth).send(service("One", { seo: { ogImage: a.url } }))).body.data;
    const s2 = (await request(app).post("/api/v1/services").set(auth).send(service("Two", { seo: { ogImage: c.url } }))).body.data;
    const s3 = (await request(app).post("/api/v1/services").set(auth).send(service("Three", { seo: { ogImage: c.url } }))).body.data;

    // Changing an image removes the old file from storage and the media library.
    await request(app).put(`/api/v1/services/${s1._id}`).set(auth).send({ seo: { ogImage: b.url } }).expect(200);
    expect(await exists(a.path)).toBe(false);
    expect((await request(app).get("/api/v1/media").set(auth)).body.data.items.map((m: { _id: string }) => m._id)).not.toContain(a.id);

    // A file still used by another record survives; it goes with the last user.
    await request(app).delete(`/api/v1/services/${s2._id}`).set(auth).expect(200);
    expect(await exists(c.path)).toBe(true);
    await request(app).delete(`/api/v1/services/${s3._id}`).set(auth).expect(200);
    expect(await exists(c.path)).toBe(false);

    // Replacing a media file deletes the old one and repoints the content.
    const replaced = await request(app).put(`/api/v1/media/${b.id}`).set(auth).attach("file", png, "new.png");
    expect(replaced.status).toBe(200);
    expect(await exists(b.path)).toBe(false);
    const fresh = await request(app).get(`/api/v1/services/${s1._id}`).set(auth).query({ populate: "false" });
    expect(fresh.body.data.seo.ogImage).toBe(replaced.body.data.url);
    expect(await exists(new URL(replaced.body.data.url).pathname)).toBe(true);
  });
});
