import prisma from "./src/config/prisma.js";

console.log("Shipping model:", typeof prisma.shippingMethod);

console.log(
  "Available models:",
  Object.keys(prisma).filter(
    (key) => !key.startsWith("$") && !key.startsWith("_"),
  ),
);

await prisma.$disconnect();
