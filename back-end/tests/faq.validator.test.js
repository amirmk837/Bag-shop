import assert from "node:assert/strict";
import test from "node:test";
import { faqItemSchema } from "../src/validators/faq.validator.js";

const valid = {
  question: "روش ارسال سفارش چیست؟",
  answer: "سفارش از طریق روش‌های ارسال فعال فروشگاه ارسال می‌شود.",
  linkText: "",
  linkUrl: "",
  sortOrder: 0,
  isActive: true,
};

test("accepts valid FAQ plain text and normalizes empty optional links", () => {
  const result = faqItemSchema.safeParse(valid);
  assert.equal(result.success, true);
  assert.equal(result.data.linkText, null);
  assert.equal(result.data.linkUrl, null);
});

test("accepts safe internal and HTTPS links", () => {
  assert.equal(faqItemSchema.parse({ ...valid, linkText: "پیگیری سفارش", linkUrl: "/account/orders" }).linkUrl, "/account/orders");
  assert.equal(faqItemSchema.parse({ ...valid, linkText: "وب‌سایت", linkUrl: "https://example.com/help" }).linkUrl, "https://example.com/help");
  assert.equal(faqItemSchema.parse({ ...valid, linkText: "وب‌سایت", linkUrl: "example.com/help" }).linkUrl, "https://example.com/help");
});

test("rejects unsafe URL schemes, credentials, protocol-relative and malformed links", () => {
  for (const linkUrl of ["javascript:alert(1)", "data:text/html,x", "//evil.example", "https://user:pass@example.com", "https://", "/\\evil.example"]) {
    assert.equal(faqItemSchema.safeParse({ ...valid, linkText: "لینک", linkUrl }).success, false);
  }
});

test("requires link text and URL together", () => {
  assert.equal(faqItemSchema.safeParse({ ...valid, linkText: "اطلاعات بیشتر" }).success, false);
  assert.equal(faqItemSchema.safeParse({ ...valid, linkUrl: "https://example.com" }).success, false);
});

test("rejects markup, unknown keys and invalid sort or active values", () => {
  assert.equal(faqItemSchema.safeParse({ ...valid, answer: "<script>alert(1)</script>" }).success, false);
  assert.equal(faqItemSchema.safeParse({ ...valid, extra: true }).success, false);
  assert.equal(faqItemSchema.safeParse({ ...valid, sortOrder: -1 }).success, false);
  assert.equal(faqItemSchema.safeParse({ ...valid, isActive: "true" }).success, false);
});
