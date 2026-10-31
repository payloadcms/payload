# Payload CMS on EC2 (MongoDB on a separate EC2)

This folder is a deployable Payload app that runs **this branch's `packages/` source**. It's not
the npm release. The Docker build compiles `payload`, `@payloadcms/next`, `ui`, `db-mongodb`,
`richtext-lexical`, `storage-s3`, `transformer-sharp`, `translations` and `graphql` from `packages/`,
packs them into tarballs and installs the app against them. This is the same approach Payload's CI
uses to test templates.

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

| File                                       | Purpose                                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `src/payload.config.ts`                    | Payload config: MongoDB via `DATABASE_URL`, `SERVER_URL`, CORS/CSRF                    |
| `src/endpoints/health.ts`                  | `GET /api/health`: pings MongoDB (used by the Docker healthcheck)                      |
| `src/storage/s3.ts`                        | Optional S3 storage for uploads, turned on by `S3_BUCKET`                              |
| `src/collections/Media.ts`                 | Uploads, and the smaller copies made of each image (see "Image sizes")                 |
| `src/personal/`                            | Pages, settings and projects of the personal website (see "Personal website")          |
| `src/collections/Posts.ts`                 | Blog posts for the personal website (see "Personal website")                           |
| `scripts/import-personal-website.ts`       | Copies the personal website's current content into the CMS (see "Personal website")    |
| `src/collections/Pages.ts`, `src/sites.ts` | Pages for each website and app (see "Pages for several websites and apps")             |
| `src/collections/Profiles.ts`              | Profiles: bio, links, skills, work history, education                                  |
| `src/collections/Clients.ts`               | Private client records: contacts, business type, importance (see "Clients and events") |
| `src/collections/Events.ts`                | Private records of sales events and exhibitions worldwide                              |
| `scripts/import-events.ts`                 | Imports events from a JSON file (see "Importing events")                               |
| `src/maps/`, `src/hooks/locateEvent.ts`    | Finds each event's coordinates in Apple Maps (see "Event locations")                   |
| `scripts/locate-events.ts`                 | Looks up the coordinates of events saved earlier (see "Event locations")               |
| `src/endpoints/appEvents.ts`               | Upcoming events for the VgemsAI app (see "The VgemsAI app")                            |
| `src/endpoints/appEventDiscovery.ts`       | Trade shows Claude finds every week (see "Events found by Claude")                     |
| `src/endpoints/appClients.ts`              | VgemsAI app signups as clients, and their Account screen (see "The VgemsAI app")       |
| `src/endpoints/appChat.ts`                 | Saves VgemsAI app chats, deletes app accounts' data (see "The VgemsAI app")            |
| `src/collections/ChatSessions.ts`, `…/ChatMessages.ts` | VgemsAI app conversations, deleted after 90 days (see "Chats")             |
| `src/app/(frontend)/ios-app/`, `scripts/import-legal-pages.ts` | Privacy Policy and Terms of Use of the app and the Vigor website (see "Privacy policy and terms of use") |
| `src/vigor/`, `src/locales.ts`             | Content of the Vigor website in four languages (see "Vigor website")                   |
| `scripts/import-vigor.ts`                  | Copies the Vigor website's current content into the CMS (see "Vigor website")          |
| `scripts/import-app-page.ts`, `scripts/app-page/` | The first version of the Vigor website's VgemsAI app page (see "VgemsAI app page") |
| `src/timezones.ts`, `src/zonedTime.ts`     | Time zones offered for event dates, and days at midnight in a time zone                |
| `src/proxy.ts`, `src/twoFactor/`           | Two-factor authentication for every login (see "Two-factor authentication")            |
| `src/email/sendgrid.ts`                    | Sends emails such as "forgot password" through SendGrid (see "Email (SendGrid)")       |
| `src/hooks/revalidateWebsite.ts`           | Tells the personal website to refresh its pages when its content changes               |
| `Dockerfile`                               | Multi-stage build from the repo root → small standalone image                          |
| `docker-compose.yml`, `Caddyfile`          | Production stack on the app EC2                                                        |
| `.env.example`                             | Every setting the server needs                                                         |
| `deploy/setup-app-server.sh`               | One-time bootstrap of a fresh EC2 (Docker, swap, clone)                                |
| `deploy/check-db.sh`                       | Checks that the app EC2 can reach and write to MongoDB                                 |
| `deploy/deploy.sh`                         | Build + (re)start + wait until healthy                                                 |
| `deploy/import-events.sh`                  | Runs the events import on the server                                                   |
| `deploy/locate-events.sh`                  | Looks up the coordinates of events on the server                                       |
| `deploy/import-personal-website.sh`        | Runs the personal website import on the server                                         |
| `deploy/import-vigor.sh`                   | Runs the Vigor website import on the server                                            |
| `deploy/import-app-page.sh`                | Adds the VgemsAI app page's first version on the server                                |
| `deploy/import-legal-pages.sh`             | Adds the Privacy Policy and Terms of Use on the server                                 |
| `deploy/mongodb/create-payload-user.js`    | Creates the MongoDB user for Payload (run on the DB EC2)                               |
| `scripts/pack-local-packages.mjs`          | Packs `packages/*` into tarballs for the app (used by the Dockerfile)                  |

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
| `WEBSITE_URL`, `WEBSITE_REVALIDATE_SECRET`                  | optional, refresh the personal website as soon as its content changes (see "Personal website")                 |
| `VIGOR_WEBSITE_URL`, `VIGOR_WEBSITE_REVALIDATE_SECRET`      | optional, refresh the Vigor website as soon as its content changes (see "Vigor website")                       |
| `OPENAI_API_KEY`, `OPENAI_MODEL`                            | optional, write the title, alt text, description and tags of photos with AI (see "Photos")                     |
| `APPLE_MAPS_*`                                              | optional, team ID, key ID and private key to put events on the map with Apple Maps (see "Event locations")     |
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

