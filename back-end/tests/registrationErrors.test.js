import test from "node:test";
import assert from "node:assert/strict";
import { getRegistrationConflictMessage } from "../src/utils/registrationErrors.js";

test("reports a duplicate username", () => {
  assert.equal(
    getRegistrationConflictMessage(["username"]),
    "این نام کاربری قبلاً ثبت شده است.",
  );
});

test("reports a duplicate phone", () => {
  assert.equal(
    getRegistrationConflictMessage(["phone"]),
    "این شماره همراه قبلاً ثبت شده است.",
  );
});

test("reports both duplicate fields", () => {
  assert.equal(
    getRegistrationConflictMessage(["username", "phone"]),
    "این نام کاربری و شماره همراه قبلاً ثبت شده‌اند.",
  );
});

test("supports Prisma unique constraint names", () => {
  assert.equal(
    getRegistrationConflictMessage(["User_username_key"]),
    "این نام کاربری قبلاً ثبت شده است.",
  );
  assert.equal(
    getRegistrationConflictMessage("User_phone_key"),
    "این شماره همراه قبلاً ثبت شده است.",
  );
});

test("uses a safe generic message for an unknown constraint", () => {
  assert.equal(
    getRegistrationConflictMessage(["unknown_constraint"]),
    "نام کاربری یا شماره همراه قبلاً ثبت شده است.",
  );
});
