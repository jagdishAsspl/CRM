import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const latestVerification = await prisma.verification.findFirst({
    orderBy: { createdAt: "desc" },
  });

  console.log("\n========================================");
  if (latestVerification) {
    console.log(`Latest OTP Code: ${latestVerification.value}`);
    console.log(`Identifier/Email: ${latestVerification.identifier}`);
    console.log(`Expires At: ${latestVerification.expiresAt}`);
  } else {
    console.log("No OTP code found in database.");
  }
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
