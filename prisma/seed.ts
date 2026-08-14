import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@applyflow.dev" },
    update: {},
    create: {
      email: "demo@applyflow.dev",
      name: "Demo User"
    }
  });

  const companies = await Promise.all(
    [
      ["SAP", "Walldorf", "Software"],
      ["Siemens", "Munich", "Industrial Technology"],
      ["Zalando", "Berlin", "E-Commerce"],
      ["Stripe", "Remote", "Fintech"],
      ["Celonis", "Munich", "Process Intelligence"]
    ].map(([name, location, industry]) =>
      prisma.company.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name
          }
        },
        update: {},
        create: {
          userId: user.id,
          name,
          location,
          industry
        }
      })
    )
  );

  const existingCount = await prisma.application.count({
    where: { userId: user.id }
  });

  if (existingCount === 0) {
    const seedApplications = [
      {
        company: companies[0],
        position: "Backend Developer",
        status: "APPLIED" as const,
        location: "Walldorf",
        workMode: "HYBRID" as const,
        appliedAt: new Date("2026-08-08T10:00:00.000Z")
      },
      {
        company: companies[1],
        position: "Software Engineer",
        status: "INTERVIEW" as const,
        location: "Munich",
        workMode: "HYBRID" as const,
        appliedAt: new Date("2026-08-04T10:00:00.000Z")
      },
      {
        company: companies[2],
        position: "Full Stack Engineer",
        status: "SCREENING" as const,
        location: "Berlin",
        workMode: "REMOTE" as const,
        appliedAt: new Date("2026-08-10T10:00:00.000Z")
      },
      {
        company: companies[3],
        position: "Frontend Engineer",
        status: "SAVED" as const,
        location: "Remote",
        workMode: "REMOTE" as const,
        appliedAt: null
      },
      {
        company: companies[4],
        position: "Software Engineer",
        status: "OFFER" as const,
        location: "Munich",
        workMode: "HYBRID" as const,
        appliedAt: new Date("2026-07-28T10:00:00.000Z")
      }
    ];

    for (const item of seedApplications) {
      await prisma.application.create({
        data: {
          userId: user.id,
          companyId: item.company.id,
          position: item.position,
          status: item.status,
          location: item.location,
          workMode: item.workMode,
          appliedAt: item.appliedAt,
          events: {
            create: {
              type: "APPLICATION_CREATED",
              description: "Application added to ApplyFlow"
            }
          }
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
