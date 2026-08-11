<!--
Sync Impact Report
- Version change: none → 1.0.0 (initial ratification)
- Modified principles: n/a (first draft)
- Added sections: Core Principles (5), Technology & Integration Constraints, Development Workflow, Governance
- Removed sections: n/a
- Follow-up TODOs: none — inferred from docs/VISAO-GERAL-DO-PROJETO.md and repo state on 2026-08-11
-->

# Reforma Maestro Constitution

## Core Principles

### I. Simplicity First (No Backend Creep)
This project is a static/serverless landing page — no backend, no database, no
auth. Any proposal to add server-side infrastructure, a database, or user
accounts MUST be justified against the actual business need (infoproduct
sales via Kiwify checkout) before being accepted. Default to the simplest
implementation that Next.js + static content can support; reject speculative
scalability work.

### II. SEO & Content Integrity
Organic search is the primary acquisition channel (blog, schema markup,
`/sobre` for E-E-A-T). SEO structure (sitemap, robots, internal linking per
`regras_SEO.md`) MUST be preserved or improved, never regressed, by feature
work. Structured data (`schema-markup.tsx`, `Product` rating, testimonials)
MUST reflect real, verifiable information — fabricated or unverifiable
reviews/ratings are prohibited regardless of SEO benefit.

### III. Next.js as the Canonical Stack
`frontend-next/` (Next.js 16 App Router, React 19, TypeScript, Tailwind +
shadcn/ui) is the only actively developed frontend. `frontend/` (legacy
Lovable/Vite prototype) MUST NOT receive new features; it is a removal
candidate once confirmed unused in production.

### IV. Manual Fulfillment is an Accepted Trade-off
Checkout (Kiwify) and product fulfillment (manual Google Sheets provisioning
via `scripts/create-spreadsheet.ts` / `populate-spreadsheet.ts`) are an
intentional low-complexity design, not a defect. Building webhook automation,
a fulfillment backend, or API integrations between Kiwify and Google Sheets
requires an explicit business decision — it is out of scope by default.

### V. Revenue-Path & Credential Safety
Code paths that affect conversion (`Pricing.tsx`, checkout link, page speed,
Core Web Vitals) are treated as revenue-critical and changed carefully with a
manual browser check before merge. Google Service Account keys and other
secrets MUST NEVER be committed (`*.json` is gitignored except
`package.json`/`tsconfig.json`); any new credential type must be added to
`.gitignore` before first use.

## Technology & Integration Constraints

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind, shadcn/ui,
hosted on Vercel. External integrations are limited to: Kiwify (checkout
link only, no API/webhook), Google Sheets/Drive API (offline admin scripts
only, Service Account credentials kept out of version control), Google
Analytics 4, Google Search Console. No SINAPI integration exists or is
planned — any marketing mention of SINAPI is textual/illustrative only and
MUST NOT imply a real data integration.

## Development Workflow

There is no automated test suite and none is required for content/marketing
changes; use the Spec Kit flow (`/speckit-specify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement`) for non-trivial features or
structural changes. Before merging changes that touch the landing page,
verify the change in a running dev server (`npm run dev` in `frontend-next/`)
covering the affected section and, if SEO-relevant, confirm sitemap/schema
still validate. Domain/canonical-URL changes require confirming Search
Console, Kiwify, and any backlinks point at the final domain
(`orcaobra.roilabs.com.br`) before shipping.

## Governance

This constitution supersedes ad-hoc practice for this repository. Amendments
require: a documented rationale, a version bump per semantic versioning
(MAJOR for incompatible principle removal/redefinition, MINOR for a new or
materially expanded principle, PATCH for wording/clarification), and an
updated Sync Impact Report at the top of this file. Any Spec Kit
`/speckit-plan` that proposes work conflicting with a Core Principle must
either justify the deviation explicitly in the plan's Complexity Tracking
section or be revised to comply.

**Version**: 1.0.0 | **Ratified**: 2026-08-11 | **Last Amended**: 2026-08-11
