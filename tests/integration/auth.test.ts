import request from "supertest";
import app from "../../src/app";
import { Role } from "../../src/modules/roles/role.model";
import { User } from "../../src/modules/users/user.model";

const EMAIL = "test-admin@thewebhero.com";
const PASSWORD = "SuperSecret123";

async function createTestUser() {
  const role = await Role.create({
    name: "super-admin",
    permissions: ["users:read"],
    isSystem: true,
  });
  await User.create({
    name: "Test Admin",
    email: EMAIL,
    password: PASSWORD,
    role: role._id,
  });
}

describe("Auth flow", () => {
  it("rejects login with wrong password", async () => {
    await createTestUser();

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: EMAIL, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("logs in with correct credentials and returns an access token", async () => {
    await createTestUser();

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(EMAIL);
    // The admin UI needs role + permissions straight from the login response.
    expect(res.body.data.user.role).toBe("super-admin");
    expect(res.body.data.user.permissions).toEqual(["users:read"]);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("blocks protected routes without a token", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
  });

  it("allows access to /me with a valid access token", async () => {
    await createTestUser();

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: EMAIL, password: PASSWORD });

    const token = loginRes.body.data.accessToken;

    const meRes = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(EMAIL);
  });
});
