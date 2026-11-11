import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSocialUrl,
  normalizeChannelName,
  normalizeSortOrder,
  normalizeActive,
  normalizeSocialPlatform,
  normalizeSocialLabel,
} from "../src/validators/socialLink.validation.js";

test("accepts HTTPS social URLs and normalizes bare hostnames", () => {
  assert.equal(normalizeSocialUrl("instagram.com/store"), "https://instagram.com/store");
  assert.equal(normalizeSocialUrl("https://t.me/store"), "https://t.me/store");
});

test("rejects unsafe, malformed, credentialed and non-HTTPS URLs", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,x", "http://example.com", "https://user:pass@example.com", "https://", "https://bad host"]) {
    assert.throws(() => normalizeSocialUrl(value), { status: 400 });
  }
});

test("allows an empty URL to remove a social link", () => {
  assert.equal(normalizeSocialUrl(""), null);
  assert.equal(normalizeSocialUrl(null), null);
});

test("normalizes plain channel names and rejects markup or oversized values", () => {
  assert.equal(normalizeChannelName(" کانال فروشگاه "), "کانال فروشگاه");
  assert.equal(normalizeChannelName("  "), null);
  assert.throws(() => normalizeChannelName("<script>"), { status: 400 });
  assert.throws(() => normalizeChannelName("x".repeat(101)), { status: 400 });
});

test("validates display order and enabled state", () => {
  assert.equal(normalizeSortOrder("4"), 4);
  assert.throws(() => normalizeSortOrder(-1), { status: 400 });
  assert.throws(() => normalizeSortOrder(1.5), { status: 400 });
  assert.equal(normalizeActive(false), false);
  assert.equal(normalizeActive(true), true);
  assert.throws(() => normalizeActive("false"), { status: 400 });
});

test("accepts custom platform keys and normalizes separators", () => {
  assert.equal(normalizeSocialPlatform(" custom-chat "), "CUSTOM_CHAT");
  assert.equal(normalizeSocialPlatform("eita"), "EITA");
  assert.throws(() => normalizeSocialPlatform("x"), { status: 400 });
  assert.throws(() => normalizeSocialPlatform("custom<script>"), { status: 400 });
});

test("validates custom platform display labels", () => {
  assert.equal(normalizeSocialLabel(" ایتا "), "ایتا");
  assert.throws(() => normalizeSocialLabel(""), { status: 400 });
  assert.throws(() => normalizeSocialLabel("<b>chat</b>"), { status: 400 });
});
