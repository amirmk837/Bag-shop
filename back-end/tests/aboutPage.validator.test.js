import assert from "node:assert/strict";
import test from "node:test";
import { aboutPageSchema } from "../src/validators/aboutPage.validator.js";

const valid = {
  eyebrow: "آشنایی با ما",
  title: "درباره فروشگاه کاظمی",
  intro: "معرفی کوتاه فروشگاه",
  storyTitle: "داستان ما",
  story: "متن داستان",
  mission: "مأموریت",
  vision: "چشم‌انداز",
  values: [
    { title: "شفافیت", description: "اطلاعات روشن محصولات" },
    { title: "پاسخ‌گویی", description: "رسیدگی به پرسش‌ها" },
  ],
  contactText: "از راه‌های ارتباطی سایت با ما تماس بگیرید.",
  isPublished: false,
};

test("accepts valid structured plain-text about content", () => {
  assert.equal(aboutPageSchema.safeParse(valid).success, true);
});

test("rejects HTML and script injection in text fields", () => {
  assert.equal(aboutPageSchema.safeParse({ ...valid, story: "<script>alert(1)</script>" }).success, false);
});

test("requires between two and six values", () => {
  assert.equal(aboutPageSchema.safeParse({ ...valid, values: [] }).success, false);
  assert.equal(aboutPageSchema.safeParse({ ...valid, values: Array.from({ length: 7 }, (_, i) => ({ title: `عنوان ${i}`, description: "توضیح" })) }).success, false);
});

test("rejects unknown fields and non-boolean publication state", () => {
  assert.equal(aboutPageSchema.safeParse({ ...valid, unexpected: true }).success, false);
  assert.equal(aboutPageSchema.safeParse({ ...valid, isPublished: "true" }).success, false);
});
