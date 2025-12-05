# Building an AI-Powered Marketing Dashboard: From Zero to MVP
## Introduction

Over the past few weeks, We've built **AI Marketing Agent Dashboard**, a full-stack web application that automates marketing campaign creation using multi-agent AI systems. This journey involved designing a complex backend architecture, building a responsive frontend, integrating real LLM APIs, and iterating based on user feedback. In this post, I'll walk through the entire development process, the bugs we encountered, and how we solved them.

## Project Overview

**AI Marketing Agent Dashboard** is a SaaS platform that helps businesses launch complete marketing campaigns in minutes. Users input their brand URL and campaign brief, and AI agents autonomously:

- Analyze the brand and market positioning

- Generate platform-optimized content (Instagram, TikTok, YouTube, etc.)

- Recommend influencer types and outreach strategies

- Provide budget optimization recommendations

**Tech Stack:**

- Frontend: React 19 + Tailwind CSS 4 + TypeScript

- Backend: Express.js + tRPC 11 + Node.js

- Database: MySQL with Drizzle ORM

- AI: Claude LLM API for content generation

- Authentication: Manus OAuth

---

## Phase 1: Project Planning & Database Design

### Initial Setup

I started by scaffolding a web project with database and user management features. The first critical decision was designing the database schema to support:

1. **Campaigns**: Store campaign metadata (brand URL, brief, platforms, budget)

1. **Campaign Results**: Store AI-generated content (brand analysis, creative content, KOL recommendations)

1. **Users**: Track who created each campaign

The schema included:

```sql
campaigns {
  id, userId, brandUrl, campaignBrief, targetPlatforms, budget, 
  createdAt, updatedAt
}

campaignResults {
  id, campaignId, brandAnalysis (JSON), creativeContent (JSON), 
  kolRecommendations (JSON), generatedImages (JSON), createdAt
}
```

This structure allowed flexibility to store complex nested data from AI agents while maintaining referential integrity.

### Key Decision: JSON Storage

Rather than normalizing every field into separate tables, I stored AI-generated results as JSON. This was crucial because:

- AI outputs are semi-structured and evolve over time

- We could iterate on the data format without migrations

- Query flexibility for different content types

---

## Phase 2: Backend API Integration

### Integrating Marketing Agent Modules

The core AI logic came from existing Marketing Agent modules. I copied the agent implementations to the server and exposed them via tRPC procedures:

```typescript
// server/routers.ts
export const appRouter = router({
  campaigns: router({
    create: protectedProcedure
      .input(createCampaignSchema)
      .mutation(async ({ ctx, input }) => {
        // 1. Scrape website content
        // 2. Run brand analysis agent
        // 3. Run content generation agents
        // 4. Run KOL recommendation agent
        // 5. Store results in database
      }),
    
    list: protectedProcedure.query(({ ctx }) => {
      // Fetch user's campaigns
    }),
    
    getDetail: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(({ ctx, input }) => {
        // Fetch campaign + results
      }),
  }),
});
```

### Challenge: Real-Time Status Updates

Initially, the campaign creation was a black box—users submitted a form and waited without feedback. The first iteration showed a loading spinner, but users didn't know what was happening.

**Solution**: I implemented a multi-step workflow display:

1. **Analyzing Brand** → Scraping website and extracting content

1. **Generating Content** → Running content generation agents

1. **Finding Influencers** → Running KOL recommendation agent

1. **Finalizing Campaign** → Saving to database

Each step updated the UI in real-time, giving users confidence the system was working.

---

## Phase 3: Frontend UI Development

### Landing Page & Campaign Creation

The frontend started with a tech-style landing page featuring:

- Hero section with gradient background

- Campaign creation form with platform selection

- Results visualization with charts and metrics

**First Bug: Checkbox Click Issue**

When users clicked the platform checkboxes in the campaign creation form, nothing happened. The issue was a React event handling problem—the checkboxes were inside a label element, causing double-click events.

```typescript
// ❌ Before (buggy)
<label>
  <input type="checkbox" onChange={handleChange} />
  Instagram
</label>

// ✅ After (fixed)
<div className="flex items-center gap-2">
  <input 
    id="instagram" 
    type="checkbox" 
    onChange={handleChange} 
  />
  <label htmlFor="instagram">Instagram</label>
</div>
```

