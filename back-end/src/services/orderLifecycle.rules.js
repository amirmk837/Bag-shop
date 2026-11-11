export const ORDER_STATUS_TRANSITIONS = Object.freeze({
  PENDING: Object.freeze(["CANCELLED"]),
  PAID: Object.freeze(["CONFIRMED"]),
  CONFIRMED: Object.freeze(["PROCESSING", "CANCELLED"]),
  PROCESSING: Object.freeze(["SHIPPED", "CANCELLED"]),
  SHIPPED: Object.freeze(["DELIVERED"]),
  DELIVERED: Object.freeze([]),
  CANCELLED: Object.freeze(["PENDING"]),
});

export const isAllowedOrderTransition = (from, to) =>
  ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;

export const requiresPhysicalInventoryReturn = (status) =>
  status === "SHIPPED" || status === "DELIVERED";

export const normalizeRequiredReason = (value, { min = 5, max = 500 } = {}) => {
  if (typeof value !== "string") return null;
  const reason = value.trim();
  return reason.length >= min && reason.length <= max ? reason : null;
};
