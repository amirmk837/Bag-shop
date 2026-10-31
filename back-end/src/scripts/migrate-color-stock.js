import "dotenv/config";
import prisma from "../config/prisma";

const parseColors = (value) =>
  typeof value === "string"
    ? [
        ...new Set(
          value
            .split(/[,،\n|]/)
            .map((color) => color.trim())
            .filter(Boolean),
        ),
      ]
    : [];

const run = async () => {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      productCode: true,
      count: true,
      color: true,
      colorStocks: { select: { id: true } },
    },
  });

  let migrated = 0;
  let skipped = 0;

  for (const product of products) {
    const colors = parseColors(product.color);

    if (colors.length === 0 || product.colorStocks.length > 0) {
      skipped += 1;
      continue;
    }

    // موجودی فعلی بین رنگ‌ها تقسیم می‌شود تا مجموع تغییر نکند.
    const base = Math.floor(product.count / colors.length);
    const remainder = product.count - base * colors.length;

    const rows = colors.map((color, index) => ({
      productId: product.id,
      color,
      count: base + (index < remainder ? 1 : 0),
    }));

    await prisma.$transaction([
      prisma.productColorStock.createMany({ data: rows }),
      prisma.product.update({
        where: { id: product.id },
        data: { color: colors.join("، ") },
      }),
    ]);

    migrated += 1;

    console.log(
      `${product.productCode}: ${rows
        .map((row) => `${row.color}=${row.count}`)
        .join(" | ")}`,
    );
  }

  console.log(`\nمنتقل‌شده: ${migrated} | بدون نیاز: ${skipped}`);
};

run()
  .catch((error) => {
    console.error("Migration error:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
