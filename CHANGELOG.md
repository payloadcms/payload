## [0.9.4](https://github.com/payloadcms/payload/compare/v0.9.3...v0.9.4) (2021-08-06)

## [0.9.3](https://github.com/payloadcms/payload/compare/v0.9.2...v0.9.3) (2021-08-06)


### Bug Fixes

* args no longer optional in collection and global hooks ([a5ea0ff](https://github.com/payloadcms/payload/commit/a5ea0ff61945f3da106f0d9dbb6a90fb1d884061))

## [0.9.2](https://github.com/payloadcms/payload/compare/v0.9.1...v0.9.2) (2021-08-06)


### Bug Fixes

* row admin type ([deef520](https://github.com/payloadcms/payload/commit/deef5202c15301b685fe5efc8a6ff59b012ea1d4))


### Features

* allow completely disabling local file storage ([9661c6d](https://github.com/payloadcms/payload/commit/9661c6d40acc41d21eebc42b0cc1871f28d35a73))
* allows upload resizing to maintain aspect ratio ([dea54a4](https://github.com/payloadcms/payload/commit/dea54a4cccead86e6ffc9f20457f295e1c08405b))
* exposes auto-sized uploads on payload req ([9c8935f](https://github.com/payloadcms/payload/commit/9c8935fd51439627cccf3f6625236375f5909445))
* reduces group heading from h2 to h3 ([907f8fd](https://github.com/payloadcms/payload/commit/907f8fd94d7e6cfa7eac0040c134cc714f29800d))

## [0.9.1](https://github.com/payloadcms/payload/compare/v0.9.0...v0.9.1) (2021-08-03)


### Bug Fixes

* groups with failing conditions being incorrectly required on backend ([4cc0ea1](https://github.com/payloadcms/payload/commit/4cc0ea1d81cd7579cb330091eb111a27262ff031))
* relationship field access control in admin UI ([65db8d9](https://github.com/payloadcms/payload/commit/65db8d9fc2c8b556cc284966b9b69f5d6512aca5))


### Features

* exposes collection after read hook type ([01a191a](https://github.com/payloadcms/payload/commit/01a191a13967d98ebf57891efd21b2607804e4e3))

# [0.9.0](https://github.com/payloadcms/payload/compare/v0.8.2...v0.9.0) (2021-08-02)

### BREAKING CHANGES

* Due to greater plugin possibilities and performance enhancements, plugins themselves no longer accept a completely sanitized config. Instead, they accept a _validated_ config as-provided, but sanitization is now only performed after all plugins have been initialized. By config santitization, we refer to merging in default values and ensuring that the config has its full, required shape. What this now means for plugins is that within plugin code, deeply nested properties like `config.graphQL.mutations` will need to be accessed safely (optional chaining is great for this), because a user's config may not have defined `config.graphQL`. So, the only real breaking change here is are that plugins now need to safely access properties from an incoming config.

### Features

* removes sanitization of configs before plugins are instantiated ([8af3947](https://github.com/payloadcms/payload/commit/8af39472e19a26453647d1c1ab0bbce15db2c642))

## [0.8.2](https://github.com/payloadcms/payload/compare/v0.8.1...v0.8.2) (2021-08-02)


### Bug Fixes

* more advanced conditional logic edge cases ([33983de](https://github.com/payloadcms/payload/commit/33983deb3761813506348f8ff804a2117d1324ef))


### Features

* export error types ([12cba62](https://github.com/payloadcms/payload/commit/12cba62930b8d35b22e3a7a99cf06df29bd4964a))

## [0.8.1](https://github.com/payloadcms/payload/compare/v0.8.0...v0.8.1) (2021-07-29)


### BREAKING CHANGES

* If you have any plugins that are written in TypeScript, we have changed plugin types to make them more flexible. Whereas before you needed to take in a fully sanitized config, and return a fully sanitized config, we now have simplified that requirement so that you can write configs in your own plugins just as an end user of Payload can write their own configs.

Now, configs will be sanitized **_before_** plugins are executed **_as well as_** after plugins are executed.

So, where your plugin may have been typed like this before:

```ts
 import { SanitizedConfig } from 'payload/config';
 
 const plugin = (config: SanitizedConfig): SanitizedConfig => {
  return {
    ...config,
  }
 }
```

It can now be written like this:

```ts
 import { Config } from 'payload/config';
 
 const plugin = (config: Config): Config => {
  return {
    ...config,
  }
 }
```

### Features

* improves plugin writability ([a002b71](https://github.com/payloadcms/payload/commit/a002b7105f5c312e846c80032a350046db10236c))

# [0.8.0](https://github.com/payloadcms/payload/compare/v0.7.10...v0.8.0) (2021-07-28)

### BREAKING CHANGES

* There have been a few very minor, yet breaking TypeScript changes in this release. If you are accessing Payload config types from directly within the `dist` folder, like any of the following:

- `import { PayloadCollectionConfig, CollectionConfig } from 'payload/dist/collections/config/types';`
- `import { PayloadGlobalConfig, GlobalConfig } from 'payload/dist/globals/config/types';`
- `import { Config, PayloadConfig } from 'payload/config';`

You may need to modify your code to work with this release. The TL;DR of the change is that we have improved our naming conventions of internally used types, which will become more important over time. Now, we have landed on a naming convention as follows:

- Incoming configs, typed correctly for optional / required config properties, are named `Config`, `CollectionConfig`, and `GlobalConfig`.
- Fully defaulted, sanitized, and validated configs are now named `SanitizedConfig`, `SanitizedCollectionConfig`, and `SanitizedGlobalConfig`.

They can be imported safely outside of the `dist` folder now as well. For more information on how to properly import which types you need, see the following Docs pages which have now been updated with examples on how to properly access the new types:

- [Base Payload config docs](https://payloadcms.com/docs/configuration/overview)
- [Collection config docs](https://payloadcms.com/docs/configuration/collections)
- [Global config docs](https://payloadcms.com/docs/configuration/globals)

### Bug Fixes

* ensures text component is always controlled ([c649362](https://github.com/payloadcms/payload/commit/c649362b95f1ddaeb47cb121b814ca30712dea86))


### Features

* revises naming conventions of config types ([5a7e5b9](https://github.com/payloadcms/payload/commit/5a7e5b921d7803ec2da8cc3dc8162c1dd6828ca0))

## [0.7.10](https://github.com/payloadcms/payload/compare/v0.7.9...v0.7.10) (2021-07-27)


### Bug Fixes

* jest debug testing ([a2fa30f](https://github.com/payloadcms/payload/commit/a2fa30fad2cd9b8ab6ac4f3905706b97d5663954))
* skipValidation logic ([fedeaea](https://github.com/payloadcms/payload/commit/fedeaeafc9607f7c21e40c2df44923056e5d460c))


### Features

* improves conditional logic performance and edge cases ([d43390f](https://github.com/payloadcms/payload/commit/d43390f2a4c5ebeb7b9b0f07e003816005efc761))

## [0.7.9](https://github.com/payloadcms/payload/compare/v0.7.8...v0.7.9) (2021-07-27)


### Bug Fixes

* missing richtext gutter ([4d1249d](https://github.com/payloadcms/payload/commit/4d1249dd03f441ee872e66437118c3e8703aaefc))


### Features

* add admin description to collections and globals ([4544711](https://github.com/payloadcms/payload/commit/4544711f0e4ea0e78570b93717a4bf213946d9b3))
* add collection slug to schema validation errors ([ebfb72c](https://github.com/payloadcms/payload/commit/ebfb72c8fa0723ec75922c6fa4739b48ee82b29f))
* add component support to collection and global description ([fe0098c](https://github.com/payloadcms/payload/commit/fe0098ccd9b3477b47985222659a0e3fc2e7bb3b))
* add component support to field description ([e0933f6](https://github.com/payloadcms/payload/commit/e0933f612a70af0a18c88ef96e7af0878e20cf01))
* add customizable admin field descriptions ([dac60a0](https://github.com/payloadcms/payload/commit/dac60a024b0eb7197d5a501daea342827ee7c751))
* add descriptions to every allowed field type, globals and collections ([29a1108](https://github.com/payloadcms/payload/commit/29a1108518c7942f8ae06a990393a6e0ad4b6b16))
* add global slug and field names to schema validation errors ([bb63b4a](https://github.com/payloadcms/payload/commit/bb63b4aad153d125f68bf1fe1e9a3e4a5358ded9))
* improves group styling when there is no label ([ea358a6](https://github.com/payloadcms/payload/commit/ea358a66e8b8d2e54dd162eae0cf7066128cfabf))

## [0.7.8](https://github.com/payloadcms/payload/compare/v0.7.7...v0.7.8) (2021-07-23)


### Features

* fixes group label schema validation ([cbac888](https://github.com/payloadcms/payload/commit/cbac8887ddb7a4446f5502c577d4600905b13380))

## [0.7.7](https://github.com/payloadcms/payload/compare/v0.7.6...v0.7.7) (2021-07-23)


### Bug Fixes

* accurately documents the props for the datepicker field ([dcd8052](https://github.com/payloadcms/payload/commit/dcd8052498dd2900f228eaffcf6142b63e8e5a9b))


### Features

* only attempts to find config when payload is initialized ([266ccb3](https://github.com/payloadcms/payload/commit/266ccb374449b0a131a574d9b12275b6bb7e5c60))

## [0.7.6](https://github.com/payloadcms/payload/compare/v0.7.5...v0.7.6) (2021-07-07)

## [0.7.5](https://github.com/payloadcms/payload/compare/v0.7.4...v0.7.5) (2021-07-07)


### Bug Fixes

* crash on bullet list de-selection ([5388513](https://github.com/payloadcms/payload/commit/538851325d1558425918098e35e108595189774b))
* updates demo richtext elements with proper SCSS ([0075912](https://github.com/payloadcms/payload/commit/007591272f77e5dcc5e5a4a8f71459402f6605d4))


### Features

* adds plugins infrastructure ([6b25531](https://github.com/payloadcms/payload/commit/6b255315e0c475d700383f2738839966449fc563))
* enables backspace to deactivate richtext list elements ([91141ad](https://github.com/payloadcms/payload/commit/91141ad62f0f6ef3528e62eef23711e937d302ce))

## [0.7.4](https://github.com/payloadcms/payload/compare/v0.7.3...v0.7.4) (2021-07-01)


### Bug Fixes

* adds proper scss stylesheets to payload/scss ([84e31ae](https://github.com/payloadcms/payload/commit/84e31aed141efe5aa1b0c24a61bf35eb3d671242))

## [0.7.3](https://github.com/payloadcms/payload/compare/v0.7.2...v0.7.3) (2021-07-01)


### Bug Fixes

* changes scss imports to allow vars imports to payload projects ([ea80fd6](https://github.com/payloadcms/payload/commit/ea80fd68b14139cb01259a47ea597d33526d0c76))


### Features

* export all field prop types for custom components ([5bea9ae](https://github.com/payloadcms/payload/commit/5bea9ae1263f1d93e8b011ae97bb067a8c9bb4e1))

## [0.7.2](https://github.com/payloadcms/payload/compare/v0.7.1...v0.7.2) (2021-06-22)


### Bug Fixes

* parses incoming numbers through query string for use in where clauses ([4933b34](https://github.com/payloadcms/payload/commit/4933b34f6b5dfa960c2a830a8c74769d6712130a))
* respect maxDepth 0 ([95c1650](https://github.com/payloadcms/payload/commit/95c165018edf8e80c4dc828d3d77b6fa6d799de9))
* safely stringifies ObjectIDs while populating relationships ([d6bc6f9](https://github.com/payloadcms/payload/commit/d6bc6f9f0e8391818783cdf7edf282506e2c9fed))


### Features

* adds maxDepth to relationships and upload fields ([880dabd](https://github.com/payloadcms/payload/commit/880dabdcad10dcd9f057da71a601190fbeecf92d))

## [0.7.1](https://github.com/payloadcms/payload/compare/v0.7.0...v0.7.1) (2021-06-21)


### Bug Fixes

* babel config file error ([3af2554](https://github.com/payloadcms/payload/commit/3af2554eacab45317745ad72c8848b4dd1ddc16a))

# [0.7.0](https://github.com/payloadcms/payload/compare/v0.6.10...v0.7.0) (2021-06-21)


### Bug Fixes

* handle all scenarios in select cell ([dd40ab0](https://github.com/payloadcms/payload/commit/dd40ab07fa359802578ed948136018dfc9a538c5))


### Features

* exposes babel config via payload/babel ([#203](https://github.com/payloadcms/payload/issues/203)) ([67c1e28](https://github.com/payloadcms/payload/commit/67c1e280eb891a736703e242518bbeac8b8c2878))
* user preferences ([#195](https://github.com/payloadcms/payload/issues/195)) ([fb60bc7](https://github.com/payloadcms/payload/commit/fb60bc79a11d69c5dab6b4921d62614a7b914fef))

## [0.6.10](https://github.com/payloadcms/payload/compare/v0.6.9...v0.6.10) (2021-05-23)

## [0.6.9](https://github.com/payloadcms/payload/compare/v0.6.8...v0.6.9) (2021-05-16)


### Bug Fixes

* misc responsive improvements
* date clipping in sidebar ([#165](https://github.com/payloadcms/payload/issues/165))
* misc polish to popup component
* admin _verified field not displaying proper field value
* properly typed express-fileupload config options ([#180](https://github.com/payloadcms/payload/issues/180))

## [0.6.8](https://github.com/payloadcms/payload/compare/v0.6.7...v0.6.8) (2021-05-12)


### Features

* add mimeTypes validation for uploads ([a5fcdf0](https://github.com/payloadcms/payload/commit/a5fcdf03bae681c5b2e0de6b681d20efe8ebdd7f))
* disables user scalable in mobile ([#177](https://github.com/payloadcms/payload/issues/177)) ([46c1a36](https://github.com/payloadcms/payload/commit/46c1a36fdb9363201b65ecdec44088cb41532bd6))
* exposes locale within preview function ([2d67448](https://github.com/payloadcms/payload/commit/2d67448d8ad1a7d4238820d0ccd93da961fc051c))
* restrict upload mime types in file picker ([1c6f32f](https://github.com/payloadcms/payload/commit/1c6f32f2881410a1534b61711af05fd35e7977c2))

## [0.6.7](https://github.com/payloadcms/payload/compare/v0.6.6...v0.6.7) (2021-05-07)


### Features

* add ability to hide gutter for RichText fields ([e791c5b](https://github.com/payloadcms/payload/commit/e791c5b7b325e58d273041ff426d19bafc4fc102))
* allows group field gutter to be disabled ([9aebeaf](https://github.com/payloadcms/payload/commit/9aebeaf579b9c8add64734dce92e4d92c0a1a24c))
* exposes component types ([99466fa](https://github.com/payloadcms/payload/commit/99466fa41e24779705f517d29d57e6174508ebcc))
* shrink image thumbnails on larger screens ([e565fa6](https://github.com/payloadcms/payload/commit/e565fa6f1ce13d76b8111e543d4c799a5d7f450e))
* support global date format ([670ccf2](https://github.com/payloadcms/payload/commit/670ccf2f589c306d13f3060b8acf4f4d33fcdd23))

## [0.6.6](https://github.com/payloadcms/payload/compare/v0.6.5...v0.6.6) (2021-04-27)


### Bug Fixes

* graphql returns compatible error format ([6f188b1](https://github.com/payloadcms/payload/commit/6f188b1fa6e631a992439f055e8e76c341ca6dfa))
* handle rich text saving as empty string ([382089b](https://github.com/payloadcms/payload/commit/382089b484b278e6ff491a2447ad06c41b96d5e3))
* removes incoming.data.length check, since data is typed as a keyed array when it is an instance of APIError ([2643e1a](https://github.com/payloadcms/payload/commit/2643e1a1006f86b24001f65cf39da245fa4daaad))
* support image resizing on M1 chip ([8cfc039](https://github.com/payloadcms/payload/commit/8cfc039cd0ffd497728f185b6ab45695302d3b95))
* update operation can save password changes ([a85bf9e](https://github.com/payloadcms/payload/commit/a85bf9e836f9463d94f13857254f5d4df6f68c72))

## [0.6.5](https://github.com/payloadcms/payload/compare/v0.6.4...v0.6.5) (2021-04-22)


### Features

* builds plugin infrastructure ([#149](https://github.com/payloadcms/payload/issues/149)) ([f17c6e4](https://github.com/payloadcms/payload/commit/f17c6e4010de07578af21398f667fa55bc8343bc))

## [0.6.4](https://github.com/payloadcms/payload/compare/v0.6.3...v0.6.4) (2021-04-21)


### Bug Fixes

* allows _verificationToken to come back via showHiddenFields ([74430ea](https://github.com/payloadcms/payload/commit/74430ea1519c1ba0ad655daf4e8f5d8dae855358))

## [0.6.3](https://github.com/payloadcms/payload/compare/v0.6.2...v0.6.3) (2021-04-21)


### Bug Fixes

* make admin field properties in joi schema match TS types ([519c021](https://github.com/payloadcms/payload/commit/519c021525be114f43ad321233a9b8211d309ed0))
* properly label arrays/blocks with plural and singular ([fa49811](https://github.com/payloadcms/payload/commit/fa49811377103db9241f43537e508da62eb19076))
* safely parses incoming stringified richtext json ([9c95c75](https://github.com/payloadcms/payload/commit/9c95c750305633e99e7d80b5ba407b5b3146d691))

## [0.6.2](https://github.com/payloadcms/payload/compare/v0.6.1...v0.6.2) (2021-04-19)


### Features

* modifies relationship field to react to changing relationTo ([ddf25fb](https://github.com/payloadcms/payload/commit/ddf25fbb6559d93dd5b9105bd4a0a952fc72154b))

## [0.6.1](https://github.com/payloadcms/payload/compare/v0.6.0...v0.6.1) (2021-04-19)


### Bug Fixes

* cleans up duplicative columns ([5f2073a](https://github.com/payloadcms/payload/commit/5f2073ae685f22d099bc8f0d3e406e73ee59cd1d))
* graphql localized relationship bugs ([280f809](https://github.com/payloadcms/payload/commit/280f8094217de759ba6424dfd2294a6bfcb1d57a))
* moves enableRichTextRelationship to proper spot ([16ca22b](https://github.com/payloadcms/payload/commit/16ca22b4cc0d8e5d106fa8c8c6e2dde0ff972839))


### Features

* sets enableRichTextRelationship to true by default ([9970470](https://github.com/payloadcms/payload/commit/99704707dda25f8617d26552942915aa6e9d7a57))

# [0.6.0](https://github.com/payloadcms/payload/compare/v0.5.10...v0.6.0) (2021-04-19)

### BREAKING CHANGES

* By default, all Collection and Global access control functions are now set to require a user to be logged in to interact through GraphQL or REST APIs. This default access control is set to ensure that your API data is secure out of the box. From there, you can opt to publicly expose API actions as you need.

#### Migration Instructions to `0.6.x`:

If you have any Collections or Globals that should be publicly available without being logged in, you need to define an access control function for each operation that needs to be publicly available.

For example, if you have a `pages` collection with no existing access control, and it should be publicly readable, you should change its config from this:

```js
const Page = {
  slug: 'pages',
  access: {
    // No `read` access control was set
  }
}
```

To:

```js
const Page = {
  slug: 'pages',
  access: {
    // Now we explicitly allow public read access
    // to this collection's documents
    read: () => true
  }
}
```

If none of your collections or globals should be publicly exposed, you don't need to do anything to upgrade.

### Bug Fixes

* clears richtext element on enter, refocuses on toolbar button click ([4b19795](https://github.com/payloadcms/payload/commit/4b1979540d2ec33ce8396f572baba5e64962c0da))
* ensures api keys are properly populated in admin ([4359a70](https://github.com/payloadcms/payload/commit/4359a70a8b0bca380cc513dfcb83b2fbe28cbef4))
* ensures first relationship options are loaded only once ([75a5b04](https://github.com/payloadcms/payload/commit/75a5b047056b4e4e7a415a6903a1131cc61b0318))
* searching on relationship fields properly fetches results ([b86c3da](https://github.com/payloadcms/payload/commit/b86c3daa9952ccc9db324fecd53bb75f69cecfd4))
* upload useAsTitle set to filename by default ([7db23f8](https://github.com/payloadcms/payload/commit/7db23f8ebbf115ca45fa55718b0d1be18ca54cd3))


### Features

* autolabel fields when label is omitted ([#42](https://github.com/payloadcms/payload/issues/42)) ([b383eb6](https://github.com/payloadcms/payload/commit/b383eb65c6b524fd7cfddb7ac60a3f263e1b891e))
* dynamically populates richtext relationships ([3530424](https://github.com/payloadcms/payload/commit/353042467f12458994d734cf54423eb95eea9003))
* improve unique field value error handling ([21b2bd4](https://github.com/payloadcms/payload/commit/21b2bd4b6708823880fb87035495ab4c2c55da90))
* improves margins in rich text elements ([20d7a01](https://github.com/payloadcms/payload/commit/20d7a01919634faa366add792f98a36e68f213e9))

## [0.5.10](https://github.com/payloadcms/payload/compare/v0.5.9...v0.5.10) (2021-04-14)


### Bug Fixes

* feeds collectionSlug through me auth for graphql resolver ([9ee2f9c](https://github.com/payloadcms/payload/commit/9ee2f9c0dc25ea32ee0f0864e30afb389903b3cd))

## [0.5.9](https://github.com/payloadcms/payload/compare/v0.5.8...v0.5.9) (2021-04-14)

## [0.5.8](https://github.com/payloadcms/payload/compare/v0.5.7...v0.5.8) (2021-04-13)


### Bug Fixes

* revises graphql import syntax ([20f1e6c](https://github.com/payloadcms/payload/commit/20f1e6cb044254af7a0db72cc9dab95d32db0333))

## [0.5.7](https://github.com/payloadcms/payload/compare/v0.5.5...v0.5.7) (2021-04-13)


### Bug Fixes

* clears verificationToken when _verified is true ([e58b152](https://github.com/payloadcms/payload/commit/e58b152d40394ec59b7a779feb3b9f02a6f4a0b6))
* custom query / mutation types ([a78fc97](https://github.com/payloadcms/payload/commit/a78fc974b80b153028e4796b15d2b6b17fe023bb))
* ensures email is still prefilled in auth configs ([31c41c2](https://github.com/payloadcms/payload/commit/31c41c22eca96721ce2982bcf5860dfd9e5c7beb))
* ensures failed conditions send path to form ([dff72fb](https://github.com/payloadcms/payload/commit/dff72fbf2f49d372423da8bc2840aad6d9c1ea1b))
* handle add/remove labels for all usage of Array field type ([ddf5df2](https://github.com/payloadcms/payload/commit/ddf5df290c5b36af0dc37a79c476001387f73275))
* make upload cell mimetype inline ([414bc01](https://github.com/payloadcms/payload/commit/414bc01b055ed6075613f4241f185cb0c25f046d))
* pagination calculation for current range ([000dee8](https://github.com/payloadcms/payload/commit/000dee85bd5858fe3d45e08c62943a6a1c6e349c))
* updates config schema for graphQL mutations and queries ([afc9454](https://github.com/payloadcms/payload/commit/afc9454465d7445c45f560eade0b17d831b04e2c))


### Features

* auto verifies first user registration ([8f720c0](https://github.com/payloadcms/payload/commit/8f720c000df26d34f7f8652f170525c7d54184a5))
* optimize save within Edit ([91d37fb](https://github.com/payloadcms/payload/commit/91d37fb41d820fe2cdcdbb28f999df2de751316e))
* prevents DraggableSections from re-mounting on doc save ([0094837](https://github.com/payloadcms/payload/commit/00948376358a4bfecc3a6cb8cf0a6ad9a0b5a227))
* remembers conditional field values after removing / readding ([988d0a4](https://github.com/payloadcms/payload/commit/988d0a4b08e1228bb358bb133bcb05dbce7f55ab))
* remove mimetype from upload cell type ([776b9c9](https://github.com/payloadcms/payload/commit/776b9c9c30b6d9d795c509a558fd1eee666b2652))

## [0.5.5](https://github.com/payloadcms/payload/compare/v0.5.4...v0.5.5) (2021-04-02)


### Features

* allows soft breaks in rich text ([ecd277d](https://github.com/payloadcms/payload/commit/ecd277da7dff24dc49f6061e7d50e4b21bc285c9))

## [0.5.4](https://github.com/payloadcms/payload/compare/v0.5.2...v0.5.4) (2021-04-02)


### Bug Fixes

* ensures arrays and blocks reset row count on initialState change ([9a7c0e3](https://github.com/payloadcms/payload/commit/9a7c0e3dbdf4e6decb03ae085a41fb239fd5b7a8))
* unique indices ([23c45f1](https://github.com/payloadcms/payload/commit/23c45f137ac97c99ed38969bed64928f2ce2795e))

## [0.5.2](https://github.com/payloadcms/payload/compare/v0.5.1...v0.5.2) (2021-03-31)


### Bug Fixes

* modal issues with richtext relationship ([8ea4407](https://github.com/payloadcms/payload/commit/8ea4407f04fd4b63df6afffbe15301f7d5746016))

## [0.5.1](https://github.com/payloadcms/payload/compare/v0.5.0...v0.5.1) (2021-03-29)


### Bug Fixes

* base auth / upload fields no longer cause validation issues ([23e1fc3](https://github.com/payloadcms/payload/commit/23e1fc3f73673d4694763908bb819c77bf600702))

# [0.5.0](https://github.com/payloadcms/payload/compare/v0.4.7...v0.5.0) (2021-03-29)

### BREAKING CHANGES
* changes global find and update payload api from global to slug as the key to find/update with ([c71ba2b](https://github.com/payloadcms/payload/commit/c71ba2b079d109d4028d74f76603905d9382d364))


### Bug Fixes

* allows absolute urls within adminThumbnail ([51b46d4](https://github.com/payloadcms/payload/commit/51b46d44b0c88387d8b23859129f163b581bf1cc))
* handles empty indices within array field data ([d47e2c5](https://github.com/payloadcms/payload/commit/d47e2c57868667f2ff9ca87aa9ad862687bd985e))
* moving nested arrays now properly persists row count ([5f9a5c8](https://github.com/payloadcms/payload/commit/5f9a5c859eca8854592b2a7a32bef50db4584709))
* validation consistency within admin ([50b9937](https://github.com/payloadcms/payload/commit/50b99370d2b849e858fd64e6018ebf0e94103998))


### Features

* saves cursor position when relationship element is added to richText ([d24b3f7](https://github.com/payloadcms/payload/commit/d24b3f72ce222e4551c12e202238f171f9cc4b97))

## [0.4.7](https://github.com/payloadcms/payload/compare/v0.4.6...v0.4.7) (2021-03-15)

## [0.4.6](https://github.com/payloadcms/payload/compare/v0.4.5...v0.4.6) (2021-03-14)


### Features

* allows admin thumbnail to be set programmatically ([b6a9fe4](https://github.com/payloadcms/payload/commit/b6a9fe4bcfc85815a60a3fe8d3cb38b7ae673424))
* exports collection field hook types from payload/types ([36aae5c](https://github.com/payloadcms/payload/commit/36aae5c37f8ea8c5dde16a898a28b9301efa6a5b))
* only runs adminThumbnail func if image type ([5e1ddb5](https://github.com/payloadcms/payload/commit/5e1ddb552ee9fc8972c9537eee62cddc93a24f42))
* provides field access control with document data ([339f750](https://github.com/payloadcms/payload/commit/339f7503a41802421bb38c8cf5da0f0f1573bdd6))
* reorders uploads to provide beforeChange hooks with upload data ([3c42e6e](https://github.com/payloadcms/payload/commit/3c42e6e6af849a8acc45e93017b0eafea74ecdba))

## [0.4.5](https://github.com/payloadcms/payload/compare/v0.4.4...v0.4.5) (2021-03-04)

### Bug Fixes
* config validation allow admin dashboard ([2d1d1b4](https://github.com/payloadcms/payload/commit/2d1d1b4f32bcc6ee1ce709208ae28369611e5bdd))

## [0.4.4](https://github.com/payloadcms/payload/compare/v0.4.3...v0.4.4) (2021-03-04)

### Bug Fixes
* email verification template missing token ([93ed664](https://github.com/payloadcms/payload/commit/93ed6649201511edfaea14c199022f05623c404c))

## [0.4.1](https://github.com/payloadcms/payload/compare/v0.4.0...v0.4.3) (2021-03-04)

### Documentation
* fixed broken links throughout docs ([3afefbe](https://github.com/payloadcms/payload/commit/3afefbe5922ee7aff496a96c61ff9a5270d6a7cb))

## [0.4.0](https://github.com/payloadcms/payload/compare/v0.3.0...v0.4.0) (2021-02-28)

### Breaking Changes
* reverts preview function to only requiring the return of a preview URL ([ca14e66](https://github.com/payloadcms/payload/commit/ca14e66a580fea94ef71416edf6c8caffcf446b0))

### Features
* implements new billing model, including new Personal license which is free forever ([c97ddeb](https://github.com/payloadcms/payload/commit/c97ddeb2d96f949604d46212166c4784330cc72d))
* simplifies logic in update operations ([e268e25](https://github.com/payloadcms/payload/commit/e268e25719dd4ebd1a6818dca86d12dc057386ca))
* removes the requirement of returning a value from field hooks ([4de5605](https://github.com/payloadcms/payload/commit/4de56059319a6d13b6f0ec20ac4d344f265446bf))


### Bug Fixes
* properly exposes scss variables for re-use ([c1b2301](https://github.com/payloadcms/payload/commit/c1b230165033ed3cf382a6e42b590815489525f9))
* explicitly sets modal z-index and css breakpoints ([c1b2301](https://github.com/payloadcms/payload/commit/c1b230165033ed3cf382a6e42b590815489525f9))
* removes `overwrite` from update operation to ensure hidden fields don't get lost on document update ([a8e2cc1](https://github.com/payloadcms/payload/commit/a8e2cc11af177641409ff7726ed8c4f1a154dee4))

## [0.3.0](https://github.com/payloadcms/payload/compare/v0.2.13...v0.3.0) (2021-02-23)

### Bug Fixes
* properly exposes scss variables for re-use ([c1b2301](https://github.com/payloadcms/payload/commit/c1b230165033ed3cf382a6e42b590815489525f9))
* explicitly sets modal z-index and css breakpoints ([c1b2301](https://github.com/payloadcms/payload/commit/c1b230165033ed3cf382a6e42b590815489525f9))
* removes `overwrite` from update operation to ensure hidden fields don't get lost on document update ([a8e2cc1](https://github.com/payloadcms/payload/commit/a8e2cc11af177641409ff7726ed8c4f1a154dee4))


## [0.2.13](https://github.com/payloadcms/payload/compare/v0.2.12...v0.2.13) (2021-02-20)

### Breaking Changes
* Preview function now no longer takes form field state as an arg and instead takes a copy of the document itself

### Features
* supports newTab in Button, updates generatePreviewURL api to forward through PreviewButton ([6b6297f](https://github.com/payloadcms/payload/commit/6b6297fb2d22b813f45729429b7efbe9a6ab97da))
* detaches localization from mongoose entirely ([162ec74](https://github.com/payloadcms/payload/commit/162ec74445c51a79cd50f75ffb56de8e4bcf9ace))

### Bug Fixes
* infinite loop caused within block component ([9e42d11](https://github.com/payloadcms/payload/commit/9e42d119e471b0efe0d6f69e99d0e31ba5e9237f))
* sets sparse true if field localized and unique ([2bc5c59](https://github.com/payloadcms/payload/commit/2bc5c59fec842cd5c5adf201084cdba9b0cab310))
* returns entire doc to generatePreviewURL callback of PreviewButton ([9b9d0f2](https://github.com/payloadcms/payload/commit/9b9d0f24b54d46c24734f30ed9640d25e6c19097))
* log mongoose connect error message ([e36c7d2](https://github.com/payloadcms/payload/commit/e36c7d269c4b5b49d6c85f416b26196999aadfc0))

### Documentation
* removes incorrect hasMany from upload field type ([e549298](https://github.com/payloadcms/payload/commit/e549298ad5a9a6116659258bb738f5d87abe4ff7))


## [0.2.12](https://github.com/payloadcms/payload/compare/v0.2.11...v0.2.12) (2021-02-1-0)

### Bug Fixes
* middleware for cors set up on static files
* windows compatible upload filename paths


## [0.2.11](https://github.com/payloadcms/payload/compare/v0.2.11...v0.2.12) (2021-02-05)

### Bug Fixes
* middleware for cors set up on static files ([55e0de1](https://github.com/payloadcms/payload/commit/55e0de1719ec387e2182bf33922602243f7eda94))
* file size in local operations ([0feb7b7](https://github.com/payloadcms/payload/commit/0feb7b7379de6429cf5cb1cdbdad0142f72cc5dc))


## [0.2.11](https://github.com/payloadcms/payload/compare/v0.2.10...v0.2.11) (2021-02-05)

### Features
* allows upload through Local API ([1a59028](https://github.com/payloadcms/payload/commit/1a590287ea181e4548c8e75d8cdb25ada5cbbdbf))

### Bug Fixes
* fix localization within blocks ([e50fc1f](https://github.com/payloadcms/payload/commit/e50fc1f3142ae5e387cef3c778988c473b04417e))
* forces fallbackLocale to null in update ops ([3005360](https://github.com/payloadcms/payload/commit/300536033ffe50a2eaedd2a714e844a5282f2ef0))


## [0.2.10](https://github.com/payloadcms/payload/compare/v0.2.9...v0.2.10) (2021-02-04)

### Features
* add support for setting mongoose connection options ([82c4898](https://github.com/payloadcms/payload/commit/82c489841c418b953c7f08d30c8b19751ff050f4))
* admin ui create first user add confirm password field (https://github.com/payloadcms/payload/commit/60453fec9ee17e8f83f7e98c5e2b2e39bc6d0365)

### Bug Fixes
* flag scss variables with default ([8916e8a](https://github.com/payloadcms/payload/commit/8916e8af45e179748bf6f2a75216e8d1c35958f2))
* relationship component hasMany bug ([d540706](https://github.com/payloadcms/payload/commit/d5407060d079c333081b0298e45dfe866d31b86e))
* hide force unlock in admin ui when creating auth collection item ([3bd0de0](https://github.com/payloadcms/payload/commit/3bd0de0a0b6832f5940474c8c40fd85f6fcd1b74))


## [0.2.9](https://github.com/payloadcms/payload/compare/v0.2.6...v0.2.9) (2021-01-27)

### Bug Fixes

* field validation type can return promise ([06ddab1](https://github.com/payloadcms/payload/commit/06ddab124919b28b74667e36e315682a0c9cf459))

## [0.2.8](https://github.com/payloadcms/payload/compare/v0.2.6...v0.2.8) (2021-01-25)

### Chore

* add bugs and keywords to package.json ([37f5b32](https://github.com/payloadcms/payload/commit/37f5b3283363220caa63a5066011b1cb9841812d))

## [0.2.6](https://github.com/payloadcms/payload/compare/v0.2.5...v0.2.6) (2021-01-25)



## [0.2.5](https://github.com/payloadcms/payload/compare/v0.2.4...v0.2.5) (2021-01-25)


### Bug Fixes

* field gutter padding ([90d2078](https://github.com/payloadcms/payload/commit/90d20786c33b2ef4ea937e75769c023c5776db1b))
* richtext sticky toolbar within block ([8218343](https://github.com/payloadcms/payload/commit/8218343b6cf629faed0f752fb27b546684580ec4))



## [0.2.4](https://github.com/payloadcms/payload/compare/v0.2.3...v0.2.4) (2021-01-24)


### Bug Fixes

* block field styles ([36f0bd8](https://github.com/payloadcms/payload/commit/36f0bd81eb340b6d8ac3011a4b10e828e79c20d8))



## [0.2.3](https://github.com/payloadcms/payload/compare/v0.2.2...v0.2.3) (2021-01-24)


### Bug Fixes

* ensures modal heights are 100% of viewport ([7edab5d](https://github.com/payloadcms/payload/commit/7edab5d3543db27c444b180548fc076dd483848a))



## [0.2.2](https://github.com/payloadcms/payload/compare/v0.2.1...v0.2.2) (2021-01-24)


### Bug Fixes

* revert serverURL config change ([f558bd2](https://github.com/payloadcms/payload/commit/f558bd2733a82f1ed9d14604f8b3dea5bb5e8ef5))


### Features

* adds better serverURL validation ([75056e2](https://github.com/payloadcms/payload/commit/75056e2e13c4d5f9a2d4341282b6c1f4c42e1609))


### Reverts

* Revert "docs: configuration overview describe serverURL and removed from code examples where not needed" ([bd446b6](https://github.com/payloadcms/payload/commit/bd446b60b8c56857fb99cda5a9f8a93216efc8b0))



## [0.2.1](https://github.com/payloadcms/payload/compare/v0.2.0...v0.2.1) (2021-01-24)


### Features

* exposes further types ([e056348](https://github.com/payloadcms/payload/commit/e056348850638f3c621072668a4a9232492c209b))



# [0.2.0](https://github.com/payloadcms/payload/compare/v0.1.146...v0.2.0) (2021-01-23)


### Bug Fixes

* better error handler when sendMail fails ([ea47736](https://github.com/payloadcms/payload/commit/ea47736274b3b176da534b461907da4ddeffa5e9))
* button css specificity ([d8b5233](https://github.com/payloadcms/payload/commit/d8b52337b2d34785817b536fe7017853bbc3b5a6))
* migrates Condition UI value/operator pattern ([d23cc20](https://github.com/payloadcms/payload/commit/d23cc20b3d0fa061a2b8111f65e04dd5d35a5557))
* target es2019, optional chaining not supported for Node < 14 ([52a0096](https://github.com/payloadcms/payload/commit/52a0096d3b8eca47a8afdef42d47117d028b754d))


### Features

* adds contributing guidelines ([de5bf6e](https://github.com/payloadcms/payload/commit/de5bf6ea280f771e96de703b3732f851903b1fe5))
* allows admins to autoverify via admin ([a6a23e3](https://github.com/payloadcms/payload/commit/a6a23e3b154802e5ec874760b3d3e44e90f56e7c))
* auto-removes verificationToken upon manual user verify ([2139eb4](https://github.com/payloadcms/payload/commit/2139eb410f8c95505ef7b90e35a099b0955d4e12))
* serverURL no longer required in config ([4770f24](https://github.com/payloadcms/payload/commit/4770f24adb50367ec6f6637cafc3f076023b0416))



## [0.1.146](https://github.com/payloadcms/payload/compare/v0.1.145...v0.1.146) (2021-01-18)


### Bug Fixes

* localized groups ([f38e0fc](https://github.com/payloadcms/payload/commit/f38e0fce981a188b0adb2050cfe8a8e0f047e606))
* textarea handle undefined ([ba31397](https://github.com/payloadcms/payload/commit/ba31397ac15402eb3837bcbe454e0aaf82ecbf03))



## [0.1.145](https://github.com/payloadcms/payload/compare/v0.1.144...v0.1.145) (2021-01-17)


### Bug Fixes

* add minLength and maxLength to textarea field validations ([2c98087](https://github.com/payloadcms/payload/commit/2c98087c6f40c32dcbccf557aa61ebf8fc1fe17f))
* minLength field validation error messages ([5e60b86](https://github.com/payloadcms/payload/commit/5e60b8617e715378831f10b90dedd017ed8d4a8c))



## [0.1.144](https://github.com/payloadcms/payload/compare/v0.1.143...v0.1.144) (2021-01-16)


### Bug Fixes

* add default user to collections before checking for valid relationships ([b2d05c7](https://github.com/payloadcms/payload/commit/b2d05c781d7751bbede9e37996cbdc0736d07a66))
* handle user collection 'auth: true' ([c303711](https://github.com/payloadcms/payload/commit/c3037118133a242769dfa4a31914e8e61068edcf))



## [0.1.143](https://github.com/payloadcms/payload/compare/v0.1.142...v0.1.143) (2021-01-14)


### Bug Fixes

* payload schema validation allow '*' ([bd92b0a](https://github.com/payloadcms/payload/commit/bd92b0a94ba3562b01000a58a4bc0e0071c1f35b))


### Features

* allows undefined collections ([6bb58ce](https://github.com/payloadcms/payload/commit/6bb58cecd8bc0b8faa42bc8995ec5da0421375db))



## [0.1.142](https://github.com/payloadcms/payload/compare/v0.1.141...v0.1.142) (2021-01-09)


### Bug Fixes

* adds disableDuplicate to schema validation of collections config ([e9ed7ee](https://github.com/payloadcms/payload/commit/e9ed7ee4bdc99bdcc0d86272816f3d5c6904ac2b))


### Features

* add getAdminURL and getAPIURL functions ([8db73bb](https://github.com/payloadcms/payload/commit/8db73bbec22646bc626d17bb783b10ea2d837520))
* adds build to CI ([87a1717](https://github.com/payloadcms/payload/commit/87a1717dcae8ec30892cebc46e88cabe8e62bf4c))
* disable graphQL flag that will bypass gql on payload init ([d78c76e](https://github.com/payloadcms/payload/commit/d78c76e0b4b7e2c2cc834a2a1288ec75468852ec))



## [0.1.141](https://github.com/payloadcms/payload/compare/v0.1.140...v0.1.141) (2021-01-07)


### Bug Fixes

* properly exports ES6 components ([f493263](https://github.com/payloadcms/payload/commit/f49326395dba523c2193c46a8ca4142ff761f3fd))



## [0.1.140](https://github.com/payloadcms/payload/compare/v0.1.139...v0.1.140) (2021-01-07)


### Bug Fixes

* admin field error messages ([423df3f](https://github.com/payloadcms/payload/commit/423df3f83af0f899b4a9eafa041ab7c79ccfac78))



## [0.1.139](https://github.com/payloadcms/payload/compare/v0.1.138...v0.1.139) (2021-01-06)


### Bug Fixes

* improves typing in delete op ([644519c](https://github.com/payloadcms/payload/commit/644519c539f6fda29d7b61978416b70306d0ea35))
* use FileSize and ImageSize types ([4d6871a](https://github.com/payloadcms/payload/commit/4d6871abc854385121c761eea4e4705f45c35832))



## [0.1.138](https://github.com/payloadcms/payload/compare/v0.1.137...v0.1.138) (2021-01-06)


### Bug Fixes

* removes old css ([6066f28](https://github.com/payloadcms/payload/commit/6066f2896a5c1e21137d41404f2a6161ef6de7a2))



## [0.1.137](https://github.com/payloadcms/payload/compare/v0.1.136...v0.1.137) (2021-01-05)


### Bug Fixes

* removes prod devtool ([6808637](https://github.com/payloadcms/payload/commit/680863702e67d69dc4ec8d6a48b0e1402164cc97))



## [0.1.136](https://github.com/payloadcms/payload/compare/v0.1.135...v0.1.136) (2021-01-05)



## [0.1.135](https://github.com/payloadcms/payload/compare/v0.1.134...v0.1.135) (2021-01-05)



## [0.1.134](https://github.com/payloadcms/payload/compare/v0.1.133...v0.1.134) (2021-01-05)


### Bug Fixes

* updates payload-config path within webpack ([6bf141c](https://github.com/payloadcms/payload/commit/6bf141c6d4707e622f56f5df4f8f3f366d847173))



## [0.1.133](https://github.com/payloadcms/payload/compare/v0.1.132...v0.1.133) (2021-01-05)



## [0.1.132](https://github.com/payloadcms/payload/compare/v0.1.131...v0.1.132) (2021-01-05)


### Bug Fixes

* renames webpack config alias ([c0636df](https://github.com/payloadcms/payload/commit/c0636dfe220b72c129c4e2b144e5714755a20043))



## [0.1.131](https://github.com/payloadcms/payload/compare/v0.1.130...v0.1.131) (2021-01-05)



## [0.1.130](https://github.com/payloadcms/payload/compare/v0.1.129...v0.1.130) (2021-01-05)



## [0.1.129](https://github.com/payloadcms/payload/compare/v0.1.128...v0.1.129) (2021-01-05)



## [0.1.128](https://github.com/payloadcms/payload/compare/v0.1.127...v0.1.128) (2021-01-05)


### Bug Fixes

* adds default thumbnail size ([f582a25](https://github.com/payloadcms/payload/commit/f582a254cd6b6f56bb8146923f3ab0130a4b7859))
* config validation of block imageURL ([c572057](https://github.com/payloadcms/payload/commit/c572057706f58f7759e167a724837f84e88d0d10))
* default config value for email removed as the property was moved out of config ([cf89d4c](https://github.com/payloadcms/payload/commit/cf89d4cb56add645e68cf0be31d943b734dabe39))
* demo email start on payload init ([57d2c86](https://github.com/payloadcms/payload/commit/57d2c8602fb81a5d67d34a38c25a0429c2b9c44b))
* Edit view main / sidebar widths ([e067fa1](https://github.com/payloadcms/payload/commit/e067fa12b2465d4767bc35b5f1ec0de8096f7439))
* graphQL access ([4d871c2](https://github.com/payloadcms/payload/commit/4d871c27f6eefea26ec55302e654fc3b0f4a2933))
* graphQL logout ([709cc9c](https://github.com/payloadcms/payload/commit/709cc9c294d959913b382e24dd0d7002d6a7c9cd))
* improves edit view layout constraints ([0f7046b](https://github.com/payloadcms/payload/commit/0f7046b98efd82caf98d0d872bd6e68b076452a1))
* issues with select hasMany ([a0bf503](https://github.com/payloadcms/payload/commit/a0bf503f888b7fde0c9660e9f8a461da2fab5d67))
* lowecases joi like everywhere else in payload ([5823a86](https://github.com/payloadcms/payload/commit/5823a864f926bc6441267a21277059a368410b92))
* payload config remove types for email ([faec969](https://github.com/payloadcms/payload/commit/faec969752622c70e9175cc226d888bf32ec732c))
* reinstate explicit labels for AllFields collection ([885c73c](https://github.com/payloadcms/payload/commit/885c73c838c597ac03f79558af9946686274969f))
* removes delete and unlock from baseField type and schema ([4fa942f](https://github.com/payloadcms/payload/commit/4fa942f3a02089c8320e483b896a59627c28f11e))
* removes old reliance on config.email ([e093e06](https://github.com/payloadcms/payload/commit/e093e06926e55916ddb0bdb6f17e0317dfab951c))


### Features

* allows for refresh operation to accept a deliberately specified token ([7d05069](https://github.com/payloadcms/payload/commit/7d05069f361d30ff36d990e0926a60b1c374149a))
* types this within crreate op ([d43ff8b](https://github.com/payloadcms/payload/commit/d43ff8b4a764dd203fa7eebda28b09dc21a88e31))



## [0.1.127](https://github.com/payloadcms/payload/compare/v0.1.126...v0.1.127) (2020-12-31)


### Bug Fixes

* converts class methods to arrow functions ([662839f](https://github.com/payloadcms/payload/commit/662839fb06e95001bb0ef20c4f318cc4c2fccc31))



## [0.1.126](https://github.com/payloadcms/payload/compare/v0.1.125...v0.1.126) (2020-12-30)


### Bug Fixes

* adds delete and unlock to joi baseField schema ([36d51de](https://github.com/payloadcms/payload/commit/36d51de201b27ef91f43f05992d980ad306ba9f3))



## [0.1.125](https://github.com/payloadcms/payload/compare/v0.1.124...v0.1.125) (2020-12-30)


### Bug Fixes

* removes prod source maps ([eeea06d](https://github.com/payloadcms/payload/commit/eeea06d6aaa84efdfb479baf1baad7bdf038d7cd))



## [0.1.124](https://github.com/payloadcms/payload/compare/v0.1.123...v0.1.124) (2020-12-30)


### Bug Fixes

* disable requiring default props in eslint ([64cf321](https://github.com/payloadcms/payload/commit/64cf32146ad75d8ce3e5f3e8e690391ac7884819))
* disables inline sourcemaps for admin dist ([8090b2a](https://github.com/payloadcms/payload/commit/8090b2a23bb6298fdd998d9a72c6f596e7473cb0))
* type issues that arose from reorganizing certain config props ([0c03c2e](https://github.com/payloadcms/payload/commit/0c03c2e3af34657e3dde1c3f2b675840147f78ec))
* updates typing on DatePicker component and joi schema ([5100fd3](https://github.com/payloadcms/payload/commit/5100fd35dc796c5862ef9fd7261abdcba925b020))
* webpack config override ([8401400](https://github.com/payloadcms/payload/commit/84014001297519ce7f82f691fb2c4d1c525222f9))


### Features

* allows for adding custom CSS in addition to SCSS overrides ([544a4db](https://github.com/payloadcms/payload/commit/544a4dbd3ab17e1c8c9ed864fe17b7359883d845))



## [0.1.123](https://github.com/payloadcms/payload/compare/v0.1.123...v0.1.123) (2020-12-28)


### Bug Fixes

* allows config validation to accept esmodules as components ([b8ad84c](https://github.com/payloadcms/payload/commit/b8ad84c525e597e237caf05e00832ded30668a6b))
* prod webpack publicPath ([8bda6ea](https://github.com/payloadcms/payload/commit/8bda6eaa762dff0027036d918155f4618740a84c))



## [0.1.122](https://github.com/payloadcms/payload/compare/v0.1.121...v0.1.122) (2020-12-28)


### Bug Fixes

* improves field schema validation ([db13512](https://github.com/payloadcms/payload/commit/db135129d84bab9df03516ebfa2b667acead3cc9))
* safely accesses field permissions ([1fff737](https://github.com/payloadcms/payload/commit/1fff7374d43921d203b9b655ac64dbed3867ad2a))


### Features

* sends config through babel/register ([fec718e](https://github.com/payloadcms/payload/commit/fec718e9e523b1e92ca2dc216d99eef2dcbed83a))
* splits tsconfig between admin and server ([efe0b40](https://github.com/payloadcms/payload/commit/efe0b40aca4b88084c71f851604d08cae1d62a9a))



## [0.1.121](https://github.com/payloadcms/payload/compare/v0.1.120...v0.1.121) (2020-12-27)



## [0.1.20](https://github.com/payloadcms/payload/compare/v0.1.19...v0.1.20) (2020-12-27)


### Bug Fixes

* production webpack css ([6e83edc](https://github.com/payloadcms/payload/commit/6e83edc988e9284ec52164fc6399f45ab5851652))
* removes unnecessary meta defaults in admin config ([0117f18](https://github.com/payloadcms/payload/commit/0117f18eb1dd163143e18cd8061a4b96d41c411e))


### Features

* improves edit scroll UX in Account and Globals ([604922a](https://github.com/payloadcms/payload/commit/604922a26e7aabde71b470c96ff1b27e0f7b6fc8))
* improves scrolling UX in Edit views ([a715a42](https://github.com/payloadcms/payload/commit/a715a4206ed2cedc9b02b58339e44354c571fec5))



## [0.1.19](https://github.com/payloadcms/payload/compare/v0.1.18...v0.1.19) (2020-12-27)


### Bug Fixes

* copyfiles, autocomplete transition ([5b8c721](https://github.com/payloadcms/payload/commit/5b8c721292140e4cd0ed55d13e97c1d4cd359c98))


### Features

* flattens build into one command ([8571dc3](https://github.com/payloadcms/payload/commit/8571dc396591487d2a2854b9fe93f5338eb10659))



## [0.1.18](https://github.com/payloadcms/payload/compare/v0.1.17...v0.1.18) (2020-12-27)



## [0.1.17](https://github.com/payloadcms/payload/compare/v0.1.16...v0.1.17) (2020-12-27)



## [0.1.16](https://github.com/payloadcms/payload/compare/v0.1.15...v0.1.16) (2020-12-27)


### Bug Fixes

* handle access result gracefully ([1cd578e](https://github.com/payloadcms/payload/commit/1cd578ef445499ceb3704ab28d736baaae123cbd))
* undo property fix, field exists - bad typing ([66946c8](https://github.com/payloadcms/payload/commit/66946c86973c252585e98aa3f0a453cae9dff598))



## [0.1.15](https://github.com/payloadcms/payload/compare/v0.1.14...v0.1.15) (2020-12-02)



## [0.1.14](https://github.com/payloadcms/payload/compare/v0.1.13...v0.1.14) (2020-12-02)



## [0.1.13](https://github.com/payloadcms/payload/compare/v0.1.12...v0.1.13) (2020-12-02)



## [0.1.12](https://github.com/payloadcms/payload/compare/v0.1.11...v0.1.12) (2020-12-02)



## [0.1.11](https://github.com/payloadcms/payload/compare/v0.1.10...v0.1.11) (2020-12-01)



## [0.1.10](https://github.com/payloadcms/payload/compare/v0.1.9...v0.1.10) (2020-12-01)



## [0.1.9](https://github.com/payloadcms/payload/compare/v0.1.8...v0.1.9) (2020-11-25)



## [0.1.8](https://github.com/payloadcms/payload/compare/v0.1.7...v0.1.8) (2020-11-25)



## [0.1.7](https://github.com/payloadcms/payload/compare/v0.1.6...v0.1.7) (2020-11-25)



## [0.1.6](https://github.com/payloadcms/payload/compare/v0.1.5...v0.1.6) (2020-11-25)



## [0.1.5](https://github.com/payloadcms/payload/compare/v0.1.4...v0.1.5) (2020-11-25)



## [0.1.4](https://github.com/payloadcms/payload/compare/v0.1.3...v0.1.4) (2020-11-25)



## [0.1.3](https://github.com/payloadcms/payload/compare/v0.1.2...v0.1.3) (2020-11-24)



## [0.1.2](https://github.com/payloadcms/payload/compare/v0.1.1...v0.1.2) (2020-11-24)



## [0.1.1](https://github.com/payloadcms/payload/compare/v0.1.0...v0.1.1) (2020-11-24)



# [0.1.0](https://github.com/payloadcms/payload/compare/v0.0.141...v0.1.0) (2020-11-24)


### Bug Fixes

* **webpack:** more require.resolves needed ([924eb1d](https://github.com/payloadcms/payload/commit/924eb1d0b566eb7bb3912018e06cf431e5a85524))
* **webpack:** use require.resolve for modules ([badd59a](https://github.com/payloadcms/payload/commit/badd59ac38e10e9caf700eece5761e7d65341c21))
* add missing webpack dep path-browserify ([8789dae](https://github.com/payloadcms/payload/commit/8789dae155bbb93fdef5104cc616e0a29b1b6409))


### Features

* add initial types ([983bf71](https://github.com/payloadcms/payload/commit/983bf713b395a68d2374f2446a8a759aeda48579))



## [0.0.141](https://github.com/payloadcms/payload/compare/v0.0.140...v0.0.141) (2020-11-20)



## [0.0.140](https://github.com/payloadcms/payload/compare/v0.0.139...v0.0.140) (2020-11-20)


### Features

* show email creds when explicitly set to 'mock' ([dbd305a](https://github.com/payloadcms/payload/commit/dbd305acc5b083cea08227cbff8afebe8aa4c374))
* use react-toastify for notifications ([131dd51](https://github.com/payloadcms/payload/commit/131dd51c39b08c2235582d23deb53188a04e5d80))
* validate admin user ([83d32e4](https://github.com/payloadcms/payload/commit/83d32e44498460584bbc82512df91848bcf7cf47))



## [0.0.139](https://github.com/payloadcms/payload/compare/v0.0.138...v0.0.139) (2020-11-17)


### Bug Fixes

* missed a file ([f52836a](https://github.com/payloadcms/payload/commit/f52836a7e342ecccd7409ba382eade43adb18d90))



## [0.0.138](https://github.com/payloadcms/payload/compare/v0.0.137...v0.0.138) (2020-11-17)


### Bug Fixes

* allow e-mail to be unconfigured, remove default fromName and fromAddress ([dceeeaa](https://github.com/payloadcms/payload/commit/dceeeaac6a1a9057cdd9f973c7500b3763514f0a))
* auth json schema didn't allow auth as boolean ([0694a09](https://github.com/payloadcms/payload/commit/0694a09abdde59eb8e785301230ed4e8e244c84a))
* properly concat verification and locking fields ([2624ad5](https://github.com/payloadcms/payload/commit/2624ad5f7e50332eb9212877d0eefcdcb2fa399b))


### Features

* add blind index for encrypting API Keys ([9a1c1f6](https://github.com/payloadcms/payload/commit/9a1c1f64c0ea0066b679195f50e6cb1ac4bf3552))
* add license key to access routej ([2565005](https://github.com/payloadcms/payload/commit/2565005cc099797a6e3b8995e0984c28b7837e82))



## [0.0.137](https://github.com/payloadcms/payload/commit/5c1e2846a2694a80cc8707703406c2ac1bb6af8a) (2020-11-12)
