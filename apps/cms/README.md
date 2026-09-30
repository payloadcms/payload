# Payload CMS on EC2 (MongoDB on a separate EC2)

This folder is a deployable Payload app that runs **this branch's `packages/` source**. It's not
the npm release. The Docker build compiles `payload`, `@payloadcms/next`, `ui`, `db-mongodb`,
`richtext-lexical`, `translations` and `graphql` from `packages/`, packs them into tarballs and
installs the app against them. This is the same approach Payload's CI uses to test templates.

```
                 Internet
                    │  80 / 443
        ┌───────────▼─────────────── EC2 #2: app server ─┐
        │  caddy (reverse proxy, automatic HTTPS)        │
        │    └─► cms (Next.js + Payload, port 3000)      │
        │          └─ /app/media  → docker volume "media"│
        └───────────┬────────────────────────────────────┘
                    │ 27017 (private VPC network only)
        ┌───────────▼─────────────── EC2 #1: database ───┐
        │  MongoDB (auth enabled)                        │
        └────────────────────────────────────────────────┘
```

| File                                  | Purpose                                                          |
| ------------------------------------- | ---------------------------------------------------------------- |
| `src/payload.config.ts`               | Payload config: MongoDB via `DATABASE_URL`, `SERVER_URL`, CORS/CSRF |
| `src/endpoints/health.ts`             | `GET /api/health`: pings MongoDB (used by the Docker healthcheck) |
| `Dockerfile`                          | Multi-stage build from the repo root → small standalone image    |
| `docker-compose.yml`, `Caddyfile`     | Production stack on the app EC2                                  |
| `.env.example`                        | Every setting the server needs                                   |
| `deploy/setup-app-server.sh`          | One-time bootstrap of a fresh EC2 (Docker, swap, clone)          |
| `deploy/check-db.sh`                  | Checks that the app EC2 can reach and write to MongoDB           |
| `deploy/deploy.sh`                    | Build + (re)start + wait until healthy                           |
| `deploy/mongodb/create-payload-user.js` | Creates the MongoDB user for Payload (run on the DB EC2)       |
| `scripts/pack-local-packages.mjs`     | Packs `packages/*` into tarballs for the app (used by the Dockerfile) |

---

## 1. AWS networking (security groups)

Put both instances in the **same VPC** and connect through the database's **private IP**.

| Security group | Inbound rule                     | Source                                   |
| -------------- | -------------------------------- | ---------------------------------------- |
| `cms-app-sg`   | TCP 80, TCP 443 (and UDP 443)    | `0.0.0.0/0` (and `::/0` for IPv6)        |
| `cms-app-sg`   | TCP 22                           | your IP only                             |
| `mongodb-sg`   | TCP 27017                        | **the security group `cms-app-sg`** (not an IP) |
| `mongodb-sg`   | TCP 22                           | your IP only                             |

Never open 27017 to `0.0.0.0/0`.

App instance size: the Docker build compiles the admin panel and needs about 6 GB of memory.
Use **t3.large / t4g.large (8 GB)** or bigger. The setup script adds 8 GB of swap, so a
4 GB instance also works, but builds will be slower. Give it at least **30 GB** of disk.

## 2. Prepare MongoDB (EC2 #1)

SSH into the MongoDB server.

**a) Make sure authentication is enabled.** If `mongosh` connects without credentials and
`show dbs` works, auth is off. Create an admin first while auth is still off:

```bash
mongosh --eval 'db.getSiblingDB("admin").createUser({ user: "admin", pwd: passwordPrompt(), roles: ["root"] })'
```

**b) Edit `/etc/mongod.conf`** so MongoDB listens on its private IP and requires auth:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1,10.0.1.23 # <- this server's PRIVATE IP (hostname -I)
security:
  authorization: enabled
```

```bash
sudo systemctl restart mongod
```

**c) Create the Payload user** (copy `deploy/mongodb/create-payload-user.js` to the server):

```bash
PAYLOAD_DB_PASSWORD='choose-a-strong-password' \
  mongosh -u admin -p --authenticationDatabase admin create-payload-user.js
```

The user only gets `readWrite` on the `payload` database.

> Payload also runs on a standalone (non-replica-set) MongoDB. Transactions are turned off
> automatically in that case. If you later convert it to a replica set, add
> `&replicaSet=<name>` to `DATABASE_URL` and Payload will use transactions.

## 3. Bootstrap the app server (EC2 #2, once)

Works on **Amazon Linux 2023** and **Ubuntu 22.04/24.04**, x86_64 or ARM (Graviton):

```bash
curl -fsSL https://raw.githubusercontent.com/atorpos/payloadcms/op-uat-mongodb/apps/cms/deploy/setup-app-server.sh -o setup.sh
sudo bash setup.sh                      # or: sudo bash setup.sh <repo-url> <branch>
exit                                    # log out and back in so docker works without sudo
```

It installs Docker (with Compose and Buildx), git and 8 GB of swap, then clones the repo to
`~/payloadcms` and creates `apps/cms/.env` from the example. If the repo is private, clone it
yourself first with a deploy key or token; the script skips cloning when `~/payloadcms` exists.

## 4. Configure `.env`

```bash
cd ~/payloadcms/apps/cms
nano .env
```

| Variable         | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | `mongodb://payload:<password>@<mongo-private-ip>:27017/payload?authSource=admin`       |
| `PAYLOAD_SECRET` | output of `openssl rand -hex 32`. Keep it stable; changing it logs everyone out         |
| `SERVER_URL`     | exactly what you type in the browser, no trailing slash: `http://<ec2-public-ip>` or `https://cms.example.com` |
| `SITE_ADDRESS`   | `:80` for plain HTTP on the IP, or `cms.example.com` for automatic HTTPS               |
| `CORS_ORIGINS`   | optional, comma-separated frontend origins that call the API with cookies               |

