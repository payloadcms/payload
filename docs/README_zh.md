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
<a target="_blank" href="https://payloadcms.com/docs/getting-started/what-is-payload" rel="dofollow"><strong>阅读文档</strong></a>&nbsp;·&nbsp;<a target="_blank" href="https://payloadcms.com/community-help" rel="dofollow"><strong>社区帮助</strong></a>&nbsp;·&nbsp;<a target="_blank" href="https://github.com/payloadcms/payload/discussions/1539" rel="dofollow"><strong>路线图</strong></a>&nbsp;·&nbsp;<a target="_blank" href="https://www.g2.com/products/payload-cms/reviews#reviews" rel="dofollow"><strong>查看 G2 评价</strong></a>
</h4>
<hr/>

> [!IMPORTANT]
> 给这个仓库点个 Star 或者关注它，以便获取最新动态。

Payload 是有史以来第一个可以直接安装到你现有 `/app` 文件夹中的 Next.js 原生 CMS。这是无头 CMS 新时代的开始。

### 相比传统 CMS 的优势

<ul>
   <li>它既是应用框架，也是无头 CMS</li>
  <li>可部署到任何地方，包括免费的 Vercel 无服务器部署</li>
  <li>如果需要，可以在同一个 <code>/app</code> 文件夹中合并前后端</li>
  <li>无需再注册新的 SaaS 服务——Payload 是开源的</li>
  <li>在 React Server Components 中直接查询数据库</li>
  <li>管理后台和后端 100% 可扩展</li>
  <li>无供应商锁定</li>
  <li>再也不用碰老旧的 WP 代码</li>
  <li>构建更快，不会遇到瓶颈</li>
</ul>

## 快速开始

在开始使用 Payload 之前，请确保已安装所有[必要软件](https://payloadcms.com/docs/getting-started/installation)。

```text
pnpx create-payload-app@latest
```

**如果你是 Payload 新手，建议从网站模板开始**（`pnpx create-payload-app@latest -t website`）。它展示了如何实现*所有功能*——包括自定义富文本块、按需重新验证、实时预览等。模板自带基于 Tailwind 构建的前端，全部位于一个 `/app` 文件夹中。

## 一键部署选项

你可以通过 Vercel 和 Cloudflare 一键无服务器部署 Payload——提供你所需的一切，无需繁琐的配置。

### 部署到 Cloudflare

完全自包含——一键部署 Payload，包含 **Workers**、用于上传的 **R2** 以及全球复制的 **D1** 数据库。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://dub.sh/payload-cloudflare)

### 部署到 Vercel

Vercel 上的全能方案——一键部署 Payload，包含 **Next.js** 前端、**Neon** 数据库和 **Vercel Blob** 媒体存储。

[![Deploy with Vercel](https://vercel.com/button)](https://dub.sh/payload-vercel)

## 一键模板

使用即用型模板快速启动你的下一个项目。这些是**生产就绪的端到端解决方案**，旨在帮助你快速推向市场。可构建各种类型的**网站**、**电商商店**、**博客**或**作品集**——全部配备使用 **React Server Components** 和 **Tailwind** 构建的现代前端。

#### 🌐 [网站模板](https://github.com/payloadcms/payload/tree/main/templates/website)

#### 🛍️ [电商模板](https://github.com/payloadcms/payload/tree/main/templates/ecommerce) 🎉 _**新增**_ 🎉

我们正在不断向[模板目录](https://github.com/payloadcms/payload/tree/main/templates)中添加更多模板。
如果你有自己的模板，请在 GitHub 仓库中添加 `payload-template` 话题，以便其他人发现。

**🔗 探索更多：**

- [官方模板](https://github.com/payloadcms/payload/tree/main/templates)
- [社区模板](https://github.com/topics/payload-template)

## ✨ Payload 功能特性

- 完全免费且开源
- Next.js 原生，设计为在*你的* `/app` 文件夹中运行
- 使用 Server Components 扩展 Payload UI
- 在 Server Components 中直接查询数据库，无需 REST / GraphQL
- 完全 TypeScript 支持，自动为你的数据生成类型
- [开箱即用的身份认证](https://payloadcms.com/docs/authentication/overview)
- [版本控制和草稿](https://payloadcms.com/docs/versions/overview)
- [本地化支持](https://payloadcms.com/docs/configuration/localization)
- [基于区块的布局构建器](https://payloadcms.com/docs/fields/blocks)
- [可定制的 React 管理后台](https://payloadcms.com/docs/admin/overview)
- [Lexical 富文本编辑器](https://payloadcms.com/docs/fields/rich-text)
- [条件字段逻辑](https://payloadcms.com/docs/fields/overview#conditional-logic)
- 极其精细的[访问控制](https://payloadcms.com/docs/access-control/overview)
- Payload 提供的每个操作都有[文档和字段级别的钩子](https://payloadcms.com/docs/hooks/overview)
- 极速 API
- 基于 HTTP-only Cookie、CSRF 保护等机制的高安全性

<a target="_blank" href="https://github.com/payloadcms/payload/discussions"><strong>功能请求</strong></a>

## 🗒️ 文档

请访问 [Payload 官网](https://payloadcms.com/docs/getting-started/what-is-payload)，查看 Payload 所有功能的详细文档。

从 v2 迁移到 v3？请查看 [3.0 迁移指南](https://github.com/payloadcms/payload/blob/main/docs/migration-guide/overview.mdx)了解操作方法。

## 🙋 贡献

如果你想为这个仓库做贡献，请按照 [contributing.md](./CONTRIBUTING.md) 中的说明进行操作。

## 📚 示例

[示例目录](./examples)是学习如何以各种方式设置 Payload 的优质资源，你也可以在我们的博客和社交媒体上找到更多优秀示例。

如果你想运行示例，可以使用 `create-payload-app` 从示例创建项目：

```sh
npx create-payload-app --example example_name
```

你可以在这里查看更多示例：

- [示例目录](./examples)
- [Payload 博客](https://payloadcms.com/blog)
- [Payload YouTube](https://www.youtube.com/@payloadcms)

## 🔌 插件

Payload 具有高度可扩展性，允许你安装或分发用于添加或删除功能的插件。有官方支持和社区支持的插件可供使用。如果你有自己的插件，请考虑在 GitHub 仓库中添加 `payload-plugin` 话题，以便其他人发现。

- [官方插件](https://github.com/orgs/payloadcms/repositories?q=topic%3Apayload-plugin)
- [社区插件](https://github.com/topics/payload-plugin)

## 🚨 需要帮助？

我们的 GitHub Discussions 板块和 Discord 服务器中有大量优质对话和资源。如果你遇到困难，很可能已经有人解决了你所面临的问题。👇

- [GitHub Discussions](https://github.com/payloadcms/payload/discussions)
- [GitHub Issues](https://github.com/payloadcms/payload/issues)
- [Discord](https://t.co/30APlsQUPB)
- [社区帮助](https://payloadcms.com/community-help)

## ⭐ 觉得不错？给我们点个 Star 吧

## 👏 感谢所有贡献者

<img align="left" src="https://contributors-img.web.app/image?repo=payloadcms/payload"/>
