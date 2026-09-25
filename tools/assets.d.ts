// Ambient declarations for side-effect style imports (e.g. `import './index.scss'`).
// Under NodeNext, TypeScript raises TS2882 for these unless the module is declared.
// This file is wired into every package via `tsconfig.base.json`'s `include`, so
// individual packages no longer need their own `src/@types/assets.d.ts` for styles.
declare module '*.css'

declare module '*.scss'
