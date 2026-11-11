import assert from "node:assert/strict";
import test from "node:test";
import {
  isAllowedOrderTransition,
  normalizeRequiredReason,
  requiresPhysicalInventoryReturn,
} from "../src/services/orderLifecycle.rules.js";

test("allows only explicitly declared order status transitions", () => {
  assert.equal(isAllowedOrderTransition("PENDING", "CANCELLED"), true);
  assert.equal(isAllowedOrderTransition("PAID", "CONFIRMED"), true);
  assert.equal(isAllowedOrderTransition("SHIPPED", "DELIVERED"), true);
  assert.equal(isAllowedOrderTransition("DELIVERED", "CANCELLED"), false);
  assert.equal(isAllowedOrderTransition("PAID", "CANCELLED"), false);
  assert.equal(isAllowedOrderTransition("CANCELLED", "SHIPPED"), false);
});

test("requires physical item-level return confirmation after shipment", () => {
  assert.equal(requiresPhysicalInventoryReturn("SHIPPED"), true);
  assert.equal(requiresPhysicalInventoryReturn("DELIVERED"), true);
  assert.equal(requiresPhysicalInventoryReturn("PROCESSING"), false);
  assert.equal(requiresPhysicalInventoryReturn("CANCELLED"), false);
});

test("normalizes and bounds audit reasons", () => {
  assert.equal(normalizeRequiredReason("  بررسی انبار  "), "بررسی انبار");
  assert.equal(normalizeRequiredReason("کم"), null);
  assert.equal(normalizeRequiredReason("x".repeat(501)), null);
  assert.equal(normalizeRequiredReason(null), null);
});
