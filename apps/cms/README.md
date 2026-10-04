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
        │    └─► cms (Next.js + Payload, port 3006)      │
        │          └─ /app/media  → docker volume "media"│
        └───────────┬────────────────────────────────────┘
                    │ 27017 (private VPC network only)
        ┌───────────▼─────────────── EC2 #1: database ───┐
        │  MongoDB (auth enabled)                        │
        └────────────────────────────────────────────────┘
```

| File                                    | Purpose                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/payload.config.ts`                 | Payload config: MongoDB via `DATABASE_URL`, `SERVER_URL`, CORS/CSRF                    |
| `src/endpoints/health.ts`               | `GET /api/health`: pings MongoDB (used by the Docker healthcheck)                      |
| `src/storage/s3.ts`                     | Optional S3 storage for uploads, turned on by `S3_BUCKET`                              |
| `src/collections/Posts.ts`              | Blog posts for the personal website (see "Blog posts")                                 |
| `src/collections/Pages.ts`              | Standalone pages such as About or Services (see "Pages and profiles")                  |
| `src/collections/Profiles.ts`           | Profiles: bio, links, skills, work history, education                                  |
| `src/collections/Clients.ts`            | Private client records: contacts, business type, importance (see "Clients and events") |
| `src/collections/Events.ts`             | Private records of sales events and exhibitions worldwide                              |
| `src/proxy.ts`, `src/twoFactor/`        | Two-factor authentication for every login (see "Two-factor authentication")            |
| `src/email/sendgrid.ts`                 | Sends emails such as "forgot password" through SendGrid (see "Email (SendGrid)")       |
| `src/hooks/revalidateWebsite.ts`        | Tells the website to refresh its pages when a post changes                             |
| `Dockerfile`                            | Multi-stage build from the repo root → small standalone image                          |
| `docker-compose.yml`, `Caddyfile`       | Production stack on the app EC2                                                        |
| `.env.example`                          | Every setting the server needs                                                         |
| `deploy/setup-app-server.sh`            | One-time bootstrap of a fresh EC2 (Docker, swap, clone)                                |
| `deploy/check-db.sh`                    | Checks that the app EC2 can reach and write to MongoDB                                 |
| `deploy/deploy.sh`                      | Build + (re)start + wait until healthy                                                 |
| `deploy/mongodb/create-payload-user.js` | Creates the MongoDB user for Payload (run on the DB EC2)                               |
| `scripts/pack-local-packages.mjs`       | Packs `packages/*` into tarballs for the app (used by the Dockerfile)                  |

---

## 1. AWS networking (security groups)

Put both instances in the **same VPC** and connect through the database's **private IP**.

| Security group | Inbound rule                  | Source                                          |
| -------------- | ----------------------------- | ----------------------------------------------- |
| `cms-app-sg`   | TCP 80, TCP 443 (and UDP 443) | `0.0.0.0/0` (and `::/0` for IPv6)               |
| `cms-app-sg`   | TCP 22                        | your IP only                                    |
| `mongodb-sg`   | TCP 27017                     | **the security group `cms-app-sg`** (not an IP) |
| `mongodb-sg`   | TCP 22                        | your IP only                                    |

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

| Variable                                                    | Value                                                                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                              | `mongodb://payload:<password>@<mongo-private-ip>:27017/payload?authSource=admin`                               |
| `PAYLOAD_SECRET`                                            | output of `openssl rand -hex 32`. Keep it stable; changing it logs everyone out                                |
| `SERVER_URL`                                                | exactly what you type in the browser, no trailing slash: `http://<ec2-public-ip>` or `https://cms.example.com` |
| `SITE_ADDRESS`                                              | `:80` for plain HTTP on the IP, or `cms.example.com` for automatic HTTPS                                       |
| `CORS_ORIGINS`                                              | optional, comma-separated frontend origins that call the API with cookies                                      |
| `WEBSITE_URL`, `WEBSITE_REVALIDATE_SECRET`                  | optional, refresh the website as soon as a post is published (see "Blog posts")                                |
| `SENDGRID_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` | optional, send "forgot password" emails (see "Email (SendGrid)")                                               |

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
- Uploaded media, on the app EC2 (only while uploads are stored locally, not in S3):
  `docker run --rm -v payload-cms_media:/media -v "$PWD":/backup busybox tar czf /backup/media-$(date +%F).tgz -C /media .`
