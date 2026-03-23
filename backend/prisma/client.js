require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
