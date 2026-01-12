<a href="https://payloadcms.com"><img width="100%" src="https://l4wlsi8vxy8hre4v.public.blob.vercel-storage.com/github-banner-new-logo.jpg" alt="Payload headless CMS Admin panel built with React" /></a>
<br />
<br />

<p align="left">
  <a href="https://github.com/payloadcms/payload/actions"><img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/payloadcms/payload/main.yml?style=flat-square"></a>
  &nbsp;
  <a href="https://discord.gg/payload"><img alt="Discord" src="https://img.shields.io/discord/967097582721572934?label=Discord&color=7289da&style=flat-square" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/payload"><img alt="npm" src="https://img.shields.io/npm/dw/payload?style=flat-square" /></a>
  &nbsp;
  <a href="https://github.com/payloadcms/payload/graphs/contributors"><img alt="npm" src="https://img.shields.io/github/contributors-anon/payloadcms/payload?color=yellow&style=flat-square" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/payload"><img alt="npm" src="https://img.shields.io/npm/v/payload?style=flat-square" /></a>
  &nbsp;
  <a href="https://twitter.com/payloadcms"><img src="https://img.shields.io/badge/follow-payloadcms-1DA1F2?logo=twitter&style=flat-square" alt="Payload Twitter" /></a>
</p>
<hr/>
<h4>
<a target="_blank" href="https://payloadcms.com/docs/getting-started/what-is-payload" rel="dofollow"><strong>Explore the Docs</strong></a>&nbsp;·&nbsp;<a target="_blank" href="https://payloadcms.com/community-help" rel="dofollow"><strong>Community Help</strong></a>&nbsp;·&nbsp;<a target="_blank" href="https://github.com/payloadcms/payload/discussions/1539" rel="dofollow"><strong>Roadmap</strong></a>&nbsp;·&nbsp;<a target="_blank" href="https://www.g2.com/products/payload-cms/reviews#reviews" rel="dofollow"><strong>View G2 Reviews</strong></a>
</h4>
<hr/>

> [!IMPORTANT]
> Star this repo or keep an eye on it to follow along.

Payload is the first-ever Next.js native CMS that can install directly in your existing `/app` folder. It's the start of a new era for headless CMS.

<h3>Benefits over a regular CMS</h3>
<ul>
   <li>It's both an app framework & headless CMS</li>
  <li>Deploy anywhere, including serverless on Vercel for free</li>
  <li>Combine your front+backend in the same <code>/app</code> folder if you want</li>
  <li>Don't sign up for yet another SaaS - Payload is open source</li>
  <li>Query your database in React Server Components</li>
  <li>Both admin and backend are 100% extensible</li>
  <li>No vendor lock-in</li>
  <li>Never touch ancient WP code again</li>
  <li>Build faster, never hit a roadblock</li>
</ul>

## Quickstart

