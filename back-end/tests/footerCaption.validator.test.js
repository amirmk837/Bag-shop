import assert from "node:assert/strict";
import test from "node:test";
import { footerCaptionSchema } from "../src/validators/footerCaption.validator.js";

test("accepts a plain-text copyright caption", () => {
  assert.equal(
    footerCaptionSchema.safeParse({ footerCaption: "© فروشگاه کاظمی — تمامی حقوق محفوظ است." }).success,
    true,
  );
});

test("accepts an empty caption so the storefront fallback can be used", () => {
  assert.equal(footerCaptionSchema.safeParse({ footerCaption: "" }).success, true);
});

test("rejects captions longer than 180 characters", () => {
  assert.equal(footerCaptionSchema.safeParse({ footerCaption: "الف".repeat(181) }).success, false);
});

test("rejects HTML markup and script injection attempts", () => {
  for (const footerCaption of ["<b>متن</b>", "<script>alert(1)</script>", "متن <img src=x>"]) {
    assert.equal(footerCaptionSchema.safeParse({ footerCaption }).success, false);
  }
});

test("rejects non-string values", () => {
  assert.equal(footerCaptionSchema.safeParse({ footerCaption: 123 }).success, false);
});
