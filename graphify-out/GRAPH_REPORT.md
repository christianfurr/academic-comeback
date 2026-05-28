# Graph Report - .  (2026-05-28)

## Corpus Check
- 29 files · ~25,213 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 314 nodes · 716 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.85)
- Token cost: 108,947 input · 46,691 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Comeback UI Components|Comeback UI Components]]
- [[_COMMUNITY_Skyward HTML Scraper|Skyward HTML Scraper]]
- [[_COMMUNITY_Planner Home Page|Planner Home Page]]
- [[_COMMUNITY_Skyward Sync Review Flow|Skyward Sync Review Flow]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Grade Parser|Grade Parser]]
- [[_COMMUNITY_Credentials and Encryption|Credentials and Encryption]]
- [[_COMMUNITY_App State Utilities|App State Utilities]]
- [[_COMMUNITY_Convex Backend|Convex Backend]]
- [[_COMMUNITY_Design Spec and Architecture|Design Spec and Architecture]]
- [[_COMMUNITY_Root Layout and Fonts|Root Layout and Fonts]]
- [[_COMMUNITY_Project Instructions|Project Instructions]]
- [[_COMMUNITY_Vercel Config|Vercel Config]]
- [[_COMMUNITY_Middleware|Middleware]]
- [[_COMMUNITY_Sign Up Page|Sign Up Page]]
- [[_COMMUNITY_Sign In Page|Sign In Page]]
- [[_COMMUNITY_Next.js Env Declarations|Next.js Env Declarations]]
- [[_COMMUNITY_Package Deps Subgraph|Package Deps Subgraph]]

## God Nodes (most connected - your core abstractions)
1. `SkywardClient` - 21 edges
2. `HomePage()` - 19 edges
3. `ClassData` - 19 edges
4. `gradeTone()` - 15 edges
5. `fmt()` - 14 edges
6. `ParsedCourse` - 13 edges
7. `CategoryBlock()` - 11 edges
8. `tryGenericFormat()` - 11 edges
9. `SkywardError` - 11 edges
10. `ComebackHeader()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Logo()` --semantically_similar_to--> `Comeback Arc Mark Icon`  [INFERRED] [semantically similar]
  src/components/Logo.tsx → src/app/icon.svg
- `@clerk/nextjs` --conceptually_related_to--> `HomePage()`  [INFERRED]
  package.json → src/app/page.tsx
- `calcu package.json` --conceptually_related_to--> `Tech Stack (Next.js 16, Convex, Clerk, Tailwind v4)`  [INFERRED]
  package.json → README.md
- `Tech Stack (Next.js 16, Convex, Clerk, Tailwind v4)` --conceptually_related_to--> `Convex Auth Config (Clerk Provider)`  [INFERRED]
  README.md → convex/auth.config.ts
- `No automatic retries — fail loudly` --rationale_for--> `syncFromSkyward`  [EXTRACTED]
  docs/superpowers/specs/2026-05-28-skyward-sync-design.md → convex/skyward.ts

## Hyperedges (group relationships)
- **Skyward credential encrypt/store/retrieve/decrypt lifecycle** — convex_skyward_setcredentials, convex_skyward_encryptstring, convex_skywarddata_upsertcredentials, convex_schema_skywardcredentials, convex_skywarddata_getcredentialsforaction, convex_skyward_decryptstring, convex_skyward_syncfromskyward [EXTRACTED 0.95]
- **Skyward sync UI flow (connect, button, term, review)** — app_page_homepage, components_skywardconnectmodal_skywardconnectmodal, components_skywardsyncbutton_skywardsyncbutton, components_skywardtermpicker_skywardtermpicker, components_skywardsyncresultmodal_skywardsyncresultmodal [EXTRACTED 0.95]
- **Class source provenance display (badge across views)** — components_sourcebadge_sourcebadge, components_classdetail_classdetail, components_classtabs_classtabs [EXTRACTED 0.95]
- **Skyward end-to-end sync** — skyward_auth_login, skyward_client_skywardclient, parsers_gradebook_parsegradebook, parsers_assignments_parseassignmentsascategories, hooks_useskywardsync_useskywardsync [INFERRED 0.95]
- **Diff and apply sync review** — lib_syncclass_diffclassfromparsed, lib_syncclass_hasremovals, hooks_useskywardsync_buildreview, hooks_useskywardsync_useskywardsync [INFERRED 0.95]
- **ParsedCourse to ClassData pipeline** — lib_parser_parsegradedata, lib_normalize_normalizeparsedcourses, lib_types_parsedcourse, lib_types_classdata [INFERRED 0.85]

