import "dotenv/config";
import prisma from "../src/config/prisma.js";
import { hashPassword } from "../src/services/auth.service.js";

const createAdmin = async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME یا ADMIN_PASSWORD در فایل .env تنظیم نشده است.",
    );
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("رمز عبور نباید بیشتر از 72 بایت باشد.");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  if (existingUser) {
    console.log("User " + username + " از قبل وجود دارد.");
    return;
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      username: username,
      passwordHash: passwordHash,
      role: "ADMIN",
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  console.log("Admin با موفقیت ساخته شد:");
  console.log(admin);
};

try {
  await createAdmin();
} catch (error) {
  console.error("Create admin error:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
