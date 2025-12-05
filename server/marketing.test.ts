import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Marketing Agent API", () => {
  let testCampaignId: number;

  beforeAll(async () => {
    // Ensure test user exists
    const { upsertUser } = await import("./db");
    await upsertUser({
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
    });
  });

  it("should create a campaign", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.marketing.createCampaign({
      name: "Test Campaign",
      campaignBrief: "Test brief for AI tool",
      budget: 5000,
      targetPlatforms: ["linkedin", "email"],
      targetKpis: { roi: 2.0 },
    });

    expect(result).toHaveProperty("campaignId");
    expect(typeof result.campaignId).toBe("number");
    testCampaignId = result.campaignId;
  }, 10000);

  it("should list campaigns", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const campaigns = await caller.marketing.listCampaigns();

    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBeGreaterThan(0);
  });

  it("should get campaign by id", async () => {
    // Wait a bit for async workflow to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const campaign = await caller.marketing.getCampaign({ 
      campaignId: testCampaignId 
    });

    expect(campaign).not.toBeNull();
    expect(campaign?.name).toBe("Test Campaign");
    expect(campaign?.status).toBeDefined();
  });
});