## Image sizes

Every image uploaded to Media (JPEG, PNG, WebP, AVIF, GIF, TIFF) is stored as is, plus three smaller
copies whose longer side (width or height) is at most:

| Name      | Longer side | Example: 4000×3000 photo | Example: 3000×4000 photo |
| --------- | ----------- | ------------------------ | ------------------------ |
| `max1440` | 1440 px     | 1440×1080                | 1080×1440                |
| `max720`  | 720 px      | 720×540                  | 540×720                  |
| `max640`  | 640 px      | 640×480                  | 480×640                  |

The proportions never change, phone photos are turned upright first, and an image that is already
smaller keeps its own size rather than being enlarged. The copies drop the photo's metadata (such as
GPS location); the original keeps it. Other files (PDF, SVG, …) are stored without copies.

The copies are saved next to the original (in S3 when it's on) and deleted or replaced with it.
Each read returns them under `variants`, with the full-size file in `url`, `width` and `height`:

```json
{
  "url": "https://cdn.example.com/media/…",
  "width": 4000,
  "height": 3000,
  "variants": {
    "max1440": { "url": "https://cdn.example.com/media/…", "width": 1440, "height": 1080 },
    "max720": { "url": "https://cdn.example.com/media/…", "width": 720, "height": 540 },
    "max640": { "url": "https://cdn.example.com/media/…", "width": 640, "height": 480 }
  }
}
```

Images uploaded before this was added have no copies; replace the file in the admin panel to make
them. To change the sizes, edit `mediaVariants` in `src/collections/Media.ts`.

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
pointing at S3, and the file should be in the bucket under `media/`. Photos of the personal website go to
`media/photos/` (`S3_PHOTOS_PREFIX` to change it).

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

## Personal website

Everything under **Personal website** in the admin panel is the content of the personal website
([atorpos/personalwebsite](https://github.com/atorpos/personalwebsite), setup in its `docs/payload-cms.md`), together
with its pages in **Pages**. The code is in `src/personal/` and `src/collections/Posts.ts`. The website reads published
content without logging in; drafts are only visible to logged-in users.

| In the admin panel | On the website                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Posts              | The blog: `/blog/<slug>`, the post lists, tag pages, featured posts on the home page, the RSS feed          |
| Projects           | The cards on `/projects` and a page per project at `/projects/<slug>`                                       |
| Photos             | The photo portfolio: a page per photo at `/photos/<album>/<slug>`, tag pages at `/photos/tags/<tag>`        |
| Photo albums       | The albums ("catalogs") on `/photos`, each at `/photos/<slug>`                                              |
| Site settings      | Site name, browser tab titles, default description, X handle, main menu and social links                    |
| Home page          | `/`: name, job titles, introduction, button (e.g. your resume), key figures, featured posts, logos          |
| About page         | `/about`: photo, numbered sections, call to action, skill sets with levels and icons, employment, education |
| Services page      | `/services`: introduction, button and a tile per service                                                    |
| Projects page      | The texts of `/projects` and the GitHub repositories shown there                                            |
| Photos page        | The texts of `/photos`                                                                                      |
| Blog page          | The texts of `/blog`                                                                                        |
| Contact page       | The texts of `/contact` and the contact details next to the form                                            |
| Pages              | Pages whose **Sites** include **Personal website**, at `/<slug>`, e.g. `/privacy-policy`                    |

**Pages and Site settings** have no drafts (with MongoDB, Payload gives every global with drafts an index with the same
name, so all but one of them fail to build): **Save** puts the change live, and the **Versions** tab can restore an
earlier save. Until a page or Site settings is saved for the first time, the website keeps showing its own Markdown
file or `theme.config.js`, so pages can move to the CMS one at a time.

**Posts, projects, photos and photo albums** have drafts: **Save Draft** keeps changes private, **Publish** makes them
public.

- **Icons** (skills, services, "Expert In" logos, project logos) must be SVG files; only those can be chosen. The
  website puts them inline so they take the theme's colors.
- **Buttons** link to a page of the website (`/contact`), a full URL, or an uploaded file such as a resume.
- **Menu icons, social platforms and contact detail types** are in `src/personal/options.ts`. The website maps each
  value to an icon (`components/SiteIcons.jsx`): when you add one, add it there too.

### Copying the website's content into the CMS (once)

`deploy/import-personal-website.sh` reads the website repo the way the website does (`theme.config.js`, the pages in
`content/` and the projects in `content/projects`), uploads its images and icons to Media and saves everything;
projects are published. On the app server:

```bash
cd ~/payloadcms/apps/cms
./deploy/import-personal-website.sh https://github.com/atorpos/personalwebsite --dry-run   # preview, nothing is saved
./deploy/import-personal-website.sh https://github.com/atorpos/personalwebsite
```

- The repo is cloned from its default branch; use `<url>#<branch>` for another branch, or the path of a checkout on
  the server. A private repo needs a URL with access, e.g. `https://<token>@github.com/...`.
- Pages and Site settings that were already saved in the CMS, projects with the same slug and files already in Media
  are skipped, so running it again is safe and keeps your edits.
- The output ends with what to check in the admin panel, e.g. a project logo that isn't an SVG.
- Blog posts aren't copied; the website keeps showing its Markdown posts next to the CMS's.

Locally, run `pnpm payload run scripts/import-personal-website.ts <website-folder> [--dry-run]` in this folder instead.

### Posts

| Field        | On the website                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------- |
| Title        | Post title                                                                                          |
| Description  | Text on post cards, in search results and in the RSS feed                                           |
| Images       | The first one is the cover on post cards; all of them form the gallery at the top of the post       |
| Content      | The post: headings, lists, quotes, links (to URLs, posts or projects), images, code, YouTube videos |
| Slug         | The URL, `/blog/<slug>`. Generated from the title once and kept when the title changes              |
| Published At | The post date. Filled in when the post is first published                                           |
| Featured     | Lists the post under "Featured" on the home page                                                    |
| Tags         | Tag chips. A tag links to `/tags/<tag>` when the website has `content/tags/<tag>.md`                |
| SEO          | Optional title and description for search engines and link previews                                 |

### Photos

1. Create an album in **Photo albums** (e.g. "Street", "Japan 2025") and publish it.
2. In **Photos**, click **Bulk Upload** and drop in your photos (JPEG, PNG or WebP, up to 50 MB each). To set the
   album of all of them at once, click **Edit all**, choose **Album**, pick the album and click **Apply Changes**.
3. With `OPENAI_API_KEY` set, uploading fills in each photo's empty title, alt text, description and tags (a few
   seconds per photo). Review them, then **Publish** (or **Save draft** to publish later).

Each photo is one upload, stored like Media (in S3 when it's on, under `<S3_PREFIX>/photos/`, so the bucket policy and
IAM role for Media cover it). On upload the CMS:

- reads the capture date, camera, lens and settings from the file's EXIF data into **Taken on** and **Camera**
- stores the photo turned upright, at most 4096 px on its longer side, and **without its metadata**: the GPS location
  that most phones record would otherwise be public with the file
- makes copies whose longer side is at most 480, 960, 1600 and 2560 px (`photoVariants` in
  `src/personal/collections/PersonalPhotos.ts`); the website picks the size that fits the screen

| Field       | On the website                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------- |
| Title       | The photo's heading, browser tab title and name in search results                                 |
| Alt text    | What the photo shows, for screen readers and image search; not shown on the page                  |
| Description | The text below the photo, its search result snippet and link preview text                         |
| Location    | Shown with the photo, e.g. "Kyoto, Japan". AI uses it too; the CMS never reads the GPS location   |
| Camera      | Camera, lens and settings below the photo                                                         |
| Album       | The album it's in (required); its page is `/photos/<album>/<slug>`                                |
| Tags        | Links to `/photos/tags/<tag>`, the photos of every album with that tag; also filters on the album |
| Slug        | Generated from the title once and kept when the title changes                                     |
| Taken on    | The date below the photo                                                                          |
| Featured    | Shown on `/photos`. Without any featured photos, `/photos` shows the 12 latest                    |

**Order:** drag photos (in **Photos**) and albums (in **Photo albums**) into the order the website shows them in.
Moving a photo to another album changes its address; its old address redirects to the new one.

**AI texts** come from the OpenAI API (`src/personal/photos/describePhoto.ts`): the CMS sends a 1024 px copy of the
photo with the album, the location and the tags already in use, so new photos get the same tags. It only fills empty
fields, and an upload never fails because of it: when OpenAI is unreachable or answers with an error, the photo is saved
with the file name as its title, and `docker compose logs cms` says `Could not write the texts of <file> with AI`.
**Generate with AI** in a photo's sidebar writes new texts for a saved photo into the form, unsaved, so you can review
them first. `OPENAI_MODEL` picks another model that understands images (default `gpt-5-mini`, a small and inexpensive
one). After setting or changing these, run `./deploy/deploy.sh`.

### Refreshing the website

The website refreshes its pages from the CMS about once a minute. To update it the moment you save a page or Site
settings, or publish, edit, unpublish or delete a post, project, photo, album or page, give both sides the same secret
(`openssl rand -hex 32`):

1. Website: set `REVALIDATE_SECRET=<secret>` and redeploy it.
2. CMS `.env`: set `WEBSITE_URL=https://<your-website>` and `WEBSITE_REVALIDATE_SECRET=<secret>`, then run
   `./deploy/deploy.sh`.

After a change, `docker compose logs cms` shows `Revalidated website` with the refreshed pages, or
`Could not revalidate` with the reason. Saving Site settings refreshes every page.

The website reads the API from its own server, so it doesn't need to be in `CORS_ORIGINS`. With uploads in
S3, set `PAYLOAD_MEDIA_URL` on the website to `S3_PUBLIC_URL` (or `https://<bucket>.s3.<region>.amazonaws.com`
when that is empty) so it is allowed to load the images.

## Pages and profiles

Both collections have drafts: **Save Draft** keeps a document private, **Publish** makes it readable
without logging in.

- **Pages** (`GET /api/pages`): standalone pages such as About or Services for all your websites and apps
  (see "Pages for several websites and apps"), with a title, description, hero image, rich text (including
  code and YouTube blocks), a slug and SEO overrides.
- **Profiles** (`GET /api/profiles`): name, headline, photo, bio, location, and tabs for links (GitHub,
  LinkedIn, …), skills (category and level 1–5), work experience and education. The email address is only
  returned to logged-in users.

The personal website shows its pages (see "Personal website"); no website reads profiles yet.

### Pages for several websites and apps

Every page has a **Sites** field (in the sidebar) that says which websites and apps show it. A page can
belong to several, e.g. one privacy policy for the Vigor website and the iOS app. The sites are listed
in `src/sites.ts`:

| Site             | Value it sends |
| ---------------- | -------------- |
| Personal website | `personal`     |
| Business website | `business`     |
| iOS app          | `ios-app`      |
| Vigor website    | `vigor`        |

Each website or app asks only for its own pages by adding its value to the request:

```bash
# All pages of the business website
GET /api/pages?where[sites][in]=business

# One page: the iOS app's "privacy-policy"
GET /api/pages?where[sites][in]=ios-app&where[slug][equals]=privacy-policy
```

The slug is unique per site, so the personal and business websites can each have their own `about` page.
It's filled in from the title when left empty. Using a slug that another page already has on the same site
shows an error on the slug field.

To add a site (e.g. a second app), add a line to `src/sites.ts` and deploy. Don't change the value of a site
that is live, since its website or app sends it; the label can change freely.

**Pages created before the Sites field existed** don't belong to any site yet, so no website or app gets them.
Either open each one and choose its sites, or assign them all to one site at once from the app server:

```bash
cd ~/payloadcms/apps/cms
docker run --rm mongo:8 mongosh "$(grep '^DATABASE_URL=' .env | cut -d= -f2-)" --quiet --eval '
  db.pages.updateMany({ sites: { $exists: false } }, { $set: { sites: ["personal"] } });
  db.getCollection("_pages_versions").updateMany(
    { "version.sites": { $exists: false } },
    { $set: { "version.sites": ["personal"] } },
  )'
```

**Databases from before the Sites field** also still have the old index that allowed each slug only once across
all sites, so a second site's page with the same slug fails to save ("The following field is invalid: slug"), and
`deploy/import-vigor.sh` warns about an index in `pages`. Remove it once, then restart the CMS, which creates the
right index:

```bash
cd ~/payloadcms/apps/cms
docker run --rm mongo:8 mongosh "$(grep '^DATABASE_URL=' .env | cut -d= -f2-)" --quiet --eval '
  db.pages.dropIndex("slug_1")'
docker compose restart cms
```

## Vigor website

Everything under **Vigor website** in the admin panel is the content of the Vigor Gems and Jewelry website
([atorpos/VigorNewWebsite](https://github.com/atorpos/VigorNewWebsite)), in English, Spanish, French and
Traditional Chinese. The code is in `src/vigor/`, the languages in `src/locales.ts`.

| In the admin panel | On the website                                                                          |
| ------------------ | --------------------------------------------------------------------------------------- |
| Products           | `/products` and a page per product. Products with a badge are featured on the home page |
| Service pages      | `/topics/<slug>`, shown as tiles on the home page                                       |
| News               | `/news` and a page per article                                                          |
| Events             | Upcoming events on the home page (separate from the private events under Business)      |
| Site settings      | Company name, contact details (see below), social links, main menu, key figures         |
| Home page          | The hero slides at the top of the home page                                             |
| About page         | `/about`                                                                                |
| VgemsAI app page   | `/vgemsai`: what the app does and how to join its beta (see "VgemsAI app page")         |
| Pages              | Pages whose **Sites** include Vigor website, at `/<slug>`, e.g. the privacy policy      |

**Languages.** Switch language with the menu at the top right; each text field shows its language, e.g.
"Name — English". Categories, gemstones, metals, badges, units, slugs, SKUs, links and images are the same in
every language. Fields marked \* must be filled in English only: in the other languages they can stay empty,
and the website then shows the English text, also after it's edited.

**Publishing.** Products, service pages, news and events have drafts, and each language is published on its own:

- **Publish in English** (or the language you're editing) publishes that language only. An item published only
  in English doesn't appear on the Spanish, French or Chinese site.
- For a new item, use the arrow next to it → **Publish all locales**. The item then appears in every language
  straight away, in English until you translate it.
- To translate, switch language, change the texts and press **Publish in Español** (or the other language).
- **Save Draft** keeps changes private. The website keeps showing the published version.

Site settings, Home page and About page have no drafts: **Save** puts the change live in the language you're
editing. (With MongoDB, Payload gives every global with drafts an index with the same name, so all but one
of them fail to build.)

**Contact details** (Site settings → Company: email, phone, WhatsApp, WeChat ID, showroom address, opening hours)
appear in the website's top bar, footer and Contact page, where the showroom address also gets a map, and the
website's AI assistant knows them. Each field says where it's shown. WhatsApp becomes a link that opens a chat.
Optional fields left empty, such as WeChat or a social link, are left out on the website. Address, opening hours,
tagline and portal name are per language; the others are the same in every language.

**Images** go to Media like any upload (to S3 when it's on). A product without a photo gets a drawn
illustration on the website.

**Catalog choices** (categories, gemstones, metals, units, badges, news categories) are in
`src/vigor/options.ts`. The website translates them with the `glossary` in its `shared/i18n/*.json`: when
you add one, add its translations there too, or it shows in English on the other languages' pages.

### VgemsAI app page

**Vigor website → VgemsAI app page** is the website's page about the app, at `/vgemsai` (and `/es/vgemsai`, …), in the
four languages like the rest of the Vigor website. It's public, so it can be the Marketing or Support URL in App Store
Connect, and App Review can open it. Saving it puts it live; it stays hidden ("page not found") while it has no title.
It has four tabs:

- **Banner:** title, summary, a status badge (e.g. "In development · Public beta on TestFlight"), the banner artwork,
  the highlights under the banner, and two links that decide the main button:
  - **App Store link** set: "Download on the App Store";
  - otherwise **TestFlight link** set (App Store Connect → TestFlight → External Testing → Public Link): "Join the beta
    on TestFlight";
  - neither: "Ask for beta access", which opens the contact page.
- **Features**, **Beta** (the steps to join it) and **FAQ**.

The icons of the highlights and features are a dropdown (`appIcons` in `src/vigor/options.ts`); the website draws
each one, so a new icon needs a drawing there too (`client/src/pages/AppPage.tsx` in the website repo). Buttons and
small labels, like the main button's text, are the website's interface texts (`app` in its `shared/i18n/*.json`).

**Adding the first version (once).** It's in `scripts/app-page/`: `content.json` in English, Spanish, French and
Traditional Chinese, and `banner.jpg`. On the app server:

```bash
cd ~/payloadcms/apps/cms
./deploy/import-app-page.sh --dry-run   # only show what would happen
./deploy/import-app-page.sh
```

A page that already has a title is skipped, so running it again keeps your edits; `--update` replaces its text with
the one in `scripts/app-page/` (the banner stays). Then add the TestFlight link and check each language.

### Connecting the website (once)

1. **Deploy the website** with Payload support (VigorNewWebsite PR #5 or later) and without `PAYLOAD_URL`, so it
   still shows its own content.
2. **Deploy this CMS** (`./deploy/deploy.sh`).
3. **Copy the website's content into the CMS**, on the app server:

   ```bash
   cd ~/payloadcms/apps/cms
   ./deploy/import-vigor.sh https://www.example.com --dry-run   # preview, nothing is saved
   ./deploy/import-vigor.sh https://www.example.com
   ```

   It reads every language from the website (`GET /api/content/<language>`), downloads the images into Media
   and publishes everything in all languages. Items that already exist (same slug; events with the same title
   and day) and pages that already have content are skipped, so running it again is safe and keeps your
   edits. An image that can't be downloaded is reported and left empty; `--no-images` skips them all. If the
   website runs on this server, its local address works too, e.g. `http://127.0.0.1:3002`.

4. **Point the website at the CMS**, in the website's `server/.env`, then rebuild it
   (`docker compose up -d --build`):

   ```bash
   PAYLOAD_URL=https://cms.example.com        # this CMS's SERVER_URL
   REVALIDATE_SECRET=<openssl rand -hex 32>
   ```

   `GET https://www.example.com/api/health` then shows `"content":"payload"`.

5. **Refresh the website on every change.** In this CMS's `.env`, then `./deploy/deploy.sh`:

   ```bash
   VIGOR_WEBSITE_URL=https://www.example.com
   VIGOR_WEBSITE_REVALIDATE_SECRET=<the same secret as REVALIDATE_SECRET>
   ```

   After a change, `docker compose logs cms` shows `Revalidated Vigor website`, or `Could not revalidate` with
   the reason. Without these settings, the website picks up changes within a minute.

The website reads published content without logging in, e.g.
`GET /api/vigor-products?locale=es&fallback-locale=en` and `GET /api/globals/vigor-settings?locale=es`, from
its own server, so it doesn't need to be in `CORS_ORIGINS`. If the CMS can't be reached, the website keeps
showing the last content it loaded.

Locally, run `pnpm payload run scripts/import-vigor.ts <website-url> [--dry-run]` in this folder instead.

## Clients and events

Both appear under **Business** in the admin panel and are private: every request, including reading,
needs a logged-in user, so `GET /api/clients` and `GET /api/events` return `403` to everyone else.

- **Clients**: company, contact person, job title, email, phone, website, address (street, city, state or
  province, ZIP or postal code, country), business type,
  industry, notes, **importance** (1–5 stars), status (lead, active, inactive) and source. Each client also
  lists the events it is linked to. People who sign up in the VgemsAI app are added as leads (see
  "The VgemsAI app").
- **Events**: name, type (exhibition, trade show, sales event, conference, meeting, other), description, start and end
  date and time with the **time zone** of the event, venue, booth, address, city, country, **coordinates**
  (see "Event locations"), organizer, website, linked clients, notes, status (planned, confirmed, completed,
  cancelled) and attachments. The list is sorted with the latest event first, and an end date before the start
  date is rejected.

Attachments are stored in Media, whose files are publicly readable by URL. Don't attach confidential
documents to events.

### Importing events

`deploy/import-events.sh` adds events from a JSON file, such as a yearly list of exhibitions:

```json
{
  "exhibitions": [
    {
      "event_name": "JCK Las Vegas",
      "exact_date": "June 4 - 7, 2027",
      "duration_days": 4,
      "location": "The Venetian Expo, Las Vegas, NV, USA",
      "business_nature": "World's Largest Global Fine Jewelry Industry Trade Event"
    }
  ]
}
```

1. **Copy the file to the app server** (from your computer):

   ```bash
   scp exhibitions.json <user>@<app-server-ip>:~/
   ```

2. **Preview** on the app server. Nothing is saved; every event is listed with its dates, city and time zone:

   ```bash
   cd ~/payloadcms/apps/cms
   ./deploy/import-events.sh ~/exhibitions.json --dry-run
   ```

3. **Import:**

   ```bash
   ./deploy/import-events.sh ~/exhibitions.json
   ```

Run it right after `./deploy/deploy.sh`. It then takes seconds, because it reuses the deploy's build. If the
code changed since the last deploy, it builds first (5–10 minutes).

How the file becomes events:

| JSON              | Event                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `event_name`      | Name                                                                                                       |
| `exact_date`      | Start and end date at midnight, in the time zone of the city, e.g. `October 30 - November 1, 2026`         |
| `location`        | Venue, address (parts starting with a number), city and country; for the USA, the state sets the time zone |
| `business_nature` | Description; also sets the type (conference, trade show or exhibition)                                     |
| `duration_days`   | Only checked against the dates; a mismatch is noted                                                        |

- Every event starts as **Planned**.
- **Dates "to be confirmed"**, such as `April 2027 (exact dates TBC)`, start on the 1st of the month and keep
  the original text in the notes. Remarks in brackets after a location, e.g.
  `(confirm with organiser)`, go to the notes too. The preview marks these with `[see notes]`.
- **Running a file again is safe:** an event with the same name starting within 60 days of an existing one is
  skipped, so your own changes (status, clients, notes) stay. When an organiser announces the exact dates of a
  "TBC" event, change them in the admin panel.
- **Nothing is saved when an entry can't be read.** The script lists each problem, e.g. a date it doesn't
  understand, or a country without a time zone (add it to `COUNTRY_TIMEZONES` in
  `scripts/import-events.ts`). Fix the file and run it again.
- `Hong Kong` and `Singapore` are both city and country. Without a city, e.g. `Australia (venue TBC)`, the
  city is `TBC`.

Locally, run `pnpm payload run scripts/import-events.ts <file.json> [--dry-run]` in this folder instead.

With Apple Maps set up (next section), every imported event gets its coordinates, which adds a second or two
per event.

### Events found by Claude

Every Monday, awoz-api asks Claude to search the web for gem, jewellery and raw material trade shows and fairs
around the world in the next 12 months, and adds the ones the CMS doesn't have yet (awoz-api README: "Weekly event
search"):

1. awoz-api reads the events the CMS knows from `GET /api/app/event-discovery`: those that started in the last
   13 months, so Claude looks for their next edition, and those coming up, cancelled ones included.
2. Claude searches the web, preferably the organizers' own sites, for the others.
3. awoz-api sends what Claude found to `POST /api/app/event-discovery`
   (`src/endpoints/appEventDiscovery.ts`), which adds each event it doesn't know yet as **planned**, with its
   coordinates from Apple Maps (next section).

Added events are marked **Found by: Claude (weekly web search)** in the sidebar, and their notes say when they
were found and list the pages Claude found the dates on. Filter the Events list by *Found by* to check them. They
show in the app right away, like any planned event. To hide one, set it to **Cancelled** rather than deleting it:
the search skips cancelled events, but a deleted one can be found and added again.

An event counts as known when one starts within 60 days of it under the same name (years, edition numbers and
"Jewellery" or "Jewelry" don't count), under a name with the same words and more in the same country (e.g.
"HKTDC Hong Kong International Jewellery Show" for "Hong Kong International Jewellery Show"), or under a similar
name in the same city within 3 days. A found event is rejected, and awoz-api logs why, when it's over, starts more
than 400 days ahead, lasts more than 31 days, has no city or country, or its time zone has no counterpart with the
same UTC offset in `src/timezones.ts`.

### Event locations

Each event's **Coordinates** (longitude and latitude, under Location) are filled in from the
[Apple Maps Server API](https://developer.apple.com/documentation/applemapsserverapi) when the event is saved,
so the VgemsAI app can pin it on its map. Apple Maps is looked up, most precise first, for:

1. the **venue** in its city, e.g. `Palexpo, Geneva, Switzerland`
2. the **street address** in its city
3. only the **city**, or only the **country** while the city is `TBC`

A venue or address that Apple Maps finds more than 100 km from the city is taken for a namesake elsewhere and
skipped. **Coordinates of** next to them says which one was found, so you can tell a rough pin (only the city or
country) from a precise one.

- **Looked up again** when the venue, address, city or country changes, or when you clear the coordinates.
- **Wrong pin?** Type the right longitude and latitude (e.g. from Apple Maps or Google Maps) and save. They're
  marked **Set by hand** and kept, until the venue, address, city or country changes; to move the event and
  keep your own pin, change both in the same save.
- **Not found**, or Apple Maps can't be reached: the event is saved anyway, without coordinates, and the app
  then looks the place up on the phone. **Why there are no coordinates** under them says what went wrong, e.g.
  that Apple Maps isn't set up, or the error Apple Maps answered with. Saving it again tries again.

**Set up (once):**

1. In your [Apple Developer account](https://developer.apple.com/account), under _Certificates, Identifiers &
   Profiles_ → _Identifiers_, add a **Maps ID**, e.g. `maps.co.vgems.cms`.
2. Under _Keys_, add a key with **MapKit JS** checked, press _Configure_ and choose that Maps ID, then register
   it and **download the .p8 file** (Apple offers it only once). Note the **Key ID**.
3. Find your **Team ID** under _Membership_.
4. Add them to `.env`. The key must be **one line**: the lines between `BEGIN PRIVATE KEY` and `END PRIVATE KEY`
   joined together. On your Mac, this copies it that way:

   ```bash
   grep -v PRIVATE ~/Downloads/AuthKey_ABC123DEFG.p8 | tr -d '\r\n' | pbcopy
   ```

   ```bash
   APPLE_MAPS_TEAM_ID=DEF123GHIJ
   APPLE_MAPS_KEY_ID=ABC123DEFG
   APPLE_MAPS_PRIVATE_KEY=MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
   ```

   Check it on the server: `grep '^APPLE_MAPS_PRIVATE_KEY=' .env | cut -d= -f2- | wc -c` prints about `200`.

5. `./deploy/deploy.sh`, then look up the events saved before, previewing first:

   ```bash
   ./deploy/locate-events.sh --dry-run   # lists what Apple Maps finds for each event; nothing is saved
   ./deploy/locate-events.sh             # saves it for every event without coordinates
   ```

   `--all` looks up every event again, except coordinates set by hand.

**Still no coordinates?** On the server, `docker compose exec cms printenv | grep -c '^APPLE_MAPS_'` must print
`3`; otherwise the CMS doesn't see the settings (`docker compose restart` doesn't reload `.env`; run
`./deploy/deploy.sh`). `./deploy/locate-events.sh --dry-run` prints the exact error, and
`docker compose logs cms | grep -i 'apple maps'` shows past ones.

Apple allows 25,000 lookups a day per developer team (shared with MapKit JS); each saved event takes two or
three. Use a separate key for each server (e.g. UAT and production), so one can be revoked without the other.
Locally, run `pnpm payload run scripts/locate-events.ts [--dry-run] [--all]` in this folder.

### The VgemsAI app

The VgemsAI app talks to the CMS through its own backend, awoz-api, which reads upcoming events from
`GET /api/app/events`, adds the trade shows Claude finds every week (see "Events found by Claude"), saves every signup as a client with `POST /api/app/clients`, keeps the app's chats
(see "Chats" below) and the Research tab's market prices (see "Market prices"). A server can't pass two-factor,
so instead of logging in it sends a shared key:

```bash
curl -H "X-API-Key: $APP_API_KEY" https://cms.example.com/api/app/events
```

1. Generate a key with `openssl rand -hex 32`.
2. Set it as `APP_API_KEY` in this server's `.env` and as `PAYLOAD_API_KEY` on awoz-api, then redeploy both.

A wrong or missing key gets `401`; while `APP_API_KEY` is empty every `/api/app/...` endpoint returns `404`.

#### Events

`GET /api/app/events` returns events that aren't over yet and start within the next 12 months, soonest first, without
cancelled ones. An end date without a time (00:00, as the import saves them) counts as the whole of that day, so an
event stays listed, and shows as happening now in the app, until its last day is over. Each event has its name, type, description, start and end date with time zone, location
(venue, booth, address, city, country and coordinates), organizer, website and status. **Clients, notes and
attachments are never included.** The coordinates are `{ "latitude": 22.2829, "longitude": 114.1736,
"precision": "venue" }`, where `precision` is `exact` (set by hand), `venue`, `address`, `city` or `country`,
or `null` while the event has none (see "Event locations").

#### Signups

When someone signs up in the app, awoz-api keeps the account (email, password, login) in its own MySQL
database and sends their name, email and company details here within 30 seconds. Each signup becomes a
client under **Business → Clients** with status **Lead**, source "VgemsAI app", and their app account's ID in
**VgemsAI App Account** (sidebar, read-only). From there it is an ordinary client: set the importance, add
notes, link events. The password never reaches the CMS.

While the CMS is down or `APP_API_KEY` is missing, signups in the app keep working; awoz-api sends them once
the CMS answers again. Sending the same signup twice doesn't make a second client: for an account that
already has one, the endpoint returns the existing client.

```bash
curl -X POST -H "X-API-Key: $APP_API_KEY" -H 'Content-Type: application/json' \
  -d '{"appUserId": 1, "company": "Oskar Gems", "contactName": "Oskar", "email": "oskar@example.com",
       "address": {"city": "Hong Kong", "country": "Hong Kong"}, "businessType": "retailer"}' \
  https://cms.example.com/api/app/clients
# 201 {"id": "…"}, or 200 with the same id when that account already has a client
```

Only `company`, `contactName`, `jobTitle`, `email`, `phone`, `website`, `address` (`street`, `city`, `state`,
`postalCode`, `country`), `businessType` and `industry` are copied.

People can see and change these details later in the app's Account screen, except the email. awoz-api reads them
with `GET /api/app/clients/by-account/:appUserId` and saves changes with `PATCH` to the same path, which sets all
of those fields at once (an empty one is cleared). Importance, notes, status, source and linked events are never
sent to the app and never changed by it. The app picks the country from a list, so
`country` is always its English name ("United States"); in the US and Canada `state` (the full name, e.g. "New
York") and `postalCode` are always set, and the phone number starts with the country's calling code. Invalid values, such as an unknown business type, get
`400` with `{"errors": [{"message": "…", "path": "businessType"}]}`.

#### Chats

Every question asked in the app's chat, and every answer, is kept under **VgemsAI App**:

- **Chat Sessions**: one per conversation, titled with its first question, with the client who asked, the number of
  messages, the time of the last one and the AI model. Once a conversation has been quiet for 30 minutes,
  awoz-api has the AI write a **summary and topics** for the sales team. Each client's page lists their sessions
  under **VgemsAI App Chats**, newest first: together they show what the person asks about over time.
- **Chat Messages**: every question and answer, with the model, tokens and answer time, and whether the AI declined.

Both are read-only in the admin panel (the app writes them), and can be deleted. **MongoDB deletes each message 90
days after it was sent, and each session 90 days after its last message** (a TTL index on `expiresAt`, created when
the CMS starts; MongoDB checks about once a minute). To keep chats longer or shorter, change
`CHAT_RETENTION_DAYS` in `src/collections/chatRetention.ts`; it applies to messages saved from then on. The app's
Privacy Policy says 90 days too, so change it there as well (see "Privacy policy and terms of use").

awoz-api uses these endpoints (`src/endpoints/appChat.ts`); it decides who is asking from the app login, and a
session only ever answers to the account that started it:

| Endpoint | What it does |
| --- | --- |
| `POST /api/app/chat-messages` | Saves a question (starting a session when there's none) or an answer; a question returns the session's last 50 messages |
| `GET /api/app/chat-sessions/to-summarize` | Sessions quiet for 30 minutes whose summary is missing or older than their last message |
| `POST /api/app/chat-sessions/:id/summary` | Saves the AI's summary and topics |
| `POST /api/app/accounts/delete` | When someone deletes their app account: deletes their chats, and their client while it's still an untouched app lead (status Lead, source "VgemsAI app"); otherwise the client stays, unlinked, with a note |

#### Market prices (Research tab)

The app's **Research** tab shows raw material prices, and lets people predict whether each one goes up or down next
month. The prices are kept under **VgemsAI App**:

- **Market Materials**: what the tab shows, in order: name, key (the app's name for it, e.g. `gold`), unit, an SF
  Symbols icon, whether it's a **highlight** (a chart under Highlight Trends and in the widget), and its **API Ninjas
  commodity** (`gold`, `silver`, `brent_crude_oil`, `platinum`, `palladium`, `copper`, … as in API Ninjas' Commodity
  Price API). Those six are added the first time the CMS starts; materials still named by their Yahoo Finance
  symbol (`GC=F` …, from the first version) get their API Ninjas name when the CMS starts. Untick **Active** to hide
  one and keep its prices; deleting one deletes its prices too. Don't change a key once people have voted: their
  predictions are kept under it.
- **Market Prices**: one price per material and day, the day's last. awoz-api saves them every 4 hours from API
  Ninjas, and the first time also fills in the last year (see its README, "Market prices and predictions"). The ten
  years before come from World Bank and U.S. EIA data (below). A price you add or correct here is marked **Entered
  by hand** and never overwritten. A material without an API Ninjas commodity only has the prices you enter.

**Adding the ten years before (once).** API Ninjas' history needs a premium plan, and awoz-api only asks it for a
year, so `scripts/market-history/` holds ten years of prices from open sources: World Bank monthly averages for gold,
silver, platinum and copper (Oct 2016 – Sep 2026), and the U.S. EIA's daily Brent price (Oct 2016 – Oct 2026).
`SOURCES.md` there says exactly what each is and its licence. Palladium has none: no openly licensed source was
found, so its chart starts with API Ninjas. Import them after deploying this version:

```bash
cd ~/payloadcms/apps/cms
./deploy/import-market-history.sh --dry-run   # only show what would happen
./deploy/import-market-history.sh             # about a minute for ~3,000 prices
```

Days that already have a price keep it, so running it again is safe. The World Bank's prices are licensed CC BY
4.0: the app credits them at the bottom of the Research tab. To add history for another material, put a
`<key>.csv` with the columns `date,price,source` in that folder and import again.

awoz-api uses these endpoints (`src/endpoints/appMarket.ts`); people's predictions are kept by awoz-api itself,
with their accounts:

| Endpoint | What it does |
| --- | --- |
| `GET /api/app/market` | The active materials with their latest two prices, their price at the end of each month for 10 years, and at the end of each week for the last year |
| `POST /api/app/market-prices` | Saves up to 1000 prices, one per material and day, e.g. `{"source": "api-ninjas", "prices": [{"material": "gold", "date": "2026-10-28", "price": 2680.5}]}`; answers how many were created, updated, unchanged and kept |

#### Privacy policy and terms of use

One **Privacy Policy** and one **Terms of Use** cover both the app and the Vigor website. They are ordinary pages
under **Pages**, for the iOS app and the Vigor website, with the slugs `privacy-policy` and `terms-of-use`, so
publishing an edit updates both at once:

- **The app:** the CMS shows every published page of the iOS app as a web page
  (`src/app/(frontend)/ios-app/[slug]/page.tsx`). That is the address to give App Store Connect (App Privacy →
  Privacy Policy URL; App Information → License Agreement or the description for the terms) and the address the
  app opens from Settings and the signup screen:

  ```
  SERVER_URL/ios-app/privacy-policy
  SERVER_URL/ios-app/terms-of-use
  ```

- **The Vigor website** shows every published page of the Vigor website at `/<slug>` in each of its languages, e.g.
  `/privacy-policy` and `/fr/privacy-policy`, and links to both from its footer (see "Vigor website"). The text is
  the same in every language, since pages aren't translated.

Drafts aren't shown anywhere, and a published edit shows up right away (on the website, once `VIGOR_WEBSITE_URL` is
set; otherwise within a minute). Links to another page (**Link → Internal link**) point to that page on each site.
The page's version history (**Versions** tab) keeps every earlier text.

**Adding them (once).** The first version of both texts is in `scripts/legal/`. Add them as drafts, then open each
one under **Pages**, replace every `[ADD CONTACT EMAIL]` and `[ADD STATE]` (the US state whose laws govern the
terms), and press **Publish**:

```bash
cd ~/payloadcms/apps/cms
./deploy/import-legal-pages.sh --dry-run   # only show what would happen
./deploy/import-legal-pages.sh
```

A page that already exists with the same slug is skipped, so running it again keeps your edits. If you added the
app-only first version earlier, `--update` saves the current text, which also covers the website, as a new draft of
each page (the published version stays live until you publish it, and the earlier text stays under **Versions**).
Fill in the `[ADD …]` spots again, then publish:

```bash
./deploy/import-legal-pages.sh --update
```

**Updating them.** Edit the page under **Pages** and change the "Last updated" date at the top, then publish. When the
app or the website starts collecting something new or uses a new service (another AI provider, analytics tool,
payments), update the Privacy Policy, and for the app the answers in App Store Connect → App Privacy, before releasing
that version. Tell users in the app, on the website or by email before significant changes take effect, as both
texts promise.

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
| Upload of a file over 10 MB fails: `Something went wrong` (500)          | `docker compose logs cms` says `Request body exceeded 10MB`. Fixed in `next.config.ts`: redeploy. Files may be up to 50 MB (`src/requestSizeLimit.ts`, `fileSize`).         |
| Upload works but images are broken (403)                                 | The files aren't public. Add the bucket policy (and untick the bucket-policy public-access blocks), or check the CloudFront origin access settings.                         |
| Personal website only shows a change after a minute                      | `docker compose logs cms` shows `Could not revalidate`: `401` means the two secrets differ; `ECONNREFUSED` or a timeout means `WEBSITE_URL` is wrong.                       |
| Personal website still shows its Markdown version of a page              | The page (or Site settings) was never saved in the CMS. Open it in the admin panel and save it, or run the import.                                                          |
| Uploaded photos get no AI title, description or tags                     | `docker compose logs cms` says `Could not write the texts of … with AI` and why, e.g. a wrong `OPENAI_API_KEY` (401), no credit (429) or a model without image input (400). |
| **Generate with AI** says to set `OPENAI_API_KEY`                        | The key isn't in the running container. Add it to `.env` and run `./deploy/deploy.sh` (`docker compose restart` doesn't read `.env` again).                                 |
| A photo or album isn't on the website                                    | It (or the photo's album) is a draft: publish both.                                                                                                                         |
| Vigor website only shows a change after a minute                         | The same, for `VIGOR_WEBSITE_URL` and `VIGOR_WEBSITE_REVALIDATE_SECRET` (the website's `REVALIDATE_SECRET`).                                                                |
| A page can't use a slug that another site's page uses ("invalid: slug")  | The database still has the index from before the Sites field. Remove it as described in "Pages for several websites and apps".                                              |
| A new Vigor product shows in English but not in the other languages      | It is published in English only. Open it and use the arrow next to **Publish in English** → **Publish all locales**.                                                        |

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
