import "dotenv/config";

import prisma from "../config/prisma.js";
import { hashPassword } from "../services/auth.service.js";

const createAdmin = async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME or ADMIN_PASSWORD is not configured in .env.",
    );
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Password must not exceed 72 bytes.");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (existingUser) {
    console.log("User " + username + " already exists.");
    return;
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: "ADMIN",
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  console.log("Admin created successfully:");
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
