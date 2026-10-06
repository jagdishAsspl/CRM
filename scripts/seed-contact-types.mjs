import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultTypes = [
  { name: "Customer", order: 1, v: 0 },
  { name: "Partner", order: 2, v: 0 },
  { name: "Vendor", order: 3, v: 0 },
];

async function main() {
  for (const item of defaultTypes) {
    const existing = await prisma.crm_Contact_Types.findFirst({
      where: { name: item.name },
    });
    if (!existing) {
      await prisma.crm_Contact_Types.create({ data: item });
    }
  }
  console.log("Contact types seeded successfully.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
