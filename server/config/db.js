const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('SQLite Database Connected via Prisma.');
  } catch (error) {
    console.error(`SQLite Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, prisma };
