import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dummyEmail = "admin@demo.com";
  const dummyName = "Admin User";

  const user = await prisma.users.upsert({
    where: { email: dummyEmail },
    update: {
      userStatus: "ACTIVE",
      emailVerified: true,
      role: "admin",
    },
    create: {
      email: dummyEmail,
      name: dummyName,
      userStatus: "ACTIVE",
      emailVerified: true,
      role: "admin",
    },
  });

  console.log("-----------------------------------------");
  console.log("Successfully created/updated dummy user:");
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Name: ${user.name}`);
  console.log(`Role: ${user.role}`);
  console.log(`Status: ${user.userStatus}`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error creating dummy user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
