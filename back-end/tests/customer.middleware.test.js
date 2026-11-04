import assert from "node:assert/strict";
import test from "node:test";
import { requireCustomer } from "../src/middlewares/customer.middleware.js";

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

test("allows an authenticated USER role", () => {
  const response = createResponse();
  let nextCalled = false;

  requireCustomer({ user: { role: "USER" } }, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, 200);
});

test("rejects ADMIN and missing users from customer-only routes", () => {
  for (const request of [{ user: { role: "ADMIN" } }, {}, { user: null }]) {
    const response = createResponse();
    let nextCalled = false;

    requireCustomer(request, response, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 403);
    assert.match(response.body.message, /مشتری/);
  }
});