- Or snapshot both EBS volumes with AWS Backup. With S3 storage, turn on bucket versioning instead.

## Uploads in S3

By default, uploads are saved on the app server. Set `S3_BUCKET` to store them in S3 instead:

1. You upload a file in the admin panel (or `POST /api/media`).
2. Payload writes it to `s3://<S3_BUCKET>/<S3_PREFIX>/<filename>`.
3. The media document in MongoDB records `filename`, `prefix` (the S3 folder), `mimeType`,
   `filesize`, `width`/`height` and `url`.
4. Every read (REST, GraphQL, Local API) returns `url` as the public S3 or CloudFront address
   (`<S3_PUBLIC_URL>/<prefix>/<filename>`). Frontends load the file straight from there,
   not through Payload.
5. Deleting the document deletes the object in S3. Replacing the file replaces the object.

### a) Create the bucket

Create it in the same region as the EC2. Keep **Object Ownership = Bucket owner enforced**
(the default; ACLs off).

To make files public, pick **one** option:

- **Simple: public bucket policy.** Under _Block public access_, untick only the two
  _"...bucket policies"_ options, then add this bucket policy. It makes only the `media/`
  folder readable:

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadMedia",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::YOUR-BUCKET/media/*"
      }
    ]
  }
  ```

- **Recommended for production: CloudFront.** Keep the bucket fully private, create a
  CloudFront distribution with an _Origin Access Control_ to the bucket, and set
  `S3_PUBLIC_URL=https://<distribution>.cloudfront.net` (or your CDN domain). You get HTTPS on
  your own domain, caching, and no public bucket.

### b) Give the app EC2 access (IAM role, no keys in `.env`)

Create an IAM role for EC2 with this policy and attach it to the **app** instance
(_Actions → Security → Modify IAM role_):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:AbortMultipartUpload"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET/media/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR-BUCKET",
      "Condition": { "StringLike": { "s3:prefix": "media/*" } }
    }
  ]
}
```

Docker containers can only read the instance role when the metadata hop limit is **2**. Many
AMIs, including Ubuntu, default to 1. Run this once from any machine with the AWS CLI:

```bash
aws ec2 modify-instance-metadata-options --instance-id <app-instance-id> \
  --http-tokens required --http-put-response-hop-limit 2 --http-endpoint enabled
```

Without a role, you can instead put an IAM user's `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`
in `.env`.

### c) Configure and redeploy

```bash
# apps/cms/.env
S3_BUCKET=your-bucket
S3_REGION=ap-southeast-1
S3_PREFIX=media
S3_PUBLIC_URL=            # empty = https://your-bucket.s3.ap-southeast-1.amazonaws.com
```

```bash
./deploy/deploy.sh
```

Upload an image in the admin panel. `GET /api/media` should now return `"url": "https://…"`
pointing at S3, and the file should be in the bucket under `media/`.

### d) Files uploaded before switching

Older uploads are still in the local `media` volume. Copy them to the bucket and record their
folder, so their URLs keep working:

```bash
# on the app EC2 (uses the instance role)
docker run --rm -v payload-cms_media:/media amazon/aws-cli s3 sync /media s3://YOUR-BUCKET/media/
# on the MongoDB EC2 (use your own container name and admin credentials)
docker exec -it mongo mongosh -u admin -p --authenticationDatabase admin payload \
  --eval 'db.media.updateMany({ prefix: { $in: [null, ""] } }, { $set: { prefix: "media" } })'
