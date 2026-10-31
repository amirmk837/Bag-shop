import "dotenv/config";
import prisma from "../src/config/prisma.js";

const TEST_MARKER = "[TEST ORDER]";
const TEST_QUANTITY = 1;

async function main() {
  const username = process.env.TEST_ORDER_USERNAME;
  const productCode = process.env.TEST_ORDER_PRODUCT_CODE;
  const shippingMethodId = Number(process.env.TEST_ORDER_SHIPPING_METHOD_ID);

  if (
    !username ||
    !productCode ||
    !Number.isSafeInteger(shippingMethodId) ||
    shippingMethodId < 1
  ) {
    throw new Error(
      "متغیرهای TEST_ORDER_USERNAME، TEST_ORDER_PRODUCT_CODE و TEST_ORDER_SHIPPING_METHOD_ID را تنظیم کنید.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { address: true },
  });

  if (!user || user.role !== "USER" || !user.isActive || user.deletedAt) {
    throw new Error(
      "کاربر مشتری فعال با این نام کاربری پیدا نشد؛ سفارش ساخته نشد.",
    );
  }

  if (!user.address) {
    throw new Error(
      "این مشتری آدرس ذخیره‌شده ندارد؛ برای جلوگیری از ثبت آدرس ساختگی، سفارش ساخته نشد.",
    );
  }

  const product = await prisma.product.findUnique({
    where: { productCode },
  });

  if (!product) {
    throw new Error("محصولی با این کد پیدا نشد.");
  }

  const shippingMethod = await prisma.shippingMethod.findUnique({
    where: { id: shippingMethodId },
  });

  if (!shippingMethod || !shippingMethod.isActive) {
    throw new Error("روش ارسال پیدا نشد یا فعال نیست.");
  }

  if (
    !Number.isSafeInteger(product.price) ||
    product.price < 0 ||
    !Number.isSafeInteger(shippingMethod.price) ||
    shippingMethod.price < 0
  ) {
    throw new Error("مبلغ محصول یا ارسال معتبر نیست.");
  }

  const totalAmount = product.price * TEST_QUANTITY + shippingMethod.price;

  if (!Number.isSafeInteger(totalAmount) || totalAmount > 2_147_483_647) {
    throw new Error("مبلغ سفارش خارج از محدوده مجاز دیتابیس است.");
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      status: "PENDING",
      totalAmount,
      shippingCost: shippingMethod.price,
      shippingMethod: shippingMethod.name,
      shippingMethodId: shippingMethod.id,

      shippingRecipientName: `${TEST_MARKER} ${user.address.recipientName}`,
      shippingRecipientPhone: user.address.recipientPhone,
      shippingProvince: user.address.province,
      shippingCity: user.address.city,
      shippingAddressLine: user.address.addressLine,
      shippingPostalCode: user.address.postalCode,
      shippingPlateNumber: user.address.plateNumber,
      shippingUnitNumber: user.address.unitNumber,

      items: {
        create: {
          productId: product.id,
          productCode: product.productCode,
          title: product.title,
          color: product.color ?? "",
          unitPrice: product.price,
          quantity: TEST_QUANTITY,
          subtotal: product.price * TEST_QUANTITY,
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          phone: true,
        },
      },
      items: true,
      shippingOption: true,
      payments: true,
    },
  });

  console.log("\nسفارش آزمایشی ایجاد شد:");
  console.dir(order, { depth: null });
  console.log("\nوضعیت: PENDING");
  console.log("پرداخت واقعی انجام نشده است.");
  console.log("موجودی محصول و سبد خرید تغییر نکرده‌اند.");
}

main()
  .catch((error) => {
    console.error("خطا در ساخت سفارش آزمایشی:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
