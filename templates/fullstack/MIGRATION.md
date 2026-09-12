# Community fixture compatibility

This template targets Payload `4.0.0-canary.14`, Next.js `16.3.3`, Node.js `>=24.15.0`, and pnpm
`11.9.x`. Run commands from `templates/fullstack`; `pnpm install`, `pnpm generate:types`, and
`pnpm generate:importmap` prepare a checkout, while `pnpm test` verifies its unit contracts and
template boundary without requiring MongoDB. `pnpm dev` and `pnpm build && pnpm start` require a
reachable MongoDB instance configured through `DATABASE_URL`.

`test/_community` remains the source fixture for existing test data. Its collection slugs, field
names, block slugs, and draft `_status` behavior map one-to-one to this template:

| Fixture                | Fullstack template                    |
| ---------------------- | ------------------------------------- |
| `PostsCollection`      | `src/collections/Posts/index.ts`      |
| `CategoriesCollection` | `src/collections/Categories/index.ts` |
| `MediaCollection`      | `src/collections/Media/index.ts`      |
| `HeroBlock`            | `src/blocks/Hero.ts`                  |
| `FeatureGridBlock`     | `src/blocks/FeatureGrid.ts`           |
| `CallToActionBlock`    | `src/blocks/CallToAction.ts`          |
| `MenuGlobal`           | `src/globals/Menu/index.ts`           |

Persisted fixture data is not migrated automatically. Use the Payload CLI commands supported by
the source and destination application for export/import, then verify document counts and media
files before switching an application to this template. This repository does not provide a
template-specific migration command or automatic data migration.
