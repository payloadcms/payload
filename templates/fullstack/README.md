# Payload Fullstack Template

Canonical schema boundary for a Payload + Next.js fullstack application. The template owns the
`users`, `posts`, `categories`, and `media` collections, the `menu` global, and the `hero`,
`featureGrid`, and `callToAction` layout block contracts.

## Supported toolchain

- Node.js `>=24.15.0`
- pnpm `11.9.x` (the repository workspace also accepts pnpm 9 or 10 for consumers)
- Payload `4.0.0-canary.14` and Next.js `16.3.3`

## Local setup

```bash
cp .env.example .env
pnpm install
pnpm generate:types
pnpm generate:importmap
```

Set `DATABASE_URL` to a MongoDB connection string and `PAYLOAD_SECRET` to a long random secret before starting the app.

Run the template's Next.js app with `pnpm dev` after configuring the Payload database. Use `pnpm build && pnpm start` for production. The
public `/posts/[slug]` route only queries published posts and renders the local layout blocks.
This package intentionally does not import `test/_community`; the community suite remains
compatibility fixture data.

Run focused verification with `pnpm test` (unit contracts plus the template boundary check), or
run `pnpm test:unit` and `pnpm check:boundary` separately. `pnpm lint`, `pnpm generate:types`,
and `pnpm generate:importmap` are also supported from this directory.
