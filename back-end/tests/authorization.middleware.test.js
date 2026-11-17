import assert from "node:assert/strict";
import test from "node:test";
import {
  requireAdminAccess,
  requirePermission,
  requireSuperAdmin,
} from "../src/middlewares/authorization.middleware.js";

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const run = (middleware, user) => {
  const response = createResponse();
  let nextCalled = false;
  middleware({ user }, response, () => { nextCalled = true; });
  return { response, nextCalled };
};

test("ADMIN superadmin bypasses granular permission checks", () => {
  const result = run(requirePermission("MANAGE_PRODUCTS"), {
    role: "ADMIN",
    permissions: [],
  });
  assert.equal(result.nextCalled, true);
  assert.equal(result.response.statusCode, 200);
});

test("ADMIN_STAFF is allowed only with the requested permission", () => {
  const allowed = run(requirePermission("MANAGE_PRODUCTS"), {
    role: "ADMIN_STAFF",
    permissions: ["MANAGE_PRODUCTS"],
  });
  const denied = run(requirePermission("MANAGE_PRODUCTS"), {
    role: "ADMIN_STAFF",
    permissions: ["VIEW_ORDERS"],
  });
  assert.equal(allowed.nextCalled, true);
  assert.equal(denied.nextCalled, false);
  assert.equal(denied.response.statusCode, 403);
});

test("USER is denied even when a permission is incorrectly assigned", () => {
  const result = run(requirePermission("MANAGE_PRODUCTS"), {
    role: "USER",
    permissions: ["MANAGE_PRODUCTS"],
  });
  assert.equal(result.nextCalled, false);
  assert.equal(result.response.statusCode, 403);
});

test("missing user receives 401", () => {
  const result = run(requirePermission("MANAGE_PRODUCTS"), undefined);
  assert.equal(result.nextCalled, false);
  assert.equal(result.response.statusCode, 401);
});

test("admin access allows both admin roles but not customers", () => {
  assert.equal(run(requireAdminAccess, { role: "ADMIN" }).nextCalled, true);
  assert.equal(run(requireAdminAccess, { role: "ADMIN_STAFF" }).nextCalled, true);
  const customer = run(requireAdminAccess, { role: "USER" });
  assert.equal(customer.nextCalled, false);
  assert.equal(customer.response.statusCode, 403);
});

test("superadmin-only middleware rejects restricted admins", () => {
  assert.equal(run(requireSuperAdmin, { role: "ADMIN" }).nextCalled, true);
  const staff = run(requireSuperAdmin, { role: "ADMIN_STAFF" });
  assert.equal(staff.nextCalled, false);
  assert.equal(staff.response.statusCode, 403);
});

test("unknown permissions are rejected at middleware registration", () => {
  assert.throws(() => requirePermission("NOT_A_REAL_PERMISSION"), /Unknown admin permission/);
});