URL-encode special characters in the MongoDB password: `@` → `%40`, `:` → `%3A`, `/` → `%2F`,
`#` → `%23`, `?` → `%3F`.

Then verify the connection:

```bash
./deploy/check-db.sh
# ping ok: true / database: payload / authenticated as: [...] / write access: ok
```

## 5. Deploy

```bash
./deploy/deploy.sh
```

The first build takes about 5–10 minutes (it compiles the Payload packages). Later builds reuse
Docker's cache: when only the app changes (e.g. `apps/cms/src`), the package build is skipped and a
redeploy takes a minute or two. Changes under `packages/` rebuild the packages. When the script
prints `CMS is healthy`, open `SERVER_URL/admin` and create the first admin user.

## 6. Domain + HTTPS

1. Create a DNS `A` record `cms.example.com` → the app EC2's **Elastic IP**. Allocate one so
   the address survives instance stop/start.
2. In `.env` set `SITE_ADDRESS=cms.example.com` and `SERVER_URL=https://cms.example.com`.
3. `./deploy/deploy.sh`. Caddy obtains and renews the Let's Encrypt certificate by itself.

With an `https://` `SERVER_URL`, the auth cookie is marked `Secure` automatically.

## Day-to-day operations

```bash
cd ~/payloadcms/apps/cms
./deploy/deploy.sh --pull          # update to the latest commit of the branch and redeploy
docker compose ps                  # status (cms should be "healthy")
docker compose logs -f cms         # application logs
docker compose restart cms         # restart without rebuilding
curl -s localhost/api/health       # {"database":"up","status":"ok"}
```

**Backups**

- Database, on the MongoDB EC2 (or schedule it with cron):
  `mongodump --uri 'mongodb://admin:<pw>@127.0.0.1:27017/?authSource=admin' --db payload --archive=payload-$(date +%F).gz --gzip`
- Uploaded media, on the app EC2:
  `docker run --rm -v payload-cms_media:/media -v "$PWD":/backup busybox tar czf /backup/media-$(date +%F).tgz -C /media .`
- Or snapshot both EBS volumes with AWS Backup.

To keep media off the server entirely, use `@payloadcms/storage-s3`. Add it to
`PACKAGE_DIRS` in `scripts/pack-local-packages.mjs` together with `plugin-cloud-storage`,
add it to the turbo `--filter` list in the `Dockerfile`, then configure it in
`payload.config.ts`.

## Troubleshooting

| Symptom                                               | Cause / fix                                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Login succeeds but you're bounced back to login, or API calls return 403 | `SERVER_URL` doesn't exactly match the browser URL (http vs https, IP vs domain, port). Fix `.env` and redeploy. |
| `/api/health` → `503` / logs say `cannot connect to MongoDB` | Run `./deploy/check-db.sh`. Timeout → security group or `bindIp`. `Authentication failed` → user/password/`authSource`, or an un-encoded special character in the password. |
| Build killed / `exit code: 137`                       | Out of memory. Use an 8 GB instance or check that swap is on (`swapon --show`).                   |
| Caddy can't get a certificate                         | DNS doesn't point at the instance yet, or port 80/443 is closed. Check `docker compose logs caddy`. |

## Local development

```bash
cd apps/cms
cp .env.example .env               # DATABASE_URL=mongodb://127.0.0.1/payload, SERVER_URL=http://localhost:3000
pnpm install                       # installs the published payload@canary matching this branch's version
pnpm dev                           # http://localhost:3000/admin
```

To run against this branch's packages locally instead, build them from the repo root
(`pnpm build:core`), run `node apps/cms/scripts/pack-local-packages.mjs`, then `pnpm install`
in `apps/cms`. That rewrites `apps/cms/pnpm-workspace.yaml`, so don't commit that change.
After changing collections or fields, run `pnpm generate:types` and `pnpm generate:importmap`.

Test the production image locally:

```bash
docker compose build && docker compose up
```

## Keeping the branch up to date with upstream Payload

Everything here lives in `apps/cms` and nothing outside it was modified, so merging upstream
`main` into this branch won't conflict with it. After a merge that bumps the version, update
the `4.0.0-canary.*` versions in `apps/cms/package.json` (only used for local `pnpm install`;
the Docker build always uses the packages from the branch). Then redeploy.
