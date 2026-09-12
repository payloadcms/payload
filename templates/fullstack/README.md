# Payload Fullstack Template

Canonical schema boundary and starter for a modern Payload + Next.js App Router fullstack application. It features a complete publishing workflow, rich layout blocks, modular collections, and security-hardened link rendering.

## Quick Start

### 1. Clone & Install

```bash
cp .env.example .env
pnpm install
```

Configure your `.env` file with a valid MongoDB connection string and a secret key:

```env
DATABASE_URL=mongodb://127.0.0.1/fullstack
PAYLOAD_SECRET=replace-with-a-long-random-secret
```

### 2. Generate Types & Import Map

```bash
pnpm generate:types
pnpm generate:importmap
```

### 3. Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application, or navigate to [http://localhost:3000/admin](http://localhost:3000/admin) to create your first admin user and access the Payload CMS dashboard.

---

## How it Works

The template organizes data models, layout blocks, and frontend views into cleanly separated boundaries:

### Collections

- **Users (`src/collections/Users.ts`)**: Auth-enabled collection managing administrator credentials and access control for the Payload admin panel.
- **Posts (`src/collections/Posts.ts`)**: Editorial collection supporting draft/published workflow, categories, author relationships, slugs, and modular block layouts.
- **Categories (`src/collections/Categories.ts`)**: Taxonomy collection for organizing and filtering editorial posts.
- **Media (`src/collections/Media.ts`)**: Uploads collection for static assets with responsive image sizes and focal point selection.

### Layout Blocks

- **Hero (`src/components/blocks/Hero`)**: Visual header block with customizable headline, rich text body, and sanitized CTA button.
- **FeatureGrid (`src/components/blocks/FeatureGrid`)**: Multi-item showcase block for features, highlights, or value propositions.
- **CallToAction (`src/components/blocks/CallToAction`)**: Focused conversion banner with headline, description, and sanitized link button.

### Globals & Components

- **Menu (`src/globals/Menu.ts`)**: Site-wide navigation global configuring header navigation items and destinations.
- **RichText (`src/components/RichText`)**: Lexical-powered rich text renderer with integrated URL sanitization (`safeHref`) protecting against protocol-relative, `javascript:`, and malformed URIs.

---

## Verification & Scripts

- `pnpm test`: Runs Vitest unit contracts (12 tests) and standalone boundary integrity checks.
- `pnpm test:unit`: Executes unit tests for blocks, links, and components.
- `pnpm check:boundary`: Enforces isolation boundaries, preventing accidental couplings to internal test fixtures.
- `pnpm lint`: Runs ESLint across the template codebase.
- `pnpm build`: Compiles the Next.js application for production.
- `pnpm start`: Serves the compiled production application.

## Toolchain Support

- Node.js `>=24.15.0`
- pnpm `11.9.x` (also compatible with pnpm 9 and 10)
- Payload `4.0.0-canary.14` and Next.js `16.3.3`
