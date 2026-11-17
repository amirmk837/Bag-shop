export const getLoggedInUsers = async ({ page = 1, pageSize = 20 } = {}) => {
  const safePage = Math.max(1, Math.min(Number.parseInt(page, 10) || 1, 100000));
  const safeSize = Math.max(1, Math.min(Number.parseInt(pageSize, 10) || 20, 50));
  // This endpoint is the admin activity view, not a customer login report.
  // Exclude regular customers and disabled/deleted accounts.
  const where = {
    role: { in: ["ADMIN", "ADMIN_STAFF"] },
    isActive: true,
    deletedAt: null,
    lastLoginAt: { not: null },
  };
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { lastLoginAt: "desc" },
      skip: (safePage - 1) * safeSize,
      take: safeSize,
      select: { id: true, username: true, role: true, lastLoginAt: true, createdAt: true },
    }),
  ]);
  return { items, pagination: { page: safePage, pageSize: safeSize, total, totalPages: Math.ceil(total / safeSize) } };
};