## Communities (21 total, 5 thin omitted)

### Community 0 - "Comeback UI Components"
Cohesion: 0.14
Nodes (38): CategoriesSection(), CategoryBlock(), ComebackHeader(), ComebackPath(), Props, StickyProjectedBar(), Props, ClassTabs() (+30 more)

### Community 1 - "Skyward HTML Scraper"
Cohesion: 0.12
Nodes (30): Skyward scrape pipeline, ParsedCategory, cellText(), extractInner(), maybeDateLike(), maybeFloat(), parseAssignmentsAsCategories(), parseTermSummary() (+22 more)

### Community 2 - "Planner Home Page"
Cohesion: 0.08
Nodes (30): size, Comeback Arc Mark Icon, HomePage(), usePlannerState Hook Usage, Props, Logo(), LogoProps, STEPS (+22 more)

### Community 3 - "Skyward Sync Review Flow"
Cohesion: 0.11
Nodes (23): Props, Props, Stage, Skyward sync review flow, Keep-stale merge with confirm-removal flow, buildReview(), ClassMeta, matchCourseToClass() (+15 more)

### Community 4 - "Package Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, next, react, react-dom, vercel, devDependencies, eslint, eslint-config-next (+18 more)

### Community 5 - "Grade Parser"
Cohesion: 0.17
Nodes (20): Props, Hero(), Props, Multi-format grade parsing, ColumnMap, groupIntoCourses(), isHeaderRow(), isMissingToken() (+12 more)

### Community 6 - "Credentials and Encryption"
Cohesion: 0.15
Nodes (21): skywardCredentials table, clearCredentials, decryptString(), encryptString(), loadKey(), mapWithConcurrency(), parsedAssignmentValidator, parsedCategoryValidator (+13 more)

### Community 7 - "App State Utilities"
Cohesion: 0.20
Nodes (16): Props, Props, DEFAULT_TWEAKS, appStateToJson(), buildAppState(), parseAppStateJson(), clearLocalState(), loadLocalState() (+8 more)

### Community 8 - "Convex Backend"
Cohesion: 0.33
Nodes (10): Per-User Data Isolation via identity.subject, Convex Auth Config (Clerk Provider), clear, get, set, by_userId Index, plannerStates Table Schema, calcu package.json (+2 more)

### Community 9 - "Design Spec and Architecture"
Cohesion: 0.20
Nodes (11): Comeback / Protocol Next.js App Design Spec, Accessibility: aria-live, skip-link, focus-visible, Convex-ready state shape (string ids, flat, serializable), Grade math: computeGrade, computeProjected, computeNeeded, localStorage to Convex migration path, No global store; App owns all state, Grade data parser (portal + generic formats), Stack: Next.js 15 App Router, TS, Tailwind, localStorage (+3 more)

### Community 10 - "Root Layout and Fonts"
Cohesion: 0.18
Nodes (9): bricolage, instrumentSerif, interTight, jetBrainsMono, metadata, RootLayout(), Comeback / Protocol Academic Recovery Planner, Vercel Project Link (academic-comback) (+1 more)

### Community 11 - "Project Instructions"
Cohesion: 0.50
Nodes (4): AGENTS Conventions Doc, CLAUDE.md Project Instructions, Read Convex Guidelines First, Next.js Differs From Training Data

### Community 12 - "Vercel Config"
Cohesion: 0.50
Nodes (3): orgId, projectId, projectName

## Knowledge Gaps
- **89 isolated node(s):** `config`, `name`, `version`, `private`, `dev` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomePage()` connect `Planner Home Page` to `Comeback UI Components`, `Skyward Sync Review Flow`, `Package Dependencies`, `Credentials and Encryption`, `App State Utilities`, `Root Layout and Fonts`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Package Dependencies` to `Credentials and Encryption`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `@clerk/nextjs` connect `Package Dependencies` to `Planner Home Page`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `HomePage()` (e.g. with `RootLayout()` and `Clerk Middleware Handler`) actually correct?**
  _`HomePage()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ClassData` (e.g. with `ComebackPath()` and `ParsedCourse`) actually correct?**
  _`ClassData` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _94 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Comeback UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.13714285714285715 - nodes in this community are weakly interconnected._