```

S3-compatible storage (Cloudflare R2, MinIO, …) works too. Set `S3_ENDPOINT`, and for MinIO
also `S3_FORCE_PATH_STYLE=true`.

## Blog posts

The `posts` collection holds the blog posts of the personal website
([atorpos/personalwebsite](https://github.com/atorpos/personalwebsite), setup in its `docs/payload-cms.md`).
The website reads published posts from `GET /api/posts` without logging in. Drafts are only visible to
logged-in users.

| Field        | On the website                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Title        | Post title                                                                                      |
| Description  | Text on post cards, in search results and in the RSS feed                                       |
| Images       | The first one is the cover on post cards; all of them form the gallery at the top of the post   |
| Content      | The post: headings, lists, quotes, links (to URLs or other posts), images, code, YouTube videos |
| Slug         | The URL, `/blog/<slug>`. Generated from the title once and kept when the title changes          |
| Published At | The post date. Filled in when the post is first published                                       |
| Featured     | Lists the post under "Featured" on the home page                                                |
| Tags         | Tag chips. A tag links to `/tags/<tag>` when the website has `content/tags/<tag>.md`            |
| SEO          | Optional title and description for search engines and link previews                             |

The website refreshes its pages from the CMS about once a minute. To update it the moment you publish,
edit, unpublish or delete a post, give both sides the same secret (`openssl rand -hex 32`):

1. Website: set `REVALIDATE_SECRET=<secret>` and redeploy it.
2. CMS `.env`: set `WEBSITE_URL=https://<your-website>` and `WEBSITE_REVALIDATE_SECRET=<secret>`, then run
   `./deploy/deploy.sh`.

After a publish, `docker compose logs cms` shows `Revalidated website` with the refreshed pages, or
`Could not revalidate` with the reason.

The website reads the API from its own server, so it doesn't need to be in `CORS_ORIGINS`. With uploads in
S3, set `PAYLOAD_MEDIA_URL` on the website to `S3_PUBLIC_URL` (or `https://<bucket>.s3.<region>.amazonaws.com`
when that is empty) so it is allowed to load the images.

## Pages and profiles

Both collections have drafts: **Save Draft** keeps a document private, **Publish** makes it readable
without logging in.

- **Pages** (`GET /api/pages`): standalone pages such as About or Services, with a title, description,
  hero image, rich text (including code and YouTube blocks), a slug and SEO overrides. Fetch one page with
  `GET /api/pages?where[slug][equals]=about-me`.
- **Profiles** (`GET /api/profiles`): name, headline, photo, bio, location, and tabs for links (GitHub,
  LinkedIn, …), skills (category and level 1–5), work experience and education. The email address is only
  returned to logged-in users.

The website doesn't read these yet; they are ready for it the same way as posts.

## Clients and events

Both appear under **Business** in the admin panel and are private: every request, including reading,
needs a logged-in user, so `GET /api/clients` and `GET /api/events` return `403` to everyone else.

- **Clients**: company, contact person, job title, email, phone, website, address, business type,
  industry, notes, **importance** (1–5 stars), status (lead, active, inactive) and source. Each client also
  lists the events it is linked to.
- **Events**: name, type (exhibition, trade show, sales event, conference, meeting, other), start and end
  date and time with the **time zone** of the event, venue, booth, address, city, country, organizer,
  website, linked clients, notes, status (planned, confirmed, completed, cancelled) and attachments. The
  list is sorted with the latest event first, and an end date before the start date is rejected.

Attachments are stored in Media, whose files are publicly readable by URL. Don't attach confidential
documents to events.

## Two-factor authentication

Every account must use an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password,
Authy, …) in addition to its password. No email or SMS service is involved.

- **First login after deploying:** after the password, `/admin/2fa` shows a QR code. Scan it, enter the
  6-digit code, and store the 10 backup codes shown once (e.g. in a password manager). Set this up right
  after deploying: until an account has done so, anyone with its password could set it up instead.
- **Every login:** after the password, enter the current code from the app, or a backup code (each works
  once).
- **New phone:** open `/admin/2fa` while logged in, enter a current code or a backup code, press **Reset
  two-factor**, then scan the new QR code.
- **5 wrong codes** lock the code check for 15 minutes. A code is accepted only once, and a verified login
  asks again after 12 hours.

