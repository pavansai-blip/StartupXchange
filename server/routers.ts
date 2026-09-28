import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createOffer, createProject, deleteProjectForOwner, getDashboardSummary, getProject, listOffersForBuyer, listProjects, listProjectsByOwner, listSavedProjects, toggleSavedProject } from "./db";

const projectInput = z.object({
  name: z.string().min(2).max(160), startup: z.string().min(2).max(160), category: z.string().min(2).max(120), description: z.string().min(20),
  tech: z.array(z.string()).min(1), status: z.string().default("OPEN FOR ACQUISITION"), revenue: z.string().default("Pre-revenue"), users: z.string().default("Not disclosed"), price: z.string().min(1), acquisitionType: z.string().min(2), color: z.string().default("blue"), logo: z.string().min(1).max(8),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  projects: router({
    list: publicProcedure.input(z.object({ search: z.string().optional(), category: z.string().optional() }).optional()).query(async ({ input }) => {
      const rows = await listProjects(input ?? {});
      return rows.map(row => ({ ...row, tech: safeJsonArray(row.tech) }));
    }),
    get: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const row = await getProject(input.id);
      return row ? { ...row, tech: safeJsonArray(row.tech) } : null;
    }),
    create: protectedProcedure.input(projectInput).mutation(async ({ ctx, input }) => {
      const row = await createProject({ ...input, ownerId: ctx.user.id, tech: JSON.stringify(input.tech), isDemo: 0 });
      return row ? { ...row, tech: safeJsonArray(row.tech) } : null;
    }),
    mine: protectedProcedure.query(async ({ ctx }) => (await listProjectsByOwner(ctx.user.id)).map(row => ({ ...row, tech: safeJsonArray(row.tech) }))),
    delete: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const deleted = await deleteProjectForOwner(input.projectId, ctx.user.id);
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found or not owned by this account." });
      return { deleted: true } as const;
    }),
    saved: protectedProcedure.query(async ({ ctx }) => (await listSavedProjects(ctx.user.id)).map(row => ({ ...row, tech: safeJsonArray(row.tech) }))),
    save: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).mutation(({ ctx, input }) => toggleSavedProject(ctx.user.id, input.projectId)),
  }),
  offers: router({
    create: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), offerPrice: z.string().min(1), paymentStructure: z.string().min(2), message: z.string().min(10) })).mutation(({ ctx, input }) => createOffer({ ...input, buyerId: ctx.user.id })),
    mine: protectedProcedure.query(({ ctx }) => listOffersForBuyer(ctx.user.id)),
  }),
  dashboard: router({ summary: protectedProcedure.query(({ ctx }) => getDashboardSummary(ctx.user.id)) }),
});

function safeJsonArray(value: string): string[] { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : value.split(",").map(x => x.trim()).filter(Boolean); } catch { return value.split(",").map(x => x.trim()).filter(Boolean); } }

export type AppRouter = typeof appRouter;
