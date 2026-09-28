import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  createOffer: vi.fn(),
  createProject: vi.fn(),
  getDashboardSummary: vi.fn(),
  getProject: vi.fn(),
  listOffersForBuyer: vi.fn(),
  listProjects: vi.fn(),
  listProjectsByOwner: vi.fn(),
  listSavedProjects: vi.fn(),
  toggleSavedProject: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const mockedDb = vi.mocked(db);

function makeContext(user: TrpcContext["user"] = undefined): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const sampleUser = {
  id: 7,
  openId: "buyer-7",
  email: "buyer@example.com",
  name: "Buyer Seven",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const sampleProject = {
  id: 11,
  ownerId: null,
  name: "AIFlow",
  startup: "NovaTech Labs",
  category: "AI / SaaS",
  description: "A product knowledge assistant for support teams.",
  tech: '["React","PostgreSQL"]',
  status: "OPEN FOR ACQUISITION",
  revenue: "₹8.5L / month",
  users: "25,000",
  price: "₹2.5 Cr",
  acquisitionType: "Product + Team",
  color: "blue",
  logo: "AF",
  isDemo: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("marketplace procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes stored technology JSON for public listing cards", async () => {
    mockedDb.listProjects.mockResolvedValue([sampleProject]);
    const result = await appRouter.createCaller(makeContext()).projects.list({ search: "AI" });
    expect(mockedDb.listProjects).toHaveBeenCalledWith({ search: "AI" });
    expect(result[0]?.tech).toEqual(["React", "PostgreSQL"]);
    expect(result[0]?.isDemo).toBe(1);
  });

  it("requires authentication before publishing a project", async () => {
    const caller = appRouter.createCaller(makeContext());
    await expect(caller.projects.create({
      name: "New project", startup: "New startup", category: "SaaS", description: "A sufficiently long description for a project.", tech: ["React"], price: "Negotiable", acquisitionType: "Product Only", logo: "NP",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("persists an authenticated project with its owner id", async () => {
    mockedDb.createProject.mockResolvedValue(sampleProject);
    const caller = appRouter.createCaller(makeContext(sampleUser));
    const result = await caller.projects.create({
      name: "New project", startup: "New startup", category: "SaaS", description: "A sufficiently long description for a project.", tech: ["React"], price: "Negotiable", acquisitionType: "Product Only", logo: "NP",
    });
    expect(mockedDb.createProject).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, tech: '["React"]', isDemo: 0 }));
    expect(result?.tech).toEqual(["React", "PostgreSQL"]);
  });

  it("persists offers and saved-project toggles for an authenticated buyer", async () => {
    mockedDb.createOffer.mockResolvedValue({ id: 21, projectId: 11, buyerId: 7, offerPrice: "₹1 Cr", paymentStructure: "Full acquisition", message: "Interested in acquiring this product.", status: "SUBMITTED", createdAt: new Date(), updatedAt: new Date() });
    mockedDb.toggleSavedProject.mockResolvedValue({ saved: true });
    const caller = appRouter.createCaller(makeContext(sampleUser));
    const offer = await caller.offers.create({ projectId: 11, offerPrice: "₹1 Cr", paymentStructure: "Full acquisition", message: "Interested in acquiring this product." });
    const saved = await caller.projects.save({ projectId: 11 });
    expect(offer.status).toBe("SUBMITTED");
    expect(saved).toEqual({ saved: true });
    expect(mockedDb.createOffer).toHaveBeenCalledWith(expect.objectContaining({ buyerId: 7, projectId: 11 }));
    expect(mockedDb.toggleSavedProject).toHaveBeenCalledWith(7, 11);
  });

  it("returns the authenticated user's workspace listings and saved projects", async () => {
    mockedDb.listProjectsByOwner.mockResolvedValue([sampleProject]);
    mockedDb.listSavedProjects.mockResolvedValue([sampleProject]);
    const caller = appRouter.createCaller(makeContext(sampleUser));
    const mine = await caller.projects.mine();
    const saved = await caller.projects.saved();
    expect(mine[0]?.name).toBe("AIFlow");
    expect(saved[0]?.tech).toEqual(["React", "PostgreSQL"]);
    expect(mockedDb.listProjectsByOwner).toHaveBeenCalledWith(7);
    expect(mockedDb.listSavedProjects).toHaveBeenCalledWith(7);
  });
});