How it works: `src/proxy.ts` checks every `/admin` and `/api` request that carries a login token. Unless
the request also has the `payload-2fa` cookie for that login session (signed with `PAYLOAD_SECRET`), admin
pages redirect to `/admin/2fa` and API requests get `403`. Requests without a login token, like the
website reading published posts, are not affected. The authenticator secret is stored encrypted with
`PAYLOAD_SECRET`, backup codes only as hashes, and neither can be read through the API. Changing
`PAYLOAD_SECRET` therefore makes every account set up two-factor again (after the reset below).

**Lost the phone and the backup codes?** Reset the account from the app server; it must set up two-factor
again at the next login:

```bash
cd ~/payloadcms/apps/cms
docker run --rm mongo:8 mongosh "$(grep '^DATABASE_URL=' .env | cut -d= -f2-)" --quiet --eval '
  db.users.updateOne({ email: "you@example.com" }, {
    $set: { twoFactorEnabled: false },
    $unset: { twoFactorSecret: "", twoFactorPendingSecret: "", twoFactorBackupCodes: "",
              twoFactorLastStep: "", twoFactorFailedAttempts: "", twoFactorLockUntil: "" },
  })'
```

The codes depend on the server clock. EC2 keeps it in sync by default; if codes are always rejected,
check `timedatectl` on the app server.

## Email (SendGrid)

Payload sends "forgot password" emails. Without an email service it only writes them to the log
(`docker compose logs cms`). To send them through SendGrid:

1. **Verify a sender** in SendGrid (_Settings → Sender Authentication_). Either verify a single address
   (_Single Sender Verification_, done in a minute), or authenticate your domain by adding the DNS records
   SendGrid shows, which keeps the emails out of spam folders.
2. **Create an API key** (_Settings → API Keys → Create API Key_): choose _Restricted Access_, set
   _Mail Send_ to _Full Access_, and copy the key; SendGrid shows it only once.
3. **Add to `.env`** and run `./deploy/deploy.sh`:

   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxx
   EMAIL_FROM_ADDRESS=cms@example.com   # the sender verified in step 1
   EMAIL_FROM_NAME=Payload CMS
   ```

4. **Test:** log out, choose **Forgot password?**, and enter your email. The link in the email opens
   `SERVER_URL/admin/reset/…`, is valid for one hour and works once. After choosing a new password you still
   need your two-factor code.

Payload sends at most one reset email per account every 15 seconds, and answers the same way for unknown
addresses, so the form doesn't reveal which accounts exist. If no email arrives, look for
`SendGrid rejected the email` in `docker compose logs cms`: `401`/`403` means the key is wrong or lacks the
Mail Send permission; a sender error means `EMAIL_FROM_ADDRESS` isn't verified. SendGrid's _Activity Feed_
shows whether an email was delivered.

## Troubleshooting

| Symptom                                                                  | Cause / fix                                                                                                                                                                 |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login succeeds but you're bounced back to login, or API calls return 403 | `SERVER_URL` doesn't exactly match the browser URL (http vs https, IP vs domain, port). Fix `.env` and redeploy.                                                            |
| `/api/health` → `503` / logs say `cannot connect to MongoDB`             | Run `./deploy/check-db.sh`. Timeout → security group or `bindIp`. `Authentication failed` → user/password/`authSource`, or an un-encoded special character in the password. |
| Build killed / `exit code: 137`                                          | Out of memory. Use an 8 GB instance or check that swap is on (`swapon --show`).                                                                                             |
| Caddy can't get a certificate                                            | DNS doesn't point at the instance yet, or port 80/443 is closed. Check `docker compose logs caddy`.                                                                         |
| Upload fails: `Could not load credentials` / `AccessDenied`              | S3 access. Check that the IAM role is attached with the policy above and that the metadata hop limit is 2, or set the key pair in `.env`.                                   |
| Upload works but images are broken (403)                                 | The files aren't public. Add the bucket policy (and untick the bucket-policy public-access blocks), or check the CloudFront origin access settings.                         |
| Website only shows a published post after a minute                       | `docker compose logs cms` shows `Could not revalidate`: `401` means the two secrets differ; `ECONNREFUSED` or a timeout means `WEBSITE_URL` is wrong.                       |

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