Before beginning to work with Payload, make sure you have all of the [required software](https://payloadcms.com/docs/getting-started/installation).

```text
pnpx create-payload-app@latest
```

**If you're new to Payload, you should start with the website template** (`pnpx create-payload-app@latest -t website`). It shows how to do _everything_ - including custom Rich Text blocks, on-demand revalidation, live preview, and more. It comes with a frontend built with Tailwind all in one `/app` folder.

## One-click deployment options

You can deploy Payload serverlessly in one-click via Vercel and Cloudflare—giving everything you need without the hassle of the plumbing.

### Deploy on Cloudflare

Fully self-contained — one click to deploy Payload with **Workers**, **R2** for uploads, and **D1** for a globally replicated database.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://dub.sh/payload-cloudflare)

### Deploy on Vercel

All-in-one on Vercel — one click to deploy Payload with a **Next.js** front end, **Neon** database, and **Vercel Blob** for media storage.

[![Deploy with Vercel](https://vercel.com/button)](https://dub.sh/payload-vercel)

## One-click templates

Jumpstart your next project with a ready-to-go template. These are **production-ready, end-to-end solutions** designed to get you to market fast. Build any kind of **website**, **ecommerce store**, **blog**, or **portfolio** — complete with a modern front end built using **React Server Components** and **Tailwind**.

#### 🌐 [Website](https://github.com/payloadcms/payload/tree/main/templates/website)

#### 🛍️ [Ecommerce](https://github.com/payloadcms/payload/tree/main/templates/ecommerce) 🎉 _**NEW**_ 🎉

We're constantly adding more templates to our [**Templates Directory**](https://github.com/payloadcms/payload/tree/main/templates).
If you maintain your own, add the `payload-template` topic to your GitHub repo so others can discover it.

**🔗 Explore more:**

- [Official Templates](https://github.com/payloadcms/payload/tree/main/templates)
- [Community Templates](https://github.com/topics/payload-template)

## ✨ Payload Features

- Completely free and open-source
- Next.js native, built to run inside _your_ `/app` folder
- Use server components to extend Payload UI
- Query your database directly in server components, no need for REST / GraphQL
- Fully TypeScript with automatic types for your data
- [Auth out of the box](https://payloadcms.com/docs/authentication/overview)
- [Versions and drafts](https://payloadcms.com/docs/versions/overview)
- [Localization](https://payloadcms.com/docs/configuration/localization)
- [Block-based layout builder](https://payloadcms.com/docs/fields/blocks)
- [Customizable React admin](https://payloadcms.com/docs/admin/overview)
- [Lexical rich text editor](https://payloadcms.com/docs/fields/rich-text)
- [Conditional field logic](https://payloadcms.com/docs/fields/overview#conditional-logic)
- Extremely granular [Access Control](https://payloadcms.com/docs/access-control/overview)
- [Document and field-level hooks](https://payloadcms.com/docs/hooks/overview) for every action Payload provides
- Intensely fast API
- Highly secure thanks to HTTP-only cookies, CSRF protection, and more

<a target="_blank" href="https://github.com/payloadcms/payload/discussions"><strong>Request Feature</strong></a>

## 🗒️ Documentation

Check out the [Payload website](https://payloadcms.com/docs/getting-started/what-is-payload) to find in-depth documentation for everything that Payload offers.

Migrating from v2 to v3? Check out the [3.0 Migration Guide](https://github.com/payloadcms/payload/blob/main/docs/migration-guide/overview.mdx) on how to do it.

## 🙋 Contributing

If you want to add contributions to this repository, please follow the instructions in [contributing.md](./CONTRIBUTING.md).

## 📚 Examples

The [Examples Directory](./examples) is a great resource for learning how to setup Payload in a variety of different ways, but you can also find great examples in our blog and throughout our social media.

If you'd like to run the examples, you can use `create-payload-app` to create a project from one:

```sh
npx create-payload-app --example example_name
```

You can see more examples at:

- [Examples Directory](./examples)
- [Payload Blog](https://payloadcms.com/blog)
- [Payload YouTube](https://www.youtube.com/@payloadcms)

## 🔌 Plugins

Payload is highly extensible and allows you to install or distribute plugins that add or remove functionality. There are both officially-supported and community-supported plugins available. If you maintain your own plugin, consider adding the `payload-plugin` topic to your GitHub repository for others to find.

- [Official Plugins](https://github.com/orgs/payloadcms/repositories?q=topic%3Apayload-plugin)
- [Community Plugins](https://github.com/topics/payload-plugin)

## 🚨 Need help?

There are lots of good conversations and resources in our Github Discussions board and our Discord Server. If you're struggling with something, chances are, someone's already solved what you're up against. :point_down:

- [GitHub Discussions](https://github.com/payloadcms/payload/discussions)
- [GitHub Issues](https://github.com/payloadcms/payload/issues)
- [Discord](https://t.co/30APlsQUPB)
- [Community Help](https://payloadcms.com/community-help)

## ⭐ Like what we're doing? Give us a star

## 👏 Thanks to all our contributors

<img align="left" src="https://contributors-img.web.app/image?repo=payloadcms/payload"/>