### Dashboard Redesign: Multi-Tab Navigation

After the initial MVP, I received feedback that the single-page layout was confusing. Users wanted clear separation between:

- **Dashboard**: Overview and quick actions

- **Brand Analysis**: Detailed brand positioning

- **Creative Content**: Generated marketing assets

- **Campaigns**: Campaign history and management

I redesigned the UI with a sidebar navigation and implemented each section as a separate page. This made the app feel more like a professional tool.

**Second Bug: Nested Anchor Tags**

During the redesign, I accidentally created nested `<a>` tags in navigation links:

```jsx
// ❌ Buggy
<Link href="/dashboard">
  <a>
    <span>Dashboard</span>
  </a>
</Link>

// ✅ Fixed
<Link href="/dashboard">
  <span>Dashboard</span>
</Link>
```

The browser's HTML parser threw errors, and links became unclickable. This taught me to always check component composition in React.

---

## Phase 4: Critical Integration Challenge - Real Data vs. Fake Data

### The KOL Recommendation Problem

This was the biggest challenge of the project. Initially, the KOL recommendation feature returned fake influencer data:

```json
{
  "name": "TechInfluencer_2024",
  "platform": "Instagram",
  "followers": 245000,
  "engagementRate": "8.5%",
  "avgViews": "5K-10K",
  "estimatedCost": "$400-$600",
  "profileUrl": "https://instagram.com/...",
  "reason": "..."
}
```

**User Feedback**: "This is completely fake. I can't use these profiles. I need real data or actionable recommendations."

This was a critical realization—the AI was generating plausible-sounding but entirely fabricated influencer profiles, complete with fake follower counts and pricing.

### Solution: From Fake Profiles to Actionable Recommendations

Instead of generating fake influencer profiles, I pivoted to generating **influencer type recommendations** with actionable outreach strategies:

```json
{
  "name": "Tech Reviewer",
  "platform": "YouTube",
  "niche": "Product Reviews & Unboxing",
  "reason": "Tech reviewers have dedicated audiences interested in new gadgets. Your product's innovation angle aligns perfectly with their content style.",
  "outreachMessage": "Hi [Influencer Name], We noticed your recent review of [similar product]. We'd love to send you our latest [product] for an honest review..."
}
```

**Changes Made:**

1. **Backend**: Updated the LLM prompt to explicitly forbid generating fake numerical data

1. **Code-Level Filtering**: Added validation to strip out unwanted fields (followers, engagement, cost, URLs )

1. **Frontend**: Removed display of fake metrics entirely

```typescript
// Backend filtering
const kolRecommendations = response.map(kol => ({
  name: kol.name,
  platform: kol.platform,
  niche: kol.niche,
  reason: kol.reason,
  outreachMessage: kol.outreachMessage,
  // ✅ Explicitly exclude: followers, engagement, cost, profileUrl
}));
```

---

## Phase 5: Real Website Content Extraction

### Challenge: Website Scraping

Early versions used a simple fetch-based approach to extract website content:

```typescript
const response = await fetch(brandUrl);
const html = await response.text();
const title = html.match(/<title>(.*?)<\/title>/)?.[1];
```

This failed for:

- JavaScript-heavy websites (React, Vue apps)

- Websites with dynamic content loading

- Websites with complex layouts

**User Feedback**: "I provided Columbia University's website, but the brand analysis is completely wrong. It seems like you're not reading the actual content."

### Solution: Real Browser-Based Scraping

I implemented actual browser-based content extraction using a headless browser tool:

```typescript
// ✅ Real browser scraping
const page = await browser.newPage();
await page.goto(brandUrl, { waitUntil: 'networkidle2' });

// Extract actual rendered content
const content = await page.evaluate(() => {
  return {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent),
    paragraphs: Array.from(document.querySelectorAll('p')).map(p => p.textContent),
    links: Array.from(document.querySelectorAll('a')).map(a => a.href),
  };
});

await browser.close();
```

This dramatically improved brand analysis accuracy. The AI now had real content to work with instead of guesses.

---

## Phase 6: User Feedback Iterations

### Iteration 1: Navigation & 404 Errors

