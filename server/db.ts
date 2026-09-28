import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertProject, InsertUser, offers, projects, savedProjects, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listProjects(filters: { search?: string; category?: string }) {
  const db = await getDb();
  if (!db) return [];
  await ensureDemoProjects(db);
  const conditions = [];
  if (filters.category) conditions.push(like(projects.category, `%${filters.category}%`));
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(or(like(projects.name, term), like(projects.startup, term), like(projects.category, term), like(projects.description, term), like(projects.tech, term)));
  }
  const query = db.select().from(projects).orderBy(desc(projects.createdAt));
  return conditions.length ? query.where(and(...conditions)) : query;
}

const demoProjects: InsertProject[] = [
  { name: "AIFlow", startup: "NovaTech Labs", category: "AI / SaaS", description: "AI customer support platform that turns product knowledge into fast, reliable resolutions.", tech: JSON.stringify(["Python", "React", "OpenAI API", "PostgreSQL"]), status: "OPEN FOR ACQUISITION", revenue: "₹8.5L / month", users: "25,000", price: "₹2.5 Cr", acquisitionType: "Product + Team", color: "blue", logo: "AF", isDemo: 1 },
  { name: "ShopPilot", startup: "Orbit Commerce", category: "E-commerce", description: "Conversion-focused storefront automation for growing D2C brands.", tech: JSON.stringify(["Next.js", "Node.js", "AWS"]), status: "OPEN FOR ACQUISITION", revenue: "₹4.1L / month", users: "9,800", price: "₹1.2 Cr", acquisitionType: "Product Only", color: "orange", logo: "SP", isDemo: 1 },
  { name: "CodeForge", startup: "Stacksmith", category: "Developer Tools", description: "Cloud workspace that helps engineering teams ship production-ready APIs faster.", tech: JSON.stringify(["TypeScript", "Docker", "AWS"]), status: "OPEN FOR ACQUISITION", revenue: "₹2.6L / month", users: "4,200", price: "₹78L", acquisitionType: "Technology / IP", color: "violet", logo: "CF", isDemo: 1 },
  { name: "HealthTrack", startup: "Wellbyte", category: "HealthTech", description: "Patient engagement and care-plan software for modern clinics.", tech: JSON.stringify(["React Native", "Node.js", "MongoDB"]), status: "DUE DILIGENCE", revenue: "₹6.2L / month", users: "18,600", price: "₹1.8 Cr", acquisitionType: "Full Startup", color: "green", logo: "HT", isDemo: 1 },
  { name: "EduSphere", startup: "Northstar Learning", category: "EdTech", description: "Adaptive learning platform with content intelligence for coaching institutes.", tech: JSON.stringify(["React", "Python", "GCP"]), status: "OPEN FOR ACQUISITION", revenue: "₹1.9L / month", users: "11,400", price: "₹64L", acquisitionType: "Product + Team", color: "pink", logo: "ES", isDemo: 1 },
  { name: "FleetIQ", startup: "Route Labs", category: "Enterprise Software", description: "Fleet intelligence suite for cost, utilization, and route optimization.", tech: JSON.stringify(["Vue", "Go", "Postgres"]), status: "NEGOTIATING", revenue: "₹10.4L / month", users: "2,850", price: "₹3.4 Cr", acquisitionType: "Full Startup", color: "teal", logo: "FI", isDemo: 1 },
  { name: "FinMate", startup: "Decimal Works", category: "FinTech", description: "Cash-flow intelligence and reconciliation tools for independent businesses.", tech: JSON.stringify(["React", "Node.js", "Razorpay"]), status: "OPEN FOR ACQUISITION", revenue: "₹3.4L / month", users: "7,100", price: "₹92L", acquisitionType: "Asset Acquisition", color: "gold", logo: "FM", isDemo: 1 },
  { name: "CyberGuard", startup: "Redline Security", category: "Cybersecurity", description: "Practical security posture monitoring for lean teams and SaaS operators.", tech: JSON.stringify(["Python", "FastAPI", "AWS"]), status: "OPEN FOR ACQUISITION", revenue: "₹5.8L / month", users: "1,900", price: "₹1.5 Cr", acquisitionType: "Technology / IP", color: "slate", logo: "CG", isDemo: 1 },
];

async function ensureDemoProjects(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const existing = await db.select({ id: projects.id }).from(projects).limit(1);
  if (!existing.length) await db.insert(projects).values(demoProjects);
}

export async function getProject(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(projects).values(project);
  return getProject(Number(result[0].insertId));
}

export async function createOffer(input: { projectId: number; buyerId: number; offerPrice: string; paymentStructure: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(offers).values(input);
  const rows = await db.select().from(offers).where(eq(offers.id, Number(result[0].insertId))).limit(1);
  return rows[0];
}

export async function listOffersForBuyer(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(offers).where(eq(offers.buyerId, buyerId)).orderBy(desc(offers.createdAt));
}

export async function toggleSavedProject(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const existing = await db.select().from(savedProjects).where(and(eq(savedProjects.userId, userId), eq(savedProjects.projectId, projectId))).limit(1);
  if (existing[0]) {
    await db.delete(savedProjects).where(eq(savedProjects.id, existing[0].id));
    return { saved: false };
  }
  await db.insert(savedProjects).values({ userId, projectId });
  return { saved: true };
}

export async function getDashboardSummary(userId: number) {
  const db = await getDb();
  if (!db) return { listedProjects: 0, buyerViews: 0, offersReceived: 0, savedProjects: 0, offersSubmitted: 0, activeNegotiations: 0 };
  const owned = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.ownerId, userId));
  const submitted = await db.select({ count: sql<number>`count(*)` }).from(offers).where(eq(offers.buyerId, userId));
  const saved = await db.select({ count: sql<number>`count(*)` }).from(savedProjects).where(eq(savedProjects.userId, userId));
  const received = await db.select({ count: sql<number>`count(*)` }).from(offers).innerJoin(projects, eq(offers.projectId, projects.id)).where(eq(projects.ownerId, userId));
  const active = await db.select({ count: sql<number>`count(*)` }).from(offers).where(and(eq(offers.buyerId, userId), eq(offers.status, "NEGOTIATING")));
  return { listedProjects: Number(owned[0]?.count ?? 0), buyerViews: 0, offersReceived: Number(received[0]?.count ?? 0), savedProjects: Number(saved[0]?.count ?? 0), offersSubmitted: Number(submitted[0]?.count ?? 0), activeNegotiations: Number(active[0]?.count ?? 0) };
}
