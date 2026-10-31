import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

// =========================================
// JWT
// =========================================

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET در فایل env تنظیم نشده است.");
  }

  return secret;
};

export const createAuthToken = (user) => {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      username: user.username,
    },
    getJwtSecret(),
    {
      expiresIn: "24h",
    },
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

// =========================================
// PHONE
// =========================================

export const normalizePhone = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  let phone = value.trim();

  if (phone.startsWith("+98")) {
    phone = `0${phone.slice(3)}`;
  } else if (phone.startsWith("0098")) {
    phone = `0${phone.slice(4)}`;
  }

  if (!/^09\d{9}$/.test(phone)) {
    return null;
  }

  return phone;
};

// =========================================
// PASSWORD
// =========================================

export const isValidPassword = (password) => {
  if (typeof password !== "string") {
    return false;
  }

  const byteLength = Buffer.byteLength(password, "utf8");

  if (password.length < 8) {
    return false;
  }

  if (byteLength > 72) {
    return false;
  }

  // فقط کاراکترهای ASCII قابل چاپ
  return /^[\x21-\x7E]+$/.test(password);
};

export const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

// =========================================
// LOGIN
// =========================================

export const loginUser = async (identifier, password) => {
  if (
    typeof identifier !== "string" ||
    typeof password !== "string" ||
    !identifier.trim()
  ) {
    throw new Error("نام کاربری یا شماره موبایل و رمز عبور الزامی است.");
  }

  const normalizedIdentifier = identifier.trim();
  const normalizedPhone = normalizePhone(normalizedIdentifier);

  const conditions = [
    {
      username: normalizedIdentifier,
    },
  ];

  if (normalizedPhone) {
    conditions.push({
      phone: normalizedPhone,
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: conditions,
    },
  });

  if (!user) {
    throw new Error("اطلاعات ورود نادرست است.");
  }

  if (!user.isActive || user.deletedAt) {
    throw new Error("این حساب کاربری غیرفعال شده است.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error("اطلاعات ورود نادرست است.");
  }

  return user;
};

// =========================================
// REGISTER
// =========================================

export const registerUser = async (username, phone, password) => {
  if (typeof username !== "string") {
    throw new Error("نام کاربری نامعتبر است.");
  }

  const normalizedUsername = username.trim();

  if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
    throw new Error("نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد.");
  }

  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    throw new Error("شماره موبایل نامعتبر است.");
  }

  if (!isValidPassword(password)) {
    throw new Error(
      "رمز عبور باید حداقل ۸ کاراکتر و فقط شامل حروف انگلیسی، اعداد و نمادها باشد.",
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        {
          username: normalizedUsername,
        },
        {
          phone: normalizedPhone,
        },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.username === normalizedUsername) {
      throw new Error("این نام کاربری قبلاً ثبت شده است.");
    }

    throw new Error("این شماره موبایل قبلاً ثبت شده است.");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      phone: normalizedPhone,
      passwordHash,
      role: "USER",
      permissions: [],
      isActive: true,
      deletedAt: null,
    },
  });

  return user;
};

// =========================================
// CURRENT USER
// =========================================

export const getUserById = async (userId) => {
  return prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
    select: {
      id: true,
      username: true,
      phone: true,
      role: true,
      permissions: true,
      isActive: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