**User Report**: "The 'Create Campaign' button on the home page gives a 404 error."

**Root Cause**: The button was linking to `/create-campaign`, but the route was registered as `/campaigns/create`.

**Fix**: Standardized all routes and updated navigation links.

### Iteration 2: Missing Required Fields

**User Report**: "I can create a campaign without entering a website URL. The results don't make sense."

**Root Cause**: The form validation wasn't enforcing required fields.

**Fix**: Added proper validation:

```typescript
const createCampaignSchema = z.object({
  brandUrl: z.string().url("Valid URL required"),
  campaignBrief: z.string().min(10, "Brief must be at least 10 characters"),
  targetPlatforms: z.array(z.string()).min(1, "Select at least one platform"),
  budget: z.number().min(100, "Budget must be at least $100"),
});
```

### Iteration 3: SWOT Analysis Incomplete

**User Report**: "The SWOT analysis only shows Strengths and Opportunities. Where are Weaknesses and Threats?"

**Root Cause**: The LLM prompt was incomplete, and the frontend wasn't displaying all sections.

**Fix**: Updated the prompt to explicitly request all four SWOT components and fixed the frontend to display them.

---

## Phase 7: Performance & Optimization

### Challenge: Long Campaign Generation Times

Initial campaign creation took 2-3 minutes because agents ran sequentially:

```
Brand Analysis (30s) → Content Generation (60s) → KOL Recommendations (30s) → Save (5s)
```

**Solution**: Parallelized independent agents:

```typescript
const [brandAnalysis, creativeContent, kolRecommendations] = await Promise.all([
  runBrandAnalysisAgent(brandUrl, brief),
  runContentGenerationAgent(brandUrl, brief, platforms),
  runKolRecommendationAgent(brandUrl, brief),
]);
```

This reduced total time from 2-3 minutes to 60-90 seconds—a significant improvement for user experience.

---

## Phase 8: Lessons Learned

### 1. **Real Data > Fake Data**

The biggest lesson was that plausible-sounding fake data is worse than honest limitations. Users immediately recognized the fake influencer profiles and lost trust. By pivoting to actionable recommendations, we regained credibility.

### 2. **User Feedback is Gold**

Every major improvement came from user feedback:

- "This is fake" → Led to KOL redesign

- "The analysis is wrong" → Led to real browser scraping

- "I got a 404" → Led to route standardization

### 3. **Validation Matters**

Enforcing required fields and proper validation prevented users from creating invalid campaigns. It seems obvious in retrospect, but it's easy to overlook during rapid development.

### 4. **Real-Time Feedback Improves UX**

Showing step-by-step progress during campaign generation made the experience feel faster and more transparent, even though the actual time didn't change.

### 5. **Database Schema Flexibility is Key**

Storing AI outputs as JSON allowed us to iterate on the data format without migrations. This was crucial for rapid prototyping.

---

## Current State & Next Steps

The dashboard is now in a solid MVP state with:

- ✅ Real website content extraction

- ✅ Accurate brand analysis

- ✅ Actionable KOL recommendations

- ✅ Multi-platform content generation

- ✅ Campaign history and management

- ✅ User authentication

**Future Improvements:**

1. A/B testing framework for content variants

1. Real-time campaign performance analytics

1. Integration with social media APIs for direct publishing

1. Advanced audience targeting

1. ROI tracking and optimization

---

## Conclusion

Building AI Marketing Agent Dashboard taught me that the journey from MVP to a reliable product is iterative. It's not just about writing code—it's about:

- Listening to user feedback

- Recognizing when a feature isn't working (even if it's technically correct)

- Being willing to pivot when the data shows a better path

- Prioritizing real, accurate data over impressive-sounding fake data

The most impactful changes came from acknowledging problems and fixing them, not from adding more features. I hope this breakdown helps other builders understand the real challenges of building AI-powered products.

---

## Tech Stack Summary

| Component | Technology |
| --- | --- |
| Frontend | React 19, Tailwind CSS 4, TypeScript |
| Backend | Express.js, tRPC 11, Node.js |
| Database | MySQL, Drizzle ORM |
| AI | Claude LLM API |
| Authentication | Manus OAuth |
| Hosting | Manus Platform |
| Browser Automation | Headless Browser Tool |

****
