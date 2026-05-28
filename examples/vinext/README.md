# Payload on vinext

Minimal Payload example running through [vinext](https://www.npmjs.com/package/vinext).

## Quick Start

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the app:

```bash
pnpm dev
```

4. Open `http://localhost:3000/admin` and create the first user.

The example defaults to a local SQLite DB at `payload-template.db`; this file is created automatically the first time you run migrations through the app.
