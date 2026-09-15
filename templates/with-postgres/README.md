# with-postgres

with-postgres

## Attributes

- **Database**: postgres
- **Storage Adapter**: localDisk

## Official Docker image

Payload publishes an official GHCR image for this starter at `ghcr.io/payloadcms/payload-with-postgres`.

- Release builds publish `latest`, `<payload-version>`, and `<payload-version>-<short-sha>`
- `main` branch builds publish `main` and `sha-<short-sha>`
- The container waits for `DATABASE_URL` and runs `pnpm payload migrate` before starting by default

Set `PAYLOAD_RUN_MIGRATIONS=false` if you want to skip automatic migrations at container startup.
