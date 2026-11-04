import assert from "node:assert/strict";
import test from "node:test";
import { csrfProtection } from "../src/middlewares/csrf.middleware.js";

const createRequest = ({ method = "POST", origin, referer } = {}) => ({
  method,
  get(name) {
    if (name === "origin") return origin;
    if (name === "referer") return referer;
    return undefined;
  },
});

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

const withOrigins = async (origins, run) => {
  const previous = process.env.FRONTEND_ORIGINS;
  process.env.FRONTEND_ORIGINS = origins;
  try {
    await run();
  } finally {
    if (previous === undefined) delete process.env.FRONTEND_ORIGINS;
    else process.env.FRONTEND_ORIGINS = previous;
  }
};

test("allows safe methods without Origin or Referer", async () => {
  await withOrigins("https://shop.example", async () => {
    const response = createResponse();
    let nextCalled = false;

    csrfProtection(createRequest({ method: "GET" }), response, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(response.statusCode, 200);
  });
});

test("allows a state-changing request from an explicitly configured origin", async () => {
  await withOrigins("https://shop.example,https://admin.example", async () => {
    const response = createResponse();
    let nextCalled = false;

    csrfProtection(createRequest({ origin: "https://admin.example" }), response, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(response.statusCode, 200);
  });
});

test("allows a valid configured Referer when Origin is absent", async () => {
  await withOrigins("https://shop.example", async () => {
    const response = createResponse();
    let nextCalled = false;

    csrfProtection(
      createRequest({ referer: "https://shop.example/checkout?step=2" }),
      response,
      () => {
        nextCalled = true;
      },
    );

    assert.equal(nextCalled, true);
  });
});

test("rejects missing, malformed, and untrusted request origins", async (t) => {
  await withOrigins("https://shop.example", async () => {
    for (const request of [
      createRequest(),
      createRequest({ origin: "https://attacker.example" }),
      createRequest({ referer: "not a valid URL" }),
    ]) {
      await t.test(JSON.stringify(request), () => {
        const response = createResponse();
        let nextCalled = false;

        csrfProtection(request, response, () => {
          nextCalled = true;
        });

        assert.equal(nextCalled, false);
        assert.equal(response.statusCode, 403);
        assert.equal(response.body.success, false);
      });
    }
  });
});
