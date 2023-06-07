

## [1.8.6](https://github.com/payloadcms/payload/compare/v1.8.5...v1.8.6) (2023-06-07)


### Bug Fixes

* [#2711](https://github.com/payloadcms/payload/issues/2711) index sortable field global versions fields ([#2775](https://github.com/payloadcms/payload/issues/2775)) ([576af01](https://github.com/payloadcms/payload/commit/576af01b6f81d24621d522e8d8b9c496eafa6df0))
* [#2767](https://github.com/payloadcms/payload/issues/2767) bulk operations missing locales in admin requests ([e30871a](https://github.com/payloadcms/payload/commit/e30871a96ff25f12401a3cc3bc5e12c064eeff3f))
* [#2771](https://github.com/payloadcms/payload/issues/2771) relationship field not querying all collections ([#2774](https://github.com/payloadcms/payload/issues/2774)) ([8b767a1](https://github.com/payloadcms/payload/commit/8b767a166aa16659d8880cc68da546251725b20b))
* adjusts activation constraint of draggable nodes ([#2773](https://github.com/payloadcms/payload/issues/2773)) ([863be3d](https://github.com/payloadcms/payload/commit/863be3d852af6c6a76021695f895badf23e776ae))
* flattens relationships in the update operation for globals [#2766](https://github.com/payloadcms/payload/issues/2766) ([#2776](https://github.com/payloadcms/payload/issues/2776)) ([3677cf6](https://github.com/payloadcms/payload/commit/3677cf688d0e456c42068b4eab0086e64407d938))
* improperly typing optional arrays with required fields as required ([f1fc305](https://github.com/payloadcms/payload/commit/f1fc305ac443ecb247622bc89067b129e96146fc))
* read-only Auth fields ([#2781](https://github.com/payloadcms/payload/issues/2781)) ([3c72f33](https://github.com/payloadcms/payload/commit/3c72f3303c57e88256266c343225157e0b081bba))
* read-only Auth fields ([#2781](https://github.com/payloadcms/payload/issues/2781)) ([60f5522](https://github.com/payloadcms/payload/commit/60f5522e67acb353e6d5ce05f0012241c192d4b4))
* recursiveNestedPaths not merging existing fields when hoisting row/collapsible fields ([#2769](https://github.com/payloadcms/payload/issues/2769)) ([536d701](https://github.com/payloadcms/payload/commit/536d7017eebd5a8e14b2936c55a7fccc90d3f530))

## [1.8.5](https://github.com/payloadcms/payload/compare/v1.8.4...v1.8.5) (2023-06-03)


### Features

* allows objectid through relationship validation ([42afa6b](https://github.com/payloadcms/payload/commit/42afa6b48aa924fa0dfc9defadf08ddb029da6c1))

## [1.8.4](https://github.com/payloadcms/payload/compare/v1.8.3...v1.8.4) (2023-06-02)


### Features

* Add Bulgarian translation ([#2753](https://github.com/payloadcms/payload/issues/2753)) ([51108c0](https://github.com/payloadcms/payload/commit/51108c02ea346fd41c1b94ef7c339feec8383dd1))


### Bug Fixes

* group row hoisting ([#2683](https://github.com/payloadcms/payload/issues/2683)) ([1626e17](https://github.com/payloadcms/payload/commit/1626e173b7eced83c59e8eb4f70b0bb68fdb0e7a))
* graphql where types on rows and collapsible's ([#2758](https://github.com/payloadcms/payload/issues/2758)) ([f978299](https://github.com/payloadcms/payload/commit/f978299868bf352e147070afdf556bf1153bac56))
* RichText link custom fields ([#2756](https://github.com/payloadcms/payload/issues/2756)) ([23be263](https://github.com/payloadcms/payload/commit/23be263dd2e75dca448019b1c66d7f6dd3558b37))
* adds timestamps to global schemas ([#2738](https://github.com/payloadcms/payload/issues/2738)) ([0986282](https://github.com/payloadcms/payload/commit/0986282f13d8a3b5596c4a241b4da35e6fac6aa1))
* adjusts code field joi schema to allow editorOptions ([ed136fb](https://github.com/payloadcms/payload/commit/ed136fbc5146889cd30c641d4947da58b66dfb2f))
* fix locale popup overflow ([#2737](https://github.com/payloadcms/payload/issues/2737)) ([8ee9724](https://github.com/payloadcms/payload/commit/8ee9724277d419de78b27a8ffa22f3a599361251))
* fix tests by hard-coding the URL in the logger ([2697974](https://github.com/payloadcms/payload/commit/2697974694112440bf1737c4ce535ba77bf4b194))
* mongoose connection ([#2754](https://github.com/payloadcms/payload/issues/2754)) ([69b97bb](https://github.com/payloadcms/payload/commit/69b97bbc590c62fffbcd03a42f0e9737e3f7ca01))
* removes payload dependency inception ([#2717](https://github.com/payloadcms/payload/issues/2717)) ([6125b66](https://github.com/payloadcms/payload/commit/6125b66286e5315725ca0ae365c81a04c1c1a54c))
* searches on correct useAsTitle field in polymorphic list drawers [#2710](https://github.com/payloadcms/payload/issues/2710) ([9ec2a40](https://github.com/payloadcms/payload/commit/9ec2a40274ea9b3a32e43cb992df3897baf62e63))
* typing of sendMail function ([e3ff4c4](https://github.com/payloadcms/payload/commit/e3ff4c46cbecf731c9a3c688682bcb33012cb234))
* corrects relationship field schema from pr [#2696](https://github.com/payloadcms/payload/issues/2696) ([#2714](https://github.com/payloadcms/payload/issues/2714)) ([8285bac](https://github.com/payloadcms/payload/commit/8285bac2f5eb443b6af160b21726edf3f828a52f))


## [1.8.3](https://github.com/payloadcms/payload/compare/v1.8.3...v1.8.3) (2023-05-24)


### Bug Fixes

* [#2662](https://github.com/payloadcms/payload/issues/2662), draft=true querying by id ([3b78ab0](https://github.com/payloadcms/payload/commit/3b78ab04c7a68e39afa9936ac692169ed2c8fb74))
* [#2685](https://github.com/payloadcms/payload/issues/2685), graphql querying relationships with custom id ([9bb5470](https://github.com/payloadcms/payload/commit/9bb54703423b3f0fdb242a5e63f322d346323b06))
* adds credentials to doc access request ([#2705](https://github.com/payloadcms/payload/issues/2705)) ([c716954](https://github.com/payloadcms/payload/commit/c716954e89b0aef976cbcbef9ece981ec9bab233))
* prevents add new relationship modal from adding duplicative values to the parent doc [#2688](https://github.com/payloadcms/payload/issues/2688) ([a2a8ac9](https://github.com/payloadcms/payload/commit/a2a8ac9549bd67e6ab578772689684fd2bc64872))
* unable to clear relationships or open relationship drawer on mobile [#2691](https://github.com/payloadcms/payload/issues/2691) [#2692](https://github.com/payloadcms/payload/issues/2692) ([782f8ca](https://github.com/payloadcms/payload/commit/782f8ca047178cadb4214702854a0e0cb2d9eaab))

## [1.8.2](https://github.com/payloadcms/payload/compare/v1.8.1...v1.8.2) (2023-05-10)


### Bug Fixes

* react webpack alias ([1732bb8](https://github.com/payloadcms/payload/commit/1732bb877ca9688fc87cf44fbf63d05b6be23de2))

## [1.8.1](https://github.com/payloadcms/payload/compare/v1.8.0...v1.8.1) (2023-05-10)


### Bug Fixes

* add dotenv.config() to test/dev.ts ([#2646](https://github.com/payloadcms/payload/issues/2646)) ([7963e75](https://github.com/payloadcms/payload/commit/7963e7540f4899c16a49b47cf5145f46ea0c71cf))


### Features

* allow users to manipulate images without needing to resize them ([#2574](https://github.com/payloadcms/payload/issues/2574)) ([8531687](https://github.com/payloadcms/payload/commit/85316879cd97933ed34588b0cee72798964de281))
* export additional graphql types ([#2610](https://github.com/payloadcms/payload/issues/2610)) ([3f185cb](https://github.com/payloadcms/payload/commit/3f185cb18b9677654b92921267ffef408388d0d1))

# [1.8.0](https://github.com/payloadcms/payload/compare/v1.7.5...v1.8.0) (2023-05-09)


### Bug Fixes

* correct casing on graphql type ([219f50b](https://github.com/payloadcms/payload/commit/219f50b0bc7a520655a5ae4f1d8b08fd04c8a3dd))
* defaultValue missing from Upload field schema ([7b21eaf](https://github.com/payloadcms/payload/commit/7b21eaf12da64778568b45e56fa8d39e81f11c29))
* ensures nested querying works when querying across collections ([09974fa](https://github.com/payloadcms/payload/commit/09974fa68677586c727943cc234311f87bf6da75))
* query custom text id fields ([967f2ac](https://github.com/payloadcms/payload/commit/967f2ace0ea1a65570f69e85920f2f55626efde0))
* removes deprecated queryHiddenFIelds from local API docs ([5f30dbb](https://github.com/payloadcms/payload/commit/5f30dbb1a5b7c7ab6752c114710f92c159319d3d))
* removes queryHiddenFields from example Find operation ([fb4f822](https://github.com/payloadcms/payload/commit/fb4f822d34d0235a537f96515073e2662680412f))
* resolve process/browser package in webpack config ([02f27f3](https://github.com/payloadcms/payload/commit/02f27f3de6fdaf5dd0023298fc671a8ae9a1b758))
* Row groups in tabs vertical alignment ([#2593](https://github.com/payloadcms/payload/issues/2593)) ([54fac4a](https://github.com/payloadcms/payload/commit/54fac4a5d793b534e25600d2f9470c449f40df1d))
* softens columns and filters pill colors ([#2642](https://github.com/payloadcms/payload/issues/2642)) ([9072096](https://github.com/payloadcms/payload/commit/90720964953d392d85982052b3a4843a5450681e))
* webp upload formatting ([ccd6ca2](https://github.com/payloadcms/payload/commit/ccd6ca298e69faf04709535df3fcb18eb3d40f1b))


### Features

* add Arabic translations ([#2641](https://github.com/payloadcms/payload/issues/2641)) ([7d04cf1](https://github.com/payloadcms/payload/commit/7d04cf14fb0587f2208745bb77ed4fd17e99c8d5))
* allow full URL in staticURL ([#2562](https://github.com/payloadcms/payload/issues/2562)) ([a9b5dff](https://github.com/payloadcms/payload/commit/a9b5dffa00623eb48302d51b88c3449920c10f46))

## [1.7.5](https://github.com/payloadcms/payload/compare/v1.7.4...v1.7.5) (2023-05-04)


### Bug Fixes

* make incrementName match multiple digits ([#2609](https://github.com/payloadcms/payload/issues/2609)) ([8dbf0a2](https://github.com/payloadcms/payload/commit/8dbf0a2bd88db1b361ce16bb730613de489f2ed2))


### Features

* collection admin.enableRichTextLink property ([#2560](https://github.com/payloadcms/payload/issues/2560)) ([9678992](https://github.com/payloadcms/payload/commit/967899229f458d06a3931d086bcc49299dc310b7))
* custom admin buttons ([#2618](https://github.com/payloadcms/payload/issues/2618)) ([1d58007](https://github.com/payloadcms/payload/commit/1d58007606fa7e34007f2a56a3ca653d2cd3404d))

## [1.7.4](https://github.com/payloadcms/payload/compare/v1.7.3...v1.7.4) (2023-05-02)


### Bug Fixes

* properly import SwcMinifyWebpackPlugin ([#2600](https://github.com/payloadcms/payload/issues/2600)) ([802deac](https://github.com/payloadcms/payload/commit/802deaca03f8506fa4a7adb8fc008205c2c4f013))

## [1.7.3](https://github.com/payloadcms/payload/compare/v1.7.2...v1.7.3) (2023-05-01)


### Bug Fixes

* [#2592](https://github.com/payloadcms/payload/issues/2592), allows usage of hidden fields within access query constraints ([#2599](https://github.com/payloadcms/payload/issues/2599)) ([a0bb13a](https://github.com/payloadcms/payload/commit/a0bb13a4123b51d770b364ddaee3dde1c5a3da53))
* addds workaround for slate isBlock function issue ([#2596](https://github.com/payloadcms/payload/issues/2596)) ([8f6f13d](https://github.com/payloadcms/payload/commit/8f6f13dc93f49f5ba5384a9168ced5baec85e1fb))
* bulk operations result type ([#2588](https://github.com/payloadcms/payload/issues/2588)) ([8382faa](https://github.com/payloadcms/payload/commit/8382faa0afc8118f4fb873c657a52c48abb2a6ad))
* query on id throws 500 ([#2587](https://github.com/payloadcms/payload/issues/2587)) ([0ba22c3](https://github.com/payloadcms/payload/commit/0ba22c3aafca67be78814357edc668ed11ec4a97))
* timestamp queries ([#2583](https://github.com/payloadcms/payload/issues/2583)) ([9c5107e](https://github.com/payloadcms/payload/commit/9c5107e86d70e36ac181c9d3ad51edacf9fc529a))


### Features

* Add new translation for romanian language ([#2556](https://github.com/payloadcms/payload/issues/2556)) ([fbf3a2a](https://github.com/payloadcms/payload/commit/fbf3a2a1b4633e704e467d9aec05f3ae0b900bae))
* add persian translations ([#2553](https://github.com/payloadcms/payload/issues/2553)) ([c80f68a](https://github.com/payloadcms/payload/commit/c80f68af943c730996c9cdad87cf84d4d06a5777))
* adjust stack trace for api error ([#2598](https://github.com/payloadcms/payload/issues/2598)) ([870838e](https://github.com/payloadcms/payload/commit/870838e7563b6767c53f4dc0288119087e3f9486))
* allow customizing the link fields ([#2559](https://github.com/payloadcms/payload/issues/2559)) ([bf65228](https://github.com/payloadcms/payload/commit/bf6522898db353e75db11525ea5a1b58243333d8))
* supports collection compound indexes ([#2529](https://github.com/payloadcms/payload/issues/2529)) ([85b3d57](https://github.com/payloadcms/payload/commit/85b3d579d3054aad2de793957cf6454332361327))

## [1.7.2](https://github.com/payloadcms/payload/compare/v1.7.1...v1.7.2) (2023-04-25)


### Bug Fixes

* [#2521](https://github.com/payloadcms/payload/issues/2521), graphql AND not working with drafts ([e67ca20](https://github.com/payloadcms/payload/commit/e67ca2010831c14938d3f639fcb5374ca62747ba))
* document drawer access control [#2545](https://github.com/payloadcms/payload/issues/2545) ([439caf8](https://github.com/payloadcms/payload/commit/439caf815fc99538f14b3a59835dcf49185759dc))
* prevent floating point number in image sizes ([#1935](https://github.com/payloadcms/payload/issues/1935)) ([7fcde11](https://github.com/payloadcms/payload/commit/7fcde11fa0b232537de606e44c0af68b122daed2))
* prevent sharp toFormat settings fallthrough by using clone ([#2547](https://github.com/payloadcms/payload/issues/2547)) ([90dab3c](https://github.com/payloadcms/payload/commit/90dab3c445d4bdbab0eff286a2b66861d04f2a93))
* query localized fields without localization configured ([12edb1c](https://github.com/payloadcms/payload/commit/12edb1cc4b2675d9b0948fb7f3439f61c6e2015d))
* read-only styles ([823d022](https://github.com/payloadcms/payload/commit/823d0228c949fe58a7e0f11f95354b240c3ea876))


### Features

* add rich-text blockquote element, change quote node type to blockquote ([ed230a4](https://github.com/payloadcms/payload/commit/ed230a42e0315dc2492b4a26e3bf8b5334e89380))
* add user to field conditional logic ([274edc7](https://github.com/payloadcms/payload/commit/274edc74a70202e8c771c5111507b585c3f69377))
* exposes id in conditional logic ([c117b32](https://github.com/payloadcms/payload/commit/c117b321474b8318c3a0ddf544e49568e461f0d8))
* **imageresizer:** add trim options ([#2073](https://github.com/payloadcms/payload/issues/2073)) ([0406548](https://github.com/payloadcms/payload/commit/0406548fe6127e091db9926ee42e59f9158eff5a))

## [1.7.1](https://github.com/payloadcms/payload/compare/v1.7.0...v1.7.1) (2023-04-18)


### Bug Fixes

* adds 'use client' for next 13 compatibility ([5e02985](https://github.com/payloadcms/payload/commit/5e029852060d6475eccada35ffbcdd0178d5e690))
* graphql variables not being passed properly ([72be80a](https://github.com/payloadcms/payload/commit/72be80abc4082013e052aef1152a5de749a6f3c4))


### Features

* configuration extension points ([023719d](https://github.com/payloadcms/payload/commit/023719d77554a70493d779ba94bf55058d4caf98))

## [1.7.0](https://github.com/payloadcms/payload/compare/v1.6.32...v1.7.0) (2023-04-17)

### Features

- feat: exposes new replaceState form api (52ae6f06a)
- feat: support email configuration in payload config (#2485) (042e58ea2)
- feat: refactors buildQuery to rely on fields instead of mongoose (d187b809d)
- feat: add admin.hidden to collections and globals (#2487) (81d69d1b6)
- feat: replace deprecated express-graphql dependency (#2484) (cd548a6e2)
- feat: supports null preview url #2472 (e8a24fd2e)
- feat: migrates form builder example nextjs to examples (28ecb0c5e)

### Bug Fixes

- fix: #2494, reduces versions caused by reverting to published with autosave: true (e0c0b2fdf)
- fix: incorrect version defaults (3f9bbe90b)
- fix: hides preview button until document is saved #2476 (#2477) (f9b8e2dbc)
- fix: corrects sidebar spacing in collection and global edit views #2478 (a45ab8bd7)
- fix: use correct locale when querying relationships for list view (#2438) (15442a9cc)
- fix: proper height data for animated gifs (#2506) (aee6ca05c)
- fix: Clear blocks modal search input when closing the modal (#2501) (0f8051b57)
- fix: excess padding on textarea (#2488) (6ceb79189)
- fix: increase line height for global title (#2465) (19ce0d79e)
- fix: uses docPermissions to show/hide x button on media collection doc fileDetails - #2428 (7f2c3d1d0)
- fix: prevents rendering of version actions when a user does not have permission (13cc669e2)
- fix: properly awaits email send to catch potential errors #2444 (#2470) (11a6ce6d3)

## [1.6.32](https://github.com/payloadcms/payload/compare/v1.6.31...v1.6.32) (2023-04-05)

### Features

- only uses sharp if required ([f9f6ec4](https://github.com/payloadcms/payload/commit/f9f6ec47d9a4f9ed94b7f7a4d50f13a8ee881ad0))

## [1.6.31](https://github.com/payloadcms/payload/compare/v1.6.30...v1.6.31) (2023-04-04)

### Bug Fixes

- ensures select hasMany does not get mutated on patch operations ([3a6acf3](https://github.com/payloadcms/payload/commit/3a6acf322b5546ca3cd1d4dcb093af6e3b6ed086))

### Features

- improves required type accuracy ([a9cd23a](https://github.com/payloadcms/payload/commit/a9cd23a883d89c8deb3c1b5386decd50516d69fd))

## [1.6.30](https://github.com/payloadcms/payload/compare/v1.6.29...v1.6.30) (2023-04-03)

### Bug Fixes

- incorrect type local api using delete with where ([de5ceb2](https://github.com/payloadcms/payload/commit/de5ceb2aca624f702ea39556ffe2f689701615c1))
- originalDoc being mutated in beforeChange field hooks ([888bbf2](https://github.com/payloadcms/payload/commit/888bbf28e0b793a2298e27a7e1df235d78b0a718))

## [1.6.29](https://github.com/payloadcms/payload/compare/v1.6.28...v1.6.29) (2023-03-31)

### Bug Fixes

- update and delete local API return types ([#2434](https://github.com/payloadcms/payload/issues/2434)) ([02410a0](https://github.com/payloadcms/payload/commit/02410a0be38004b90d19207071569294fd104a66))

## [1.6.28](https://github.com/payloadcms/payload/compare/v1.6.27...v1.6.28) (2023-03-28)

### Bug Fixes

- potential memory leak with `probe-image-size` ([8eea0d6](https://github.com/payloadcms/payload/commit/8eea0d6cf41dd6360d713f463ad1b48ba253a9e7))

## [1.6.27](https://github.com/payloadcms/payload/compare/v1.6.26...v1.6.27) (2023-03-27)

### Bug Fixes

- [#2355](https://github.com/payloadcms/payload/issues/2355), select field not fully visible on small screens in certain scenarios ([07eb8dd](https://github.com/payloadcms/payload/commit/07eb8dd7d252043c00b79d532736896134204c4c))
- [#2384](https://github.com/payloadcms/payload/issues/2384), preserves manually set verified from admin UI ([72a8b1e](https://github.com/payloadcms/payload/commit/72a8b1eebe6c3b45663a14fa7488772ad13f975d))
- hide fields with admin.hidden attribute ([ad25b09](https://github.com/payloadcms/payload/commit/ad25b096b6efa7e0cba647e82e29e36f7a95934a))
- make update typing a deep partial ([#2407](https://github.com/payloadcms/payload/issues/2407)) ([e8dc7d4](https://github.com/payloadcms/payload/commit/e8dc7d462e21d1021275a95fbf62094f290e37ce))
- restoring version did not correctly create new version from result ([6ca12b1](https://github.com/payloadcms/payload/commit/6ca12b1cc06554b04f3055df8f01d7eee1c09169))
- textarea field overlap in UI ([1c8cf24](https://github.com/payloadcms/payload/commit/1c8cf24ba623746c160007d7c09b3160f2aae8d3))

## [1.6.25](https://github.com/payloadcms/payload/compare/v1.6.24...v1.6.25) (2023-03-24)

### Bug Fixes

- upload field select existing file ([#2392](https://github.com/payloadcms/payload/issues/2392)) ([38e917a](https://github.com/payloadcms/payload/commit/38e917a3dfa70ac3234915a6c8f7424eb22cb000))

## [1.6.24](https://github.com/payloadcms/payload/compare/v1.6.23...v1.6.24) (2023-03-23)

### Features

- bulk-operations ([#2346](https://github.com/payloadcms/payload/issues/2346)) ([0fedbab](https://github.com/payloadcms/payload/commit/0fedbabe9e975f375dc12447fcdab4119bc6a4c4))

## [1.6.23](https://github.com/payloadcms/payload/compare/v1.6.22...v1.6.23) (2023-03-22)

### Bug Fixes

- [#2315](https://github.com/payloadcms/payload/issues/2315) - deleting files if overwriteExistingFiles is true ([4d578f1](https://github.com/payloadcms/payload/commit/4d578f1bfd05efab5cc8db95895eabb776b2d9d1))
- [#2363](https://github.com/payloadcms/payload/issues/2363) version tabs and select field comparisons ([#2364](https://github.com/payloadcms/payload/issues/2364)) ([21b8da7](https://github.com/payloadcms/payload/commit/21b8da7f415cdace9f7d5898c98f9c7a6bb39107))
- allows base64 thumbnails ([#2361](https://github.com/payloadcms/payload/issues/2361)) ([e09ebff](https://github.com/payloadcms/payload/commit/e09ebfffa0a7a7fdb3469f272de0e6930d97a336))
- DateField admin type ([#2256](https://github.com/payloadcms/payload/issues/2256)) ([fb2fd3e](https://github.com/payloadcms/payload/commit/fb2fd3e9b7e302d8069bfcb6f3cb698ac7abf0ca))
- fallback to default locale showing on non-localized fields ([#2316](https://github.com/payloadcms/payload/issues/2316)) ([e1a6e08](https://github.com/payloadcms/payload/commit/e1a6e08aa140cf21597d6009b811f7fdd2106f4f))
- Fix missing Spanish translations ([#2372](https://github.com/payloadcms/payload/issues/2372)) ([c0ff75c](https://github.com/payloadcms/payload/commit/c0ff75c1647a36219549e20fc081883f8cf1d7e4))
- relationship field useAsTitle [#2333](https://github.com/payloadcms/payload/issues/2333) ([#2350](https://github.com/payloadcms/payload/issues/2350)) ([10dd819](https://github.com/payloadcms/payload/commit/10dd819863ecac4a5cea2e13f820df2224ac57f4))

### Features

- adds title attribute to ThumbnailCard ([#2368](https://github.com/payloadcms/payload/issues/2368)) ([a8766d0](https://github.com/payloadcms/payload/commit/a8766d00a8365c8e6ffe507944fbe49aaa39d4bd))
- exposes defaultSort property for collection list view ([#2382](https://github.com/payloadcms/payload/issues/2382)) ([1f480c4](https://github.com/payloadcms/payload/commit/1f480c4cd5673a6fe08360183fe1c7c1d4e05de0))

## [1.6.22](https://github.com/payloadcms/payload/compare/v1.6.21...v1.6.22) (2023-03-15)

## [1.6.21](https://github.com/payloadcms/payload/compare/v1.6.20...v1.6.21) (2023-03-15)

### Bug Fixes

- hidden fields being mutated on patch ([#2317](https://github.com/payloadcms/payload/issues/2317)) ([8d65ba1](https://github.com/payloadcms/payload/commit/8d65ba1efd8744042bbaf669c10b6837a6b972f8))

## [1.6.20](https://github.com/payloadcms/payload/compare/v1.6.19...v1.6.20) (2023-03-13)

### Bug Fixes

- allow thumbnails in upload gallery to show useAsTitle value ([aae6d71](https://github.com/payloadcms/payload/commit/aae6d716e5608270ca142f2f4df214f9e271deb4))
- allows useListDrawer to work without collectionSlugs defined ([e1553c2](https://github.com/payloadcms/payload/commit/e1553c2fc88ac582744cd72d15c9e9ef3b8ec549))
- cancels existing fetches if new fetches are started ([ccc92fd](https://github.com/payloadcms/payload/commit/ccc92fdb7519e14ff1092f19ae4e7060fa413aab))
- check relationships indexed access for undefined ([959f017](https://github.com/payloadcms/payload/commit/959f01739c30450f3a6d052dd6083fdacf1527a4))
- ensures documentID exists in doc documentDrawers ([#2304](https://github.com/payloadcms/payload/issues/2304)) ([566c45b](https://github.com/payloadcms/payload/commit/566c45b0b436a9a3ea8eff27de2ea829dd6a2f0c))
- flattens title fields to allow seaching by title if title inside Row field ([75e776d](https://github.com/payloadcms/payload/commit/75e776ddb43b292eae6c1204589d9dc22deab50c))
- keep drop zone active when hovering inner elements ([#2295](https://github.com/payloadcms/payload/issues/2295)) ([39e303a](https://github.com/payloadcms/payload/commit/39e303add62d2dbd3e72d17e64e1ea5d940b0298))
- Prevent browser initial favicon request ([fd8ea88](https://github.com/payloadcms/payload/commit/fd8ea88488c80627346733e0595a2ef34c964a87))
- removes forced require on array, block, group ts ([657aa65](https://github.com/payloadcms/payload/commit/657aa65e993d13e9a294456b73adcd57f20d7c87))
- removes pagination type from top level admin config types ([bf9929e](https://github.com/payloadcms/payload/commit/bf9929e9a9919488f6de0e172909fa27719ecb04))
- renders presentational table columns ([4e1748f](https://github.com/payloadcms/payload/commit/4e1748fb8a3554586b377e60738130d03ec12f38))
- undefined point fields saving as empty object ([#2313](https://github.com/payloadcms/payload/issues/2313)) ([af16415](https://github.com/payloadcms/payload/commit/af164159fb52f4b0ef97e2fa34b881f97bc07310))

### Features

- [#2280](https://github.com/payloadcms/payload/issues/2280) Improve UX of paginator ([#2293](https://github.com/payloadcms/payload/issues/2293)) ([1df3d14](https://github.com/payloadcms/payload/commit/1df3d149e06cc955a61c4371371b601c0d9aad2b))
- exposes useTheme hook ([abebde6](https://github.com/payloadcms/payload/commit/abebde6b120a9dddc9971325b616b9cb31bcba90))
- provide refresh permissions for auth context ([e9c796e](https://github.com/payloadcms/payload/commit/e9c796e42c1bb1e0ce72d057ee88dee624b94c24))

## [1.6.19](https://github.com/payloadcms/payload/compare/v1.6.18...v1.6.19) (2023-03-09)

### Bug Fixes

- ensures nested fields save properly within link, upload rte ([057522c](https://github.com/payloadcms/payload/commit/057522c5bdade430c6e60f589a32f174739d400c))

## [1.6.18](https://github.com/payloadcms/payload/compare/v1.6.17...v1.6.18) (2023-03-09)

### Bug Fixes

- [#2272](https://github.com/payloadcms/payload/issues/2272), rich text within blocks causing crash on reorder ([7daddf8](https://github.com/payloadcms/payload/commit/7daddf864d71e83fa74bc76768d85d4c7fa93d9a))
- allows swc/register to transpile files above current workspace ([ef826c8](https://github.com/payloadcms/payload/commit/ef826c88ec40878bb36e960c2df2c68ec3c54ef6))
- renders row fields as table columns [#2257](https://github.com/payloadcms/payload/issues/2257) ([b10e842](https://github.com/payloadcms/payload/commit/b10e842e89a4e0839d0f391cfbafa916134c47c8))
- table column preferences sync ([a1ddd2e](https://github.com/payloadcms/payload/commit/a1ddd2e2e37a76471631a90938a9ceaba8f9a394))

## [1.6.17](https://github.com/payloadcms/payload/compare/v1.6.15...v1.6.17) (2023-03-06)

### Bug Fixes

- [#2150](https://github.com/payloadcms/payload/issues/2150), can now query on N number of levels deep ([ac54b11](https://github.com/payloadcms/payload/commit/ac54b11f9d2f9cfde15a4421d13ce26ffd6cdc63))
- [#2179](https://github.com/payloadcms/payload/issues/2179), async default values resetting form state ([a4de51a](https://github.com/payloadcms/payload/commit/a4de51adaaa9399fa9036e485eb2e7f350719638))
- allows empty objects to be retained in db ([0247e2d](https://github.com/payloadcms/payload/commit/0247e2d1068527213f007c71f6efa1aff4c21af6))
- clear relationship value ([#2188](https://github.com/payloadcms/payload/issues/2188)) ([387cec9](https://github.com/payloadcms/payload/commit/387cec983868d6c10c043248b45fc8c1657e4981))
- conditionally renders draggable pill ([#2224](https://github.com/payloadcms/payload/issues/2224)) ([812ab9f](https://github.com/payloadcms/payload/commit/812ab9f86824aca3689ddef8af759a84f59f2148))
- ensures sorting on drafts works in all cases ([c87fd2b](https://github.com/payloadcms/payload/commit/c87fd2b649e59afb6fe7998d04142f3ba246dcef))
- globals publish after draft ([44651e6](https://github.com/payloadcms/payload/commit/44651e6ecc354dbe17a08fccfafd686420d07158))
- minimize not set to false on all field type schemas ([ace032e](https://github.com/payloadcms/payload/commit/ace032ef897dc55131c6cf7cb80dc1a652940748))
- pass result of previous hook into next hook ([c661ac2](https://github.com/payloadcms/payload/commit/c661ac2e8a26251e77c558e00ed3c32741d2d385))
- properly resizes animated images ([#2181](https://github.com/payloadcms/payload/issues/2181)) ([8c4f890](https://github.com/payloadcms/payload/commit/8c4f890af0cbd1f2b3a2dd1980d26ba3e721f154))
- properly set req.payload on forgotPassword in local API ([#2194](https://github.com/payloadcms/payload/issues/2194)) ([5ac436e](https://github.com/payloadcms/payload/commit/5ac436e1843aacc81072992805bdbd1aed41d243))
- redirects example ([#2209](https://github.com/payloadcms/payload/issues/2209)) ([5aa203d](https://github.com/payloadcms/payload/commit/5aa203d020177eb25b7675d6ab30fc8721b9fe0c))
- removes duplicative fields from table columns [#2221](https://github.com/payloadcms/payload/issues/2221) ([#2226](https://github.com/payloadcms/payload/issues/2226)) ([474a3cb](https://github.com/payloadcms/payload/commit/474a3cbf7a90ab02d9e6c86ee018895576cbcab9))
- renders rte upload drawer [#2178](https://github.com/payloadcms/payload/issues/2178) ([523d9d4](https://github.com/payloadcms/payload/commit/523d9d495261b44fdb9c7922bfa9cdd8aaba85fb))
- skips field validation on submit if skipValidation is set to true ([cf17760](https://github.com/payloadcms/payload/commit/cf17760735d466a5817fc37bc3dc6f3ad8c52f7a))
- Validate typescript signature ([8d31ed6](https://github.com/payloadcms/payload/commit/8d31ed6d39d1a4d147e13de5b96073fab5563173))
- version comparison view errors on old select value ([#2163](https://github.com/payloadcms/payload/issues/2163)) ([a3cc3c3](https://github.com/payloadcms/payload/commit/a3cc3c342928e00564a662ba210635d78238fed8))
- versions table ([#2235](https://github.com/payloadcms/payload/issues/2235)) ([066f5f6](https://github.com/payloadcms/payload/commit/066f5f6d2cb48525896366166693af6c92d1814d))
- virtual fields example ([#2214](https://github.com/payloadcms/payload/issues/2214)) ([f6eb020](https://github.com/payloadcms/payload/commit/f6eb0202fec15a0ba0e6c357ecdb9ace62bd2ea9))

### Features

- Add Hungarian Translations ([#2169](https://github.com/payloadcms/payload/issues/2169)) ([ebd16e8](https://github.com/payloadcms/payload/commit/ebd16e8fdf811ec19dd5231b01c91f201d00d3a3))
- adds min and max options to relationship with hasMany ([0f38a0d](https://github.com/payloadcms/payload/commit/0f38a0dcf6a4d993579ed3af55940f28b13f5d3d))
- drag-and-drop columns ([#2142](https://github.com/payloadcms/payload/issues/2142)) ([e2c65e3](https://github.com/payloadcms/payload/commit/e2c65e3fa519fc04c7d1552064980ffee145a3bc))
- improves ui performance with thousands of fields ([0779f8d](https://github.com/payloadcms/payload/commit/0779f8d73da4767e9918b04cc8795e52b2198f4c))

## [1.6.16](https://github.com/payloadcms/payload/compare/v1.6.15...v1.6.16) (2023-02-28)

### Bug Fixes

- [#2150](https://github.com/payloadcms/payload/issues/2150), can now query on N number of levels deep ([ac54b11](https://github.com/payloadcms/payload/commit/ac54b11f9d2f9cfde15a4421d13ce26ffd6cdc63))
- [#2179](https://github.com/payloadcms/payload/issues/2179), async default values resetting form state ([a4de51a](https://github.com/payloadcms/payload/commit/a4de51adaaa9399fa9036e485eb2e7f350719638))
- allows empty objects to be retained in db ([0247e2d](https://github.com/payloadcms/payload/commit/0247e2d1068527213f007c71f6efa1aff4c21af6))
- clear relationship value ([#2188](https://github.com/payloadcms/payload/issues/2188)) ([387cec9](https://github.com/payloadcms/payload/commit/387cec983868d6c10c043248b45fc8c1657e4981))
- ensures sorting on drafts works in all cases ([c87fd2b](https://github.com/payloadcms/payload/commit/c87fd2b649e59afb6fe7998d04142f3ba246dcef))
- globals publish after draft ([44651e6](https://github.com/payloadcms/payload/commit/44651e6ecc354dbe17a08fccfafd686420d07158))
- properly resizes animated images ([#2181](https://github.com/payloadcms/payload/issues/2181)) ([8c4f890](https://github.com/payloadcms/payload/commit/8c4f890af0cbd1f2b3a2dd1980d26ba3e721f154))
- properly set req.payload on forgotPassword in local API ([#2194](https://github.com/payloadcms/payload/issues/2194)) ([5ac436e](https://github.com/payloadcms/payload/commit/5ac436e1843aacc81072992805bdbd1aed41d243))
- redirects example ([#2209](https://github.com/payloadcms/payload/issues/2209)) ([5aa203d](https://github.com/payloadcms/payload/commit/5aa203d020177eb25b7675d6ab30fc8721b9fe0c))
- renders rte upload drawer [#2178](https://github.com/payloadcms/payload/issues/2178) ([523d9d4](https://github.com/payloadcms/payload/commit/523d9d495261b44fdb9c7922bfa9cdd8aaba85fb))
- skips field validation on submit if skipValidation is set to true ([cf17760](https://github.com/payloadcms/payload/commit/cf17760735d466a5817fc37bc3dc6f3ad8c52f7a))
- version comparison view errors on old select value ([#2163](https://github.com/payloadcms/payload/issues/2163)) ([a3cc3c3](https://github.com/payloadcms/payload/commit/a3cc3c342928e00564a662ba210635d78238fed8))

### Features

- Add Hungarian Translations ([#2169](https://github.com/payloadcms/payload/issues/2169)) ([ebd16e8](https://github.com/payloadcms/payload/commit/ebd16e8fdf811ec19dd5231b01c91f201d00d3a3))
- drag-and-drop columns ([#2142](https://github.com/payloadcms/payload/issues/2142)) ([e2c65e3](https://github.com/payloadcms/payload/commit/e2c65e3fa519fc04c7d1552064980ffee145a3bc))

## [1.6.15](https://github.com/payloadcms/payload/compare/v1.6.14...v1.6.15) (2023-02-21)

### Bug Fixes

- mongoose connection error with useFacet ([5888fb9](https://github.com/payloadcms/payload/commit/5888fb9b3f82f49686da27c216b40c38b5a5d6c2))

## [1.6.14](https://github.com/payloadcms/payload/compare/v1.6.13...v1.6.14) (2023-02-21)

### Bug Fixes

- [#2091](https://github.com/payloadcms/payload/issues/2091) admin translations for filter operators ([#2143](https://github.com/payloadcms/payload/issues/2143)) ([8a8c392](https://github.com/payloadcms/payload/commit/8a8c3920950ece5995f81bff717b30a2baf8f219))
- [#2096](https://github.com/payloadcms/payload/issues/2096), allows custom ts paths with payload generate:types ([686a616](https://github.com/payloadcms/payload/commit/686a616b4cf06685fd22b075cf87ceafec455e40))
- [#2117](https://github.com/payloadcms/payload/issues/2117) collection pagination defaultLimit ([#2147](https://github.com/payloadcms/payload/issues/2147)) ([2a4db38](https://github.com/payloadcms/payload/commit/2a4db3896ead2b49c0a7ebc5da6b9825b223ca19))
- [#2131](https://github.com/payloadcms/payload/issues/2131), doesn't log in unverified user after resetting password ([3eb85b1](https://github.com/payloadcms/payload/commit/3eb85b1554ceb705c4a1436af4d9ba982e4cdbdf))
- [#2134](https://github.com/payloadcms/payload/issues/2134), allows links to be populated without having relationship or upload enabled ([32a0778](https://github.com/payloadcms/payload/commit/32a0778fc4311509699b14f9a3f145380ec56e25))
- [#2148](https://github.com/payloadcms/payload/issues/2148), adds queryHiddenFields property to find operation ([15b6bb3](https://github.com/payloadcms/payload/commit/15b6bb3d756697428775df5ece3c6092d0537d82))
- checks locale is valid for monaco code editor ([#2144](https://github.com/payloadcms/payload/issues/2144)) ([40224ed](https://github.com/payloadcms/payload/commit/40224ed1bcd886be8bf2f5b42a272db7615495c1))
- generate proper json field type according to rfc ([#2137](https://github.com/payloadcms/payload/issues/2137)) ([7e88698](https://github.com/payloadcms/payload/commit/7e8869858cfca70b2e996d984e065da75398076b))
- removes custom header and gutter from rte link drawer [#2120](https://github.com/payloadcms/payload/issues/2120) ([#2135](https://github.com/payloadcms/payload/issues/2135)) ([6a7663b](https://github.com/payloadcms/payload/commit/6a7663beb57f624ea52d95a8f26345dcd32d65bc))
- sizes property optional on upload ([#2066](https://github.com/payloadcms/payload/issues/2066)) ([79d047e](https://github.com/payloadcms/payload/commit/79d047e64fd40507abf9de2ced5dab7aeb2bb6fa))
- useFacet config option to disable $facet aggregation ([#2141](https://github.com/payloadcms/payload/issues/2141)) ([b4a2074](https://github.com/payloadcms/payload/commit/b4a20741b2d995e5e46875c2ae1f11ff5b319e6b))

## [1.6.13](https://github.com/payloadcms/payload/compare/v1.6.12...v1.6.13) (2023-02-18)

### Bug Fixes

- [#2125](https://github.com/payloadcms/payload/issues/2125), ensures createdAt and updatedAt are returned in update operations ([42ebf68](https://github.com/payloadcms/payload/commit/42ebf6893257256554a57e6b6684a726d11800b8))

## [1.6.12](https://github.com/payloadcms/payload/compare/v1.6.11...v1.6.12) (2023-02-17)

### Bug Fixes

- ensures only valid fields can be queried on ([1930bc2](https://github.com/payloadcms/payload/commit/1930bc260e721c5c7a10793b5d2a7809694089f3))

### Features

- adds gql auth example ([#2115](https://github.com/payloadcms/payload/issues/2115)) ([fa32c27](https://github.com/payloadcms/payload/commit/fa32c2771637af11d7ef0fb21b2f1f3cceae1ead))
- auth example ([c076c77](https://github.com/payloadcms/payload/commit/c076c77db4a26cf514a040b1048de25b1141f0cb))
- separates admin root component from DOM render logic ([ff4d1f6](https://github.com/payloadcms/payload/commit/ff4d1f6ac26f5cac56b6c5b7b67b99f50067cb8d))
- virtual fields example ([#1990](https://github.com/payloadcms/payload/issues/1990)) ([2af0c04](https://github.com/payloadcms/payload/commit/2af0c04c8ae5892b317af240c1502bc21bb65253))

## [1.6.11](https://github.com/payloadcms/payload/compare/v1.6.10...v1.6.11) (2023-02-15)

### Bug Fixes

- existing upload deletion [#2098](https://github.com/payloadcms/payload/issues/2098) ([#2101](https://github.com/payloadcms/payload/issues/2101)) ([060c380](https://github.com/payloadcms/payload/commit/060c3805e567fe450c4b9aa00fbdbb919427c625))

### Features

- preview example ([#1950](https://github.com/payloadcms/payload/issues/1950)) ([0a87f10](https://github.com/payloadcms/payload/commit/0a87f106ecb5c95738109db5231d72abd281e7e1))

## [1.6.10](https://github.com/payloadcms/payload/compare/v1.6.9...v1.6.10) (2023-02-14)

### Bug Fixes

- [#2077](https://github.com/payloadcms/payload/issues/2077) useAPIKey UI missing with disableLocalStrategy ([#2084](https://github.com/payloadcms/payload/issues/2084)) ([586b25a](https://github.com/payloadcms/payload/commit/586b25a54c6ec8bd134bce05c480cd429e47e252))
- Add missing Spanish translations and fix typos ([c4742e5](https://github.com/payloadcms/payload/commit/c4742e5c303ca4ba41c2fbb45a8e8474608418c1))
- document type in update request handler ([d5cd970](https://github.com/payloadcms/payload/commit/d5cd9709f717b08b930461079b147967d8d7a885))
- ensures versions createdAt matches the original doc ([8c7e37c](https://github.com/payloadcms/payload/commit/8c7e37c56aab2bb28de01cf7d4a91062cbde80de))
- globals not saving drafts unless published first ([#2082](https://github.com/payloadcms/payload/issues/2082)) ([4999fba](https://github.com/payloadcms/payload/commit/4999fbaee680e256ece7083fbe422f25e85de0d5))
- Use the user's AdminUI locale for the DatePicker ([#2046](https://github.com/payloadcms/payload/issues/2046)) ([#2057](https://github.com/payloadcms/payload/issues/2057)) ([b4a7e91](https://github.com/payloadcms/payload/commit/b4a7e912b2117cef3345adb8b514958345838030))
- validate type ([7bb0984](https://github.com/payloadcms/payload/commit/7bb0984a12a0d80d9ac2af82427ac7dbc985ffc5))

### Features

- allows control over relationship add new button ([6096044](https://github.com/payloadcms/payload/commit/6096044fe058113ca47c7f7d833cb788d97df9a2))
- async plugins ([#2030](https://github.com/payloadcms/payload/issues/2030)) ([9f30553](https://github.com/payloadcms/payload/commit/9f3055381337f80229f220c1e6114b4ea56be969))
- export more errors ([3a2a41d](https://github.com/payloadcms/payload/commit/3a2a41d2b6ead4188b432d9e6780764a7c08b2dd))

## [1.6.9](https://github.com/payloadcms/payload/compare/v1.6.7...v1.6.9) (2023-02-10)

### Bug Fixes

- adds query constraint to ensureMaxVersions query ([30688bb](https://github.com/payloadcms/payload/commit/30688bbe4136285af181a5deae5e949b98bea0be))
- translation of "or" -> "ou" in french ([#2047](https://github.com/payloadcms/payload/issues/2047)) ([dddbec2](https://github.com/payloadcms/payload/commit/dddbec268255c41b7ea786bdddc02dfeb7d66fbd))

### Features

- allows customization of the folder used to serve admin bundled files in production ([4d259a6](https://github.com/payloadcms/payload/commit/4d259a69f2c9beb1d84f703a08921469e6f1c34b))

## [1.6.7](https://github.com/payloadcms/payload/compare/v1.6.6...v1.6.7) (2023-02-08)

### Bug Fixes

- drawer state was not set when opened ([e6ac872](https://github.com/payloadcms/payload/commit/e6ac872b0d80470883836ef5aac0bdf4b62d6de9))

## [1.6.6](https://github.com/payloadcms/payload/compare/v1.6.5...v1.6.6) (2023-02-07)

### Bug Fixes

- [#1887](https://github.com/payloadcms/payload/issues/1887), dataloader rich text population infinite loop ([ac2e174](https://github.com/payloadcms/payload/commit/ac2e174643419e5b01cfbbf53234b0145aeb5e4e))
- enables locales with date field ([aefb655](https://github.com/payloadcms/payload/commit/aefb655769e7998a44cef9f93a19e4aef24c50bb))

## [1.6.5](https://github.com/payloadcms/payload/compare/v1.6.4...v1.6.5) (2023-02-07)

### Bug Fixes

- allows radio input to be tabbable ([b5880f2](https://github.com/payloadcms/payload/commit/b5880f26af8b97d47eca83a9fc7bd05b006cc54c))
- auth type leaking into type gen ([1f0a1c7](https://github.com/payloadcms/payload/commit/1f0a1c796ab4126a464949f3a1bc34c7360470a5))
- corrects keyboard accessibility for checkbox field ([65b8fd2](https://github.com/payloadcms/payload/commit/65b8fd27af05c25c3ddf86c34e1f181b8a605c27))
- ensures preview is enabled before rendering button ([e968f40](https://github.com/payloadcms/payload/commit/e968f4067c2427965c0f96845aff8eaca36d0df6))
- local API update typing ([#2010](https://github.com/payloadcms/payload/issues/2010)) ([4b0d4f4](https://github.com/payloadcms/payload/commit/4b0d4f4cd59940cace6b6b8cebf3d834d2b88dab)), closes [#2009](https://github.com/payloadcms/payload/issues/2009)
- max versions incorrectly sorting, causing incorrect versions to be held onto ([2e4f7ab](https://github.com/payloadcms/payload/commit/2e4f7ab35c23f25051a5000e7902df7f255ed607))
- named tabs not displaying data in versions view ([a41e295](https://github.com/payloadcms/payload/commit/a41e295e42fbf283733afd8b63bced9555cb1338))
- replaced media not rendering after document save ([827428d](https://github.com/payloadcms/payload/commit/827428d6b57a7abe858ca5ddaad5ba4ec9d3a270))
- webpack css-loader resolve urls ([ade4c01](https://github.com/payloadcms/payload/commit/ade4c011d348249e975a1510ae481018834a2ca2))

### Features

- deletes old media upon re-upload [#1897](https://github.com/payloadcms/payload/issues/1897) ([02f9be2](https://github.com/payloadcms/payload/commit/02f9be2c4a15eed6bba07f504319a2213ea411df))
- enables document drawers from read-only fields ([#1989](https://github.com/payloadcms/payload/issues/1989)) ([0dbc4fa](https://github.com/payloadcms/payload/commit/0dbc4fa21334e1a17c5aa35d84d78973fb7f54ec))

## [1.6.4](https://github.com/payloadcms/payload/compare/v1.6.3...v1.6.4) (2023-02-03)

### Bug Fixes

- only hoists localized values if localization is enabled ([8c65f6a](https://github.com/payloadcms/payload/commit/8c65f6a93836d80fb22724454f5efb49e11763ad))

### Features

- support large file uploads ([#1981](https://github.com/payloadcms/payload/issues/1981)) ([12ed655](https://github.com/payloadcms/payload/commit/12ed65588131c6db5252a1302a7dd82f0a10bd2e))

## [1.6.3](https://github.com/payloadcms/payload/compare/v1.6.2...v1.6.3) (2023-02-01)

### Bug Fixes

- properly await graphql schema generation ([888b3a2](https://github.com/payloadcms/payload/commit/888b3a26727b32d19e39d1a8b672eb1881effad7))

## [1.6.2](https://github.com/payloadcms/payload/compare/v1.6.1...v1.6.2) (2023-02-01)

### Features

- Adds optional password to generated types within auth-enabled collections

## [1.6.1](https://github.com/payloadcms/payload/compare/v1.5.9...v1.6.1) (2023-02-01)

### 🐛 Bug Fixes

- updated nl i18n typos ([cc7257e](https://github.com/payloadcms/payload/commit/cc7257efd529580b1eb7b6c01df9f7420838c345))
- fixes [#1905](https://github.com/payloadcms/payload/issues/1905)
- fixes [#1885](https://github.com/payloadcms/payload/issues/1885)
- fixes [#1869](https://github.com/payloadcms/payload/issues/1869)
- versions error on cosmos db ([338c4e2](https://github.com/payloadcms/payload/commit/338c4e2fb1f7fa4877b14b6a7adfdd80b08996d3))
- hides fallback locale checkbox when field localization is set to false ([#1893](https://github.com/payloadcms/payload/issues/1893)) ([0623039](https://github.com/payloadcms/payload/commit/06230398d7251240e45e843f1a4d70e6e7f547e7))
- [#1870](https://github.com/payloadcms/payload/issues/1870) and [#1859](https://github.com/payloadcms/payload/issues/1859) ([c0ac155](https://github.com/payloadcms/payload/commit/c0ac155a719aa69e1d0e2da97659c56d024325db))
- creates backup of latest version after restoring draft [#1873](https://github.com/payloadcms/payload/issues/1873) ([bd4da37](https://github.com/payloadcms/payload/commit/bd4da37f237d7bd33583d21b4ed8b910dd7d71cb))
- disables escapeValue for i18n ([#1886](https://github.com/payloadcms/payload/issues/1886)) ([eec4b3a](https://github.com/payloadcms/payload/commit/eec4b3ace5a3c9bbea168f2c87de1243414042aa))

### ✨ Features

- Roadmap - [improved TypeScript experience](https://github.com/payloadcms/payload/discussions/1563) - begins work to SIGNIFICANTLY improve typing of Payload's Local API, removing the need for generics and inferring types automatically from your generated types
- Refactors the Local API to include only the bare minimum code necessary for running local API operations, which will allow us to deploy serverlessly
- blocks drawer [#1909](https://github.com/payloadcms/payload/issues/1909) ([339cee4](https://github.com/payloadcms/payload/commit/339cee416a0f331d8ad718d6d0c0ad2ae8dca74d))
- requires ts-node to start a project for any config that uses ts or jsx ([f1c342e](https://github.com/payloadcms/payload/commit/f1c342e05eb84254c9d84a425b4f0da1249fcef3))
- simplifies versions logic ([8cfa550](https://github.com/payloadcms/payload/commit/8cfa5509540225100237e6f569eb9eb1a7d5448e))
- add Chinese translation ([#1926](https://github.com/payloadcms/payload/issues/1926)) ([7c6ff89](https://github.com/payloadcms/payload/commit/7c6ff89ab661f9dedb171f26349bfdcfdb6ebc96))
- add Croatian translation ([#1982](https://github.com/payloadcms/payload/issues/1982)) ([dfa47a0](https://github.com/payloadcms/payload/commit/dfa47a0e0fafa30d7e9fdef59aa001097b305c92)

### 🚨 BREAKING CHANGES

#### ✋ Payload now no longer transpiles your config for you

This release removes the need to use `@swc/register` to automatically transpile Payload configs, which dramatically improves Payload initialization speeds and simplifies the core Payload logic significantly. More info in the PR [here](https://github.com/payloadcms/payload/pull/1847).

If you are not using TypeScript, this will be a breaking change. There are many ways to mitigate this - but the best way is to just quickly scaffold a barebones TS implementation. You can still write JavaScript, and this PR does not require you to write TS, but handling transpilation with TypeScript will be an easy way forward and can set you up to opt-in to TS over time as well.

For instructions regarding how to migrate to TS, [review the PR here](https://github.com/payloadcms/payload/pull/1847).

#### ✋ Payload `init` is now always async, and `payload.initAsync` has been removed

We are pulling off a bandaid here and enforcing that `payload.init` is now asynchronous across the board. This will help prevent issues in the future and allow us to do more advanced things within `init` down the road. But this will be a breaking change if your project uses `payload.init` right now.

To migrate, you need to convert your code everywhere that you run `payload.init` to be asynchronous instead. For example, here is an example of a traditional `payload.init` call which needs to be migrated:

```js
const express = require("express");
const payload = require("payload");

const app = express();

payload.init({
  secret: "SECRET_KEY",
  mongoURL: "mongodb://localhost/payload",
  express: app,
});

app.listen(3000, async () => {
  console.log(
    "Express is now listening for incoming connections on port 3000."
  );
});
```

Your `payload.init` call will need to be converted into the following:

```js
const express = require("express");
const payload = require("payload");

const app = express();

const start = async () => {
  await payload.init({
    secret: "SECRET_KEY",
    mongoURL: "mongodb://localhost/payload",
    express: app,
  });

  app.listen(3000, async () => {
    console.log(
      "Express is now listening for incoming connections on port 3000."
    );
  });
};

start();
```

Notice that all we've done is wrapped the `payload.init` and `app.listen` calls with a `start` function that is asynchronous.

#### ✋ All Local API methods are no longer typed as generics, and instead will infer types for you automatically

Before this release, the Local API methods were configured as generics. For example, here is an example of the `findByID` method prior to this release:

```ts
const post = await payload.findByID<Post>({
  collection: "posts",
  id: "id-of-post-here",
});
```

Now, you don't need to pass your types and Payload will automatically infer them for you, as well as significantly improve typing throughout the local API. Here's an example:

```ts
const post = await payload.findByID({
  collection: "posts", // this is now auto-typed
  id: "id-of-post-here",
});

// `post` will be automatically typed as `Post`
```

To migrate, just remove the generic implementation!

But there's one more thing to do before Payload can automatically type your Local API. You need to add a path to your `tsconfig.json` file that matches your exported types from Payload:

```json
{
  "compilerOptions": {
    // your compilerOptions here
    "paths": {
      // Tell TS where to find your generated types
      // This is the default location below
      "payload/generated-types": ["./src/payload-types.ts"]
    }
  }
}
```

Then go regenerate your types. We've extended the `payload generate:types` method a bit to be more complete. Upon regenerating types, you'll see a new `Config` export at the top of the file which contains a key - value pair of all your collection and global types, which Payload will automatically import.

#### ✋ JSX support must be defined in `tsconfig.json`

If not already defined, add the following to your `compilerOptions`:

```ts
  "compilerOptions": {
    "jsx": "react"
  }
```

#### ✋ Versions may need to be migrated

This release includes a substantial simplification / optimization of how Versions work within Payload. They are now significantly more performant and easier to understand behind-the-scenes. We've removed ~600 lines of code and have ensured that Payload can be compatible with all flavors of MongoDB - including versions earlier than 4.0, Azure Cosmos MongoDB, AWS' DocumentDB and more.

But, some of your draft-enabled documents may need to be migrated.

If you are using versions and drafts on any collections, you can run a simple migration script to ensure that your drafts appear correctly in the Admin UI. Your data will never disappear from your database in any case if you update, but some drafts may not show in the List view anymore.

To migrate, create this file within the root of your Payload project:

**migrateVersions.ts**

```ts
const payload = require("payload");

require("dotenv").config();

const { PAYLOAD_SECRET, MONGODB_URI } = process.env;

// This function ensures that there is at least one corresponding version for any document
// within each of your draft-enabled collections.

const ensureAtLeastOneVersion = async () => {
  // Initialize Payload
  // IMPORTANT: make sure your ENV variables are filled properly here
  // as the below variable names are just for reference.
  await payload.init({
    secret: PAYLOAD_SECRET,
    mongoURL: MONGODB_URI,
    local: true,
  });

  // For each collection
  await Promise.all(
    payload.config.collections.map(async ({ slug, versions }) => {
      // If drafts are enabled
      if (versions?.drafts) {
        const { docs } = await payload.find({
          collection: slug,
          limit: 0,
          depth: 0,
          locale: "all",
        });

        const VersionsModel = payload.versions[slug];
        const existingCollectionDocIds: Array<string> = [];
        await Promise.all(
          docs.map(async (doc) => {
            existingCollectionDocIds.push(doc.id);
            // Find at least one version for the doc
            const versionDocs = await VersionsModel.find(
              {
                parent: doc.id,
                updatedAt: { $gte: doc.updatedAt },
              },
              null,
              { limit: 1 }
            ).lean();

            // If there are no corresponding versions,
            // we need to create one
            if (versionDocs.length === 0) {
              try {
                await VersionsModel.create({
                  parent: doc.id,
                  version: doc,
                  autosave: Boolean(versions?.drafts?.autosave),
                  updatedAt: doc.updatedAt,
                  createdAt: doc.createdAt,
                });
              } catch (e) {
                console.error(
                  `Unable to create version corresponding with collection ${slug} document ID ${doc.id}`,
                  e?.errors || e
                );
              }

              console.log(
                `Created version corresponding with ${slug} document ID ${doc.id}`
              );
            }
          })
        );

        const versionsWithoutParentDocs = await VersionsModel.deleteMany({
          parent: { $nin: existingCollectionDocIds },
        });

        if (versionsWithoutParentDocs.deletedCount > 0) {
          console.log(
            `Removing ${versionsWithoutParentDocs.deletedCount} versions for ${slug} collection - parent documents no longer exist`
          );
        }
      }
    })
  );

  console.log("Done!");
  process.exit(0);
};

ensureAtLeastOneVersion();
```

Make sure your environment variables match the script's values above and then run `PAYLOAD_CONFIG_PATH=src/payload.config.ts npx ts-node -T migrateVersions.ts` in your terminal. Make sure that you point the command to your Payload config.

This migration script will ensure that there is at least one corresponding version for each of your draft-enabled documents. It will also delete any versions that no longer have parent documents.

### 👀 Example of a properly migrated project

For an example of how everything works with this update, go ahead and run `npx create-payload-app`. We've updated `create-payload-app` to reflect all the necessary changes here and you can use a new project to compare / contrast what you have in your current project with what Payload needs now in this release.

## [1.5.9](https://github.com/payloadcms/payload/compare/v1.5.8...v1.5.9) (2023-01-15)

### Bug Fixes

- [#1877](https://github.com/payloadcms/payload/issues/1877), [#1867](https://github.com/payloadcms/payload/issues/1867) - mimeTypes and imageSizes no longer cause error in admin ui ([b06ca70](https://github.com/payloadcms/payload/commit/b06ca700be36cc3a945f81e3fa23ebb53d06ca23))

## [1.5.8](https://github.com/payloadcms/payload/compare/v1.5.7...v1.5.8) (2023-01-12)

### Features

- throws descriptive error when collection or global slug not found ([b847d85](https://github.com/payloadcms/payload/commit/b847d85e60032b47a8eacc2c9426fdd373dff879))

## [1.5.7](https://github.com/payloadcms/payload/compare/v1.5.6...v1.5.7) (2023-01-12)

### Bug Fixes

- ensures find with draft=true does not improperly exclude draft ids ([69026c5](https://github.com/payloadcms/payload/commit/69026c577914ba029f2c45423d9f621b605a3ca0))
- ensures querying with drafts works on both published and non-published posts ([f018fc0](https://github.com/payloadcms/payload/commit/f018fc04b02f70d0e6ea545d5eb36ea860206964))

## [1.5.6](https://github.com/payloadcms/payload/compare/v1.5.5...v1.5.6) (2023-01-11)

### Bug Fixes

- ensures that find with draft=true returns ids with drafts ([3f30b2f](https://github.com/payloadcms/payload/commit/3f30b2f4894258d67e9a9a79e2213f9d5f69f856))

## [1.5.5](https://github.com/payloadcms/payload/compare/v1.5.4...v1.5.5) (2023-01-11)

### Bug Fixes

- [#1808](https://github.com/payloadcms/payload/issues/1808), arrays and blocks now save localized nested field data upon reordering rows ([ee54c14](https://github.com/payloadcms/payload/commit/ee54c1481cdb8d6669864f20584fa6ef072c9097))
- bug when clearing relationship field without hasMany: true ([#1829](https://github.com/payloadcms/payload/issues/1829)) ([ed7cfff](https://github.com/payloadcms/payload/commit/ed7cfff45c262206495580509a77adb72a646ddb))
- ensures upload file data is available for conditions ([d40e136](https://github.com/payloadcms/payload/commit/d40e1369472f212b5f85bfc72fac01dc708aa507))
- fix miss typo in Thai translation ([25e5ab7](https://github.com/payloadcms/payload/commit/25e5ab7ceebfb36960b6969db543a2b4ae7127d2))
- formats date when useAsTitle ([086117d](https://github.com/payloadcms/payload/commit/086117d7039b2b68ab2789b57cac97e2735819cf))
- prevents uploads drawer from crashing when no uploads are enabled ([84e1417](https://github.com/payloadcms/payload/commit/84e1417b711e0823753f0b9174c145e40b68e0be))
- rte link element initial state [#1848](https://github.com/payloadcms/payload/issues/1848) ([1cde647](https://github.com/payloadcms/payload/commit/1cde647a2a86df21312229b8beec0a6b75df22c3))
- updatesmargin for group field within a row ([1c3a257](https://github.com/payloadcms/payload/commit/1c3a257244e322c04164f6630772a40baf256da7))
- upload field filterOptions ([9483ccb](https://github.com/payloadcms/payload/commit/9483ccb1208a91c1376ac4bd5186037f909aa45d))
- wrong translation and punctuation spacing ([bf1242a](https://github.com/payloadcms/payload/commit/bf1242aafa3fa7e72e81af10284f4ddade28c4a0))

### Features

- adds translations for fallbackToDefaultLocale ([c247f31](https://github.com/payloadcms/payload/commit/c247f3130cf03d1dc12d456886b04db028161800))
- ensures compatibility with azure cosmos and aws documentdb ([73af283](https://github.com/payloadcms/payload/commit/73af283e1c24befc2797e2bc9766a22d26e3c288))

## [1.5.4](https://github.com/payloadcms/payload/compare/v1.5.3...v1.5.4) (2023-01-06)

### Features

- allows init to accept a pre-built config ([84e00bf](https://github.com/payloadcms/payload/commit/84e00bf7b3dfc1c23367765eec60bec45b81617b))

## [1.5.3](https://github.com/payloadcms/payload/compare/v1.5.2...v1.5.3) (2023-01-05)

### Bug Fixes

- theme flicker on code editor ([6567454](https://github.com/payloadcms/payload/commit/6567454ae4e4808303da9b80d26633bc77e1445d))

## [1.5.2](https://github.com/payloadcms/payload/compare/v1.5.1...v1.5.2) (2023-01-04)

### Bug Fixes

- ignores admin and components from swc ([7d27431](https://github.com/payloadcms/payload/commit/7d274313129c44618ebd8d1fd7a176694ee40476))

## [1.5.1](https://github.com/payloadcms/payload/compare/v1.5.0...v1.5.1) (2023-01-04)

### Bug Fixes

- reverts components directory back to ts ([1bbf099](https://github.com/payloadcms/payload/commit/1bbf099fe052e767512e111f8f2b778c1b9c59d9))

# [1.5.0](https://github.com/payloadcms/payload/compare/v1.4.2...v1.5.0) (2023-01-04)

### Bug Fixes

- json field type ([73b8ba3](https://github.com/payloadcms/payload/commit/73b8ba3d4a86385cd0a80efcdc19e4972d16b0b7))

### Features

- adds initial json field ([28d9f90](https://github.com/payloadcms/payload/commit/28d9f9009cc479b0e5da5c5b4fb85eb29b055309))
- fixes json editor errors and misc styling ([efe4f6d](https://github.com/payloadcms/payload/commit/efe4f6d861a99337cfd35592557d3e8f16ff924a))
- swc register ([#1779](https://github.com/payloadcms/payload/issues/1779)) ([c11bcd1](https://github.com/payloadcms/payload/commit/c11bcd1416b19e48569218d9011d013ad77306ce))
- updates code field editor ([4d6eba8](https://github.com/payloadcms/payload/commit/4d6eba8d21d19eac63df02d56d27b0a17006d042))
- wires up i18n with monaco editor ([07b2cca](https://github.com/payloadcms/payload/commit/07b2ccad61a619478f6613fa65f4f630222639d4))

## [1.4.2](https://github.com/payloadcms/payload/compare/v1.4.1...v1.4.2) (2023-01-03)

### Bug Fixes

- [#1775](https://github.com/payloadcms/payload/issues/1775) - siblingData for unnamed fields within array rows improperly formatted ([d6fcd19](https://github.com/payloadcms/payload/commit/d6fcd19bd1eaf2942c2eaa31f0de4770ca10ff06))
- [#1786](https://github.com/payloadcms/payload/issues/1786), relationship with hasMany no longer sets empty array as default value ([ecfb363](https://github.com/payloadcms/payload/commit/ecfb36316961ef0eb9dd1ba1dc95ba98f95223f8))
- error clearing date field ([883daf7](https://github.com/payloadcms/payload/commit/883daf7b469c03fae67c16292af6aded662c0bd0))
- select field crash on missing value option ([ec9196e](https://github.com/payloadcms/payload/commit/ec9196e33ca01e6a15097943b4be6dee6ea5202f))

### Features

- add Ukrainian translation ([#1767](https://github.com/payloadcms/payload/issues/1767)) ([49fa5cb](https://github.com/payloadcms/payload/commit/49fa5cb23a0bb57348d8cd7ec0b7805d651fda2d))
- preview now exposes most recent draft data ([54dadbe](https://github.com/payloadcms/payload/commit/54dadbeae5b195405a7cfb480fd38b2eeb684938))

## [1.4.1](https://github.com/payloadcms/payload/compare/v1.4.0...v1.4.1) (2022-12-24)

### Bug Fixes

- [#1761](https://github.com/payloadcms/payload/issues/1761), avoids rich text modifying form due to selection change ([9f4ce8d](https://github.com/payloadcms/payload/commit/9f4ce8d756742a6e1b2644ea49d0778774aae457))

# [1.4.0](https://github.com/payloadcms/payload/compare/v1.3.4...v1.4.0) (2022-12-23)

### Bug Fixes

- [#1611](https://github.com/payloadcms/payload/issues/1611), unable to query draft versions with draft=true ([44b31a9](https://github.com/payloadcms/payload/commit/44b31a9e585aad515557b749bf05253139a17bd9))
- [#1656](https://github.com/payloadcms/payload/issues/1656) remove size data ([389ee26](https://github.com/payloadcms/payload/commit/389ee261d4ebae0b773bca375ed8a74685506aa0))
- [#1698](https://github.com/payloadcms/payload/issues/1698) - globals and autosave not working ([915f1e2](https://github.com/payloadcms/payload/commit/915f1e2b3a0c9618d5699a0ee6f5e74c6f4038ee))
- [#1738](https://github.com/payloadcms/payload/issues/1738) save image dimensions to svg uploads ([2de435f](https://github.com/payloadcms/payload/commit/2de435f43a2e75391a655e91a0cda251da776bcb))
- [#1747](https://github.com/payloadcms/payload/issues/1747), rich text in arrays improperly updating initialValue when moving rows ([d417e50](https://github.com/payloadcms/payload/commit/d417e50d52fc0824fb5aaedd3e1208c3e1468bdd))
- [#1748](https://github.com/payloadcms/payload/issues/1748), bails out of autosave if doc is published while autosaving ([95e9300](https://github.com/payloadcms/payload/commit/95e9300d109c9bfd377d5b5efbb68ddca306bbec))
- [#1752](https://github.com/payloadcms/payload/issues/1752), removes label from row field type ([ff3ab18](https://github.com/payloadcms/payload/commit/ff3ab18d1690e50473be2d77897fb9de48361413))
- [#551](https://github.com/payloadcms/payload/issues/551) - rich text nested list structure ([542ea8e](https://github.com/payloadcms/payload/commit/542ea8eb81a6e608c7368882da9692d656f1d36b))
- allows cleared file to be reselected ([35abe81](https://github.com/payloadcms/payload/commit/35abe811c1534ba4f7e926edd3a2978ee67b181e))
- get relationships in locale of i18n language setting ([#1648](https://github.com/payloadcms/payload/issues/1648)) ([60bb265](https://github.com/payloadcms/payload/commit/60bb2652f0aa63747513e771173362985123519c))
- missing file after reselect in upload component ([6bc1758](https://github.com/payloadcms/payload/commit/6bc1758dc0cad3f52ce332e71134ee527e17fff0))
- prevents special characters breaking relationship field search ([#1710](https://github.com/payloadcms/payload/issues/1710)) ([9af4c1d](https://github.com/payloadcms/payload/commit/9af4c1dde7f4a68dc629738dff4fc314626cabb8))
- refreshes document drawer on save ([9567328](https://github.com/payloadcms/payload/commit/9567328d28709c5721b33e5bd61c9535568ffffd))
- removes update and created at fields when duplicating, ensures updatedAt data is reactive ([bd4ed5b](https://github.com/payloadcms/payload/commit/bd4ed5b99b5026544c910592c3bff6040e2058bc))
- safely clears sort [#1736](https://github.com/payloadcms/payload/issues/1736) ([341c163](https://github.com/payloadcms/payload/commit/341c163b36c330df76a6eb5146fccc80059eb9d7))
- simplifies radio validation ([0dfed3b](https://github.com/payloadcms/payload/commit/0dfed3b30a15829f9454332a4cbd7d9ce1fddea3))
- translated tab classnames ([238bada](https://github.com/payloadcms/payload/commit/238badabb4f38e691608219c54a541993d9f3010))
- updates relationship label on drawer save and prevents stepnav update ([59de4f7](https://github.com/payloadcms/payload/commit/59de4f7e82dc4f08240b13d48054589b561688fa))
- updates richtext toolbar position if inside a drawer ([468b0d2](https://github.com/payloadcms/payload/commit/468b0d2a55616993f10eac7d1709620d114ad7d6))
- use the slug for authentication header API Key ([5b70ebd](https://github.com/payloadcms/payload/commit/5b70ebd119b557cff66e97e3554af730657b4071))

### Features

- add Czech translation ([#1705](https://github.com/payloadcms/payload/issues/1705)) ([0be4285](https://github.com/payloadcms/payload/commit/0be428530512c3babdfe39be259dd165bb66b5f4))
- adds doc permissions to account view ([8d643fb](https://github.com/payloadcms/payload/commit/8d643fb29d3604b78f6cb46582720dde2a46affb))
- **graphql:** upgrade to graphql 16 ([57f5f5e](https://github.com/payloadcms/payload/commit/57f5f5ec439b5aee1d46bff0bf31aac6148f16b2))

### BREAKING CHANGES

- replaced the useAPIKey authentication header format to use the collection slug instead of the collection label. Previous: `${collection.labels.singular} API-Key ${apiKey}`, updated: `${collection.slug} API-Key ${apiKey}`

## [1.3.4](https://github.com/payloadcms/payload/compare/v1.3.3...v1.3.4) (2022-12-16)

### Bug Fixes

- async validate out of order ([e913fbe](https://github.com/payloadcms/payload/commit/e913fbe4ea4f9abf7eeb29db3b03e1afe4649d50))
- autosave with nested localized fields ([4202fc2](https://github.com/payloadcms/payload/commit/4202fc29337763f8fd90ec4beaf0d34e39a916bc))
- doc access should not run where query on collections without id ([016beb6](https://github.com/payloadcms/payload/commit/016beb6eec96857fe913888a1d9c4994dbd94e7e))
- run docAccess also when checking global ([b8c0482](https://github.com/payloadcms/payload/commit/b8c0482cdae6d372f81823ee4541717131d9dac4))

## [1.3.3](https://github.com/payloadcms/payload/compare/v1.3.2...v1.3.3) (2022-12-16)

### Bug Fixes

- allow translation in group admin.description ([#1680](https://github.com/payloadcms/payload/issues/1680)) ([91e33ad](https://github.com/payloadcms/payload/commit/91e33ad1ee04750425112602fcfddcf329f934e8))
- ensures select field avoids circular dependencies ([f715146](https://github.com/payloadcms/payload/commit/f715146aa35a6f3a8f5d7d4e066c71fb26027472))

## [1.3.2](https://github.com/payloadcms/payload/compare/v1.3.1...v1.3.2) (2022-12-15)

### Bug Fixes

- safely handles rich text deselection ([420eef4](https://github.com/payloadcms/payload/commit/420eef4d91d6c5810b4e9dbda1e87e9f0e6d8dba))

## [1.3.1](https://github.com/payloadcms/payload/compare/v1.3.0...v1.3.1) (2022-12-15)

### Bug Fixes

- add i18n type to collection and globals admin.description ([#1675](https://github.com/payloadcms/payload/issues/1675)) ([049d560](https://github.com/payloadcms/payload/commit/049d560898fdf3fd9be40a4689eb1ef4170ef207))
- adds draftsEnabled to baseSchema for tabs / arrays / groups & allows for null enum ([80da898](https://github.com/payloadcms/payload/commit/80da898de8cfe068a0ad685803d8523fd9a10dcd))
- adds draftsEnabled to versionSchema in collections / globals ([f0db5e0](https://github.com/payloadcms/payload/commit/f0db5e0170807944cfbed8495c813b7c28b05bb3))
- collapsible margin bottom adjustment ([#1673](https://github.com/payloadcms/payload/issues/1673)) ([64086e8](https://github.com/payloadcms/payload/commit/64086e8122e04965ca0ae8d254b99114208944bf))
- escapes react-select events when drawer is open ([f290cda](https://github.com/payloadcms/payload/commit/f290cda333aecab104d7cd195bcc7fab2059134d))
- label translation in about to delete dialog ([#1667](https://github.com/payloadcms/payload/issues/1667)) ([d9c45f6](https://github.com/payloadcms/payload/commit/d9c45f62b19162a34bc317e997d9912213a3012b))
- list view date field display format ([#1661](https://github.com/payloadcms/payload/issues/1661)) ([934b443](https://github.com/payloadcms/payload/commit/934b443b5b3b0f610767786f940175b9db0b2da7))
- removes case for select field that sets data to undefined if set to null ([b4f39d5](https://github.com/payloadcms/payload/commit/b4f39d5fd380190ee82a5bb967756d25e9c98e95))
- Set 'Dashboard's link to config route ([#1652](https://github.com/payloadcms/payload/issues/1652)) ([940c1e8](https://github.com/payloadcms/payload/commit/940c1e84f5f091bf4b4ae0bd6628f077d9d0d6e9))
- stringifies date in DateTime field for useAsTitle ([#1674](https://github.com/payloadcms/payload/issues/1674)) ([a1813ca](https://github.com/payloadcms/payload/commit/a1813ca4b32dfcd8ca3604f7f03b1ba316d740e2))

### Features

- inline relationships ([8d744c8](https://github.com/payloadcms/payload/commit/c6013c39043cc7bf9e8ff39551662c25e8d744c8))
- custom button html element ([5592fb1](https://github.com/payloadcms/payload/commit/5592fb148dfa3058df577cfb7f5ed72ea25e1217))
- further Tooltip improvements ([e101f92](https://github.com/payloadcms/payload/commit/e101f925cc71af4c3a1b5ce4ad552d9834d35bfd))

# [1.3.0](https://github.com/payloadcms/payload/compare/v1.2.5...v1.3.0) (2022-12-09)

### Bug Fixes

- [#1547](https://github.com/payloadcms/payload/issues/1547), global afterChange hook not falling back to original global if nothing returned ([a72123d](https://github.com/payloadcms/payload/commit/a72123dd471e1032d832e409560bda9cf3058095))
- [#1632](https://github.com/payloadcms/payload/issues/1632) graphQL non-nullable relationship and upload fields ([#1633](https://github.com/payloadcms/payload/issues/1633)) ([eff3f18](https://github.com/payloadcms/payload/commit/eff3f18e7c184e5f82325e960b4cbe84b6377d82))
- change edit key to prevent richtext editor from crashing ([#1616](https://github.com/payloadcms/payload/issues/1616)) ([471d214](https://github.com/payloadcms/payload/commit/471d21410ac9ac852a8581a019dd6759f56cd8b2))
- filterOptions function argument relationTo is an array ([#1627](https://github.com/payloadcms/payload/issues/1627)) ([11b1c0e](https://github.com/payloadcms/payload/commit/11b1c0efc66acd32de2efcaf65bad504d2e2eb45))
- resets slate state when initialValue changes, fixes [#1600](https://github.com/payloadcms/payload/issues/1600), [#1546](https://github.com/payloadcms/payload/issues/1546) ([9558a22](https://github.com/payloadcms/payload/commit/9558a22ce6cdf9bc13215931b43bde0a7dd4bf50))
- sanitizes global find query params ([512bc1e](https://github.com/payloadcms/payload/commit/512bc1ebe636841f1dee6ce49c1d97db1810c4bd))
- Select with hasMany and localized ([#1636](https://github.com/payloadcms/payload/issues/1636)) ([756edb8](https://github.com/payloadcms/payload/commit/756edb858a1ca66c32e674770ddcdceae77bf349))
- translation key in revert published modal ([#1628](https://github.com/payloadcms/payload/issues/1628)) ([b6c597a](https://github.com/payloadcms/payload/commit/b6c597ab5c4fcd879496db5373155df48c657e28))
- unflattens fields in filterOptions callback ([acff46b](https://github.com/payloadcms/payload/commit/acff46b4a5b57f01fa0b14c1e9fd8330b4d787db))

- feat!: no longer sanitize collection slugs to kebab case (#1607) ([ba2f2d6](https://github.com/payloadcms/payload/commit/ba2f2d6e9b66568b11632bacdd92cfdc8ddae300)), closes [#1607](https://github.com/payloadcms/payload/issues/1607)

### Features

- add Norwegian bokmål (nb) translation ([#1614](https://github.com/payloadcms/payload/issues/1614)) ([759f001](https://github.com/payloadcms/payload/commit/759f00168137ff1a0fd862796a5971a9ba0264cd))
- add Thai translation ([#1630](https://github.com/payloadcms/payload/issues/1630)) ([7777d11](https://github.com/payloadcms/payload/commit/7777d11b9ed458a6c64efc8c9572edb898f6ceed))
- upload support pasting file ([eb69b82](https://github.com/payloadcms/payload/commit/eb69b82adfb4e94c1ef36b219310c55afc7a1d4e))

### BREAKING CHANGES

- collection slugs are no longer automatically sanitized to be kebab case. This will only be an issue if your current slugs were in camel case. The upgrade path will be to change those slugs to the kebab case version that the slug was automatically being sanitized to on the backend.

If you only use kebab case or single word slugs: no action needed.

If you have existing slugs with camel case and populated data: you'll need to convert these to the kebab case version to match the previously sanitized value.

ie. myOldSlug is your slug, you should convert it to my-old-slug.

Any future slugs after updating will be used as-is.

## [1.2.5](https://github.com/payloadcms/payload/compare/v1.2.4...v1.2.5) (2022-12-06)

### Bug Fixes

- exits findOptionsByValue when matchedOption is found ([881c067](https://github.com/payloadcms/payload/commit/881c067c40d7477fa2a56d9c700feab49410e1c1))
- mismatch language condition when rendering unpublish ([3ddd0ea](https://github.com/payloadcms/payload/commit/3ddd0ea3efbd4d673a943dbf63363c548ae5562c))
- safely coerces limit and depth to number or undefined ([dd04d78](https://github.com/payloadcms/payload/commit/dd04d7842efe9228e98271a878fd68a814042f41))
- uses pathOrName to pass to internal Relationship field components ([8874e87](https://github.com/payloadcms/payload/commit/8874e871d4a48d5d3fccb8233464437d8ea61ad4))

### Features

- add Turkish translations ([#1596](https://github.com/payloadcms/payload/issues/1596)) ([c8a6831](https://github.com/payloadcms/payload/commit/c8a683100f1ec663a2fdfd5c1ab82300d2618995))

## [1.2.4](https://github.com/payloadcms/payload/compare/v1.2.3...v1.2.4) (2022-12-03)

### Bug Fixes

- missing translation richText link modal ([#1573](https://github.com/payloadcms/payload/issues/1573)) ([2dcada1](https://github.com/payloadcms/payload/commit/2dcada199c21bee97eca88aa6bc8ba1bc2b45e7c))

## [1.2.3](https://github.com/payloadcms/payload/compare/v1.2.2...v1.2.3) (2022-12-02)

### Bug Fixes

- reset password regression ([#1574](https://github.com/payloadcms/payload/issues/1574)) ([396ea0b](https://github.com/payloadcms/payload/commit/396ea0bd53dc9e1ae1e348d6fe1eb3c36232b35b))

## [1.2.2](https://github.com/payloadcms/payload/compare/v1.2.1...v1.2.2) (2022-12-02)

### Bug Fixes

- adds contain operators for text/email/radio fields ([4c37af6](https://github.com/payloadcms/payload/commit/4c37af6f10dcfd77b5aec963bc5f84a178942143))
- adjusts how limit is set, both in options and paginates limit ([a718010](https://github.com/payloadcms/payload/commit/a71801006cbc4b989d5057a5f04e8e8e0a6dbeed))
- aligns mongoose PaginatedDocs type with actual lib type ([dce2081](https://github.com/payloadcms/payload/commit/dce208166337a8e47cc41301c9c5be0854199eaa))
- allows for form controlled relationship fields to be populated ([e4435bb](https://github.com/payloadcms/payload/commit/e4435bb8bd13fd7122124fb6e171f4bd1cce819c))
- allows for limit bypass on version find operations ([891f00d](https://github.com/payloadcms/payload/commit/891f00d05cd57d9387dd25be81daa3de99e315ed))
- blockName grows in all browsers ([03c2ab5](https://github.com/payloadcms/payload/commit/03c2ab52a89817e94ec9a7b4339e807d995e04f6))
- corrects skipValidation ([e6f1c6f](https://github.com/payloadcms/payload/commit/e6f1c6fc7bb56fe5a858b405c3bf799a46ac57f4))
- dynamic relationship filterOptions ([99c1f41](https://github.com/payloadcms/payload/commit/99c1f41e306a11547965fd938fa5607787243003))
- ensures enums cannot query on partial matches ([ec51929](https://github.com/payloadcms/payload/commit/ec51929b1af0b2c1138aa315d106b52f7e771779))
- german translation optimizations ([#1485](https://github.com/payloadcms/payload/issues/1485)) ([e9d2163](https://github.com/payloadcms/payload/commit/e9d21636011ac084fa26ffbea199fc766fe19b25))
- handle multiple locales in relationship population ([#1452](https://github.com/payloadcms/payload/issues/1452)) ([04c689c](https://github.com/payloadcms/payload/commit/04c689c5b04bc91020eb682b97721eba213836d2))
- **i18n:** requiresAtLeast variable in de.json ([#1556](https://github.com/payloadcms/payload/issues/1556)) ([47fd0d9](https://github.com/payloadcms/payload/commit/47fd0d9ec4aa62335d505a0bfba0305355a318ca))
- ignore validation when unpublishing, do not allow restore with invalid form state ([77ab542](https://github.com/payloadcms/payload/commit/77ab54243ab1857f4f430be4f8c4dc51e15f94ca))
- indexSortableFields timestamp fields [#1506](https://github.com/payloadcms/payload/issues/1506) ([#1537](https://github.com/payloadcms/payload/issues/1537)) ([7aada3c](https://github.com/payloadcms/payload/commit/7aada3c746603b91bbb4fadf953f36e23fba5121))
- infinite rerenders, accounts for hasMany false ([16d00e8](https://github.com/payloadcms/payload/commit/16d00e87c2f8b63e695e46ccbf279ad90621dc17))
- moves relationship field useEffect into async reducer action ([54ef40a](https://github.com/payloadcms/payload/commit/54ef40a335905f7295f847c68762f7fe06bccc30))
- moves sharp types from devDeps to deps ([b3d526b](https://github.com/payloadcms/payload/commit/b3d526b59a275a1f58a76322a588ba8a6370f26b))
- reverts async reducer and resolves infinite effect ([a9da81f](https://github.com/payloadcms/payload/commit/a9da81f18cf9e6eba67187a3a2735b267949e0ae))
- sanitize number query params before passing to find operation ([c8d1b9f](https://github.com/payloadcms/payload/commit/c8d1b9f88af62ad1ab927ca3d035fa4c031989f1))
- translate select field option labels ([#1476](https://github.com/payloadcms/payload/issues/1476)) ([3a9dc9e](https://github.com/payloadcms/payload/commit/3a9dc9ef68374692c3314651bee6e1b00ae55f17))
- update drafts includes latest version changes ([48989d0](https://github.com/payloadcms/payload/commit/48989d0f6ed086dc60dc94165a4e0ca8120f9b1a))
- updates code field css ([3eebd66](https://github.com/payloadcms/payload/commit/3eebd6613f66f3cac38e00cfd94e80b2999cf791))
- updates syntax colors for light theme ([dbfe7ca](https://github.com/payloadcms/payload/commit/dbfe7ca6e61e3a93baabc378f52835af9e53fd38))
- uses baseClass in code field ([d03f0ae](https://github.com/payloadcms/payload/commit/d03f0aef8423597aceb36ddbbb1cc63033d0066d))

### Features

- decouples limit from pagination, allows for no limit query ([f7ce0c6](https://github.com/payloadcms/payload/commit/f7ce0c615d76035ee48ef32047613ab1415deb44))
- improve typescript comments ([#1467](https://github.com/payloadcms/payload/issues/1467)) ([5bd8657](https://github.com/payloadcms/payload/commit/5bd86571cada5791003bbfa84183f5b300649533))
- log email transport error messages ([#1469](https://github.com/payloadcms/payload/issues/1469)) ([a90a1a9](https://github.com/payloadcms/payload/commit/a90a1a9e19bb54eb6d88129b5e2cb6483e22db61))
- removes theme provider and updates background for code fields ([1a6c9a3](https://github.com/payloadcms/payload/commit/1a6c9a3e181930a6f45027fecc5313e8d7228c71))

## [1.2.1](https://github.com/payloadcms/payload/compare/v1.2.0...v1.2.1) (2022-11-22)

### Bug Fixes

- adjusts styles to allow error bg to fill textarea ([2e57b76](https://github.com/payloadcms/payload/commit/2e57b76df01acf7ed1ce5fcb824ef5f96d11621d))
- allows patching global drafts [#1415](https://github.com/payloadcms/payload/issues/1415) ([25822a9](https://github.com/payloadcms/payload/commit/25822a91b1e4f2bf4804f15947d211138d696219))
- dynamically sets stepnav from default edit view ([40c8778](https://github.com/payloadcms/payload/commit/40c87784b0c6281c599b6d2a46a27b70b0568c30))
- ensures drafts operations saves as draft [#1415](https://github.com/payloadcms/payload/issues/1415) ([fc16ffe](https://github.com/payloadcms/payload/commit/fc16ffefdb354ea023462d784cdac7ab6fcc26d3))
- flattens locales before versioning published docs [#1415](https://github.com/payloadcms/payload/issues/1415) ([f700f51](https://github.com/payloadcms/payload/commit/f700f51f2bcdd657d1fab6b6d83ac00a11ed870d))
- **i18n:** version count ([#1465](https://github.com/payloadcms/payload/issues/1465)) ([075b7e9](https://github.com/payloadcms/payload/commit/075b7e9f02498ea253cf270654dcce0f11ec1f93))
- Increase textarea click area ([c303913](https://github.com/payloadcms/payload/commit/c303913e61881a3b0d90615dda905b20347d6f1e))
- invalid query string user account request ([#1478](https://github.com/payloadcms/payload/issues/1478)) ([400cb9b](https://github.com/payloadcms/payload/commit/400cb9b6bcfd09c39cb6aa438daad876d12e8e13))
- removes incorrectly import/export option type - [#1441](https://github.com/payloadcms/payload/issues/1441) ([ed01a17](https://github.com/payloadcms/payload/commit/ed01a176210a02a32874f4d0d1c5206d9a772e7e))
- rendering of localized select value ([1d1d249](https://github.com/payloadcms/payload/commit/1d1d2493aa08db4c300c01e72ccb6c11e03f9e09))
- sanitizes select values on the server, allowing isClearable selects to be cleared without error ([699ca14](https://github.com/payloadcms/payload/commit/699ca14434eeff3025cffd3f6e00efada80e021f))
- translate version comparison view field labels ([#1470](https://github.com/payloadcms/payload/issues/1470)) ([8123585](https://github.com/payloadcms/payload/commit/8123585592b9a53ef746f17476b36a2661cca025))
- versionCount was broken & other i18n improvements ([#1450](https://github.com/payloadcms/payload/issues/1450)) ([078c28b](https://github.com/payloadcms/payload/commit/078c28bd5fd08fd17a0b0b360e904f51fe8a2e98))
- versions tests ([af6a7aa](https://github.com/payloadcms/payload/commit/af6a7aa9e850c0817ea40d755f51255ccf0938c2))

### Features

- add i18n to option labels in version comparison ([#1477](https://github.com/payloadcms/payload/issues/1477)) ([7b6a9ed](https://github.com/payloadcms/payload/commit/7b6a9ede6e3a72e7e64358cb88946b16153d8dc6))
- exports field types properly ([7c6d6fd](https://github.com/payloadcms/payload/commit/7c6d6fd1caeb25e1a871fa1b9cecc53be8a2a7a1))

# [1.2.0](https://github.com/payloadcms/payload/compare/v1.1.26...v1.2.0) (2022-11-18)

### 🐛 Bug Fixes

- build errors ([65f0e1c](https://github.com/payloadcms/payload/commit/65f0e1caace193f034139e331883d01d8eb92d2c))
- components optional chaining ([d5e725c](https://github.com/payloadcms/payload/commit/d5e725c608588e96b974291fa86d5e89dea9060d))
- corrects exported custom component type ([2878b4b](https://github.com/payloadcms/payload/commit/2878b4b1bec5c0c9997c1ba2a080640d4d3f8e5f))
- corrects type for CollapsibleLabel example type, adjusts custom component filenames ([ccb4231](https://github.com/payloadcms/payload/commit/ccb42319abf0679d998e15b6b47fff3ce95d4ca1))
- sets pointer-events to none so the entire label bar is clickable ([e458087](https://github.com/payloadcms/payload/commit/e458087a55cbbad29ca3568ca4c089aaee49693a))

### ✨ Features

- add i18n to admin panel ([#1326](https://github.com/payloadcms/payload/issues/1326)) ([bab34d8](https://github.com/payloadcms/payload/commit/bab34d82f5fddad32ceafd116ad97e87cab4c862))
- adds docs example ([2bf0fff](https://github.com/payloadcms/payload/commit/2bf0fffa0dd83f395aa3318b3baba1e22dd58b51))
- adds playwright tests for array fields ([57a8c35](https://github.com/payloadcms/payload/commit/57a8c352e44750d1785b65074c15812dc8226585))
- converts rowHeader to collapsibleLabel, extends data passed to functions/components ([13ec1e0](https://github.com/payloadcms/payload/commit/13ec1e0398d2a9ce1aeddc5692008173acfde45e))
- customizable header-labels ([d45de99](https://github.com/payloadcms/payload/commit/d45de99956273c59e6d1a3a11c7cce36f3d123f6))
- simplifies collapsible label API, adds e2e tests ([d9df98f](https://github.com/payloadcms/payload/commit/d9df98ff22041908fc2ce0972c844116edd409be))
- specifies component names for arrays/collapsibles, simplifies threaded data ([b74ea21](https://github.com/payloadcms/payload/commit/b74ea218ca47ce9db9d20586dbbce73e4ce0f917))

### 🚨 BREAKING CHANGES

- You **_might_** need to update your config. This change affects `collections`, `globals` and `block fields` with custom labeling.

  - **Collections:** are affected if you have a custom `labels.singular` defined that differs from your collection slug.

    ```typescript
    // ExampleCollection.ts

    // Before
    const ExampleCollection: CollectionConfig = {
      slug: "case-studies",
      labels: {
        // Before Payload used `labels.singular` to generate types/graphQL schema
        singular: "Project",
        plural: "Projects",
      },
    };

    // After
    const ExampleCollection: CollectionConfig = {
      // Now Payload uses `slug` to generate types/graphQL schema
      slug: "case-studies",
      labels: {
        singular: "Project",
        plural: "Projects",
      },
      // To override the usage of slug in graphQL schema generation
      graphQL: {
        singularName: "Project",
        pluralName: "Projects",
      },
      // To override the usage of slug in type file generation
      typescript: {
        interface: "Project",
      },
    };
    ```

  - **Globals:** are affected if you have a `label` defined that differs from your global slug.

    ```typescript
    // ExampleGlobal.ts

    // Before
    const ExampleGlobal: GlobalConfig = {
      slug: "footer",
      // Before Payload used `label` to generate types/graphQL schema
      label: "Page Footer",
    };

    // After
    const ExampleGlobal: GlobalConfig = {
      // Now Payload uses `slug` to generate types/graphQL schema
      slug: "footer",
      label: "Page Footer",
      // To override the usage of slug in graphQL schema generation
      graphQL: {
        name: "PageFooter",
      },
      // To override the usage of slug in type file generation
      typescript: {
        interface: "PageFooter",
      },
    };
    ```

  - **Block Fields:** are affected if you have a `label` defined that differs from your block slug.

    ````typescript
    // ExampleBlock.ts

        // Before
        const ExampleBlock: Block = {
          slug: 'content',
          // Before Payload used `label` to generate graphQL schema
          label: 'Content Block',
        }

        // After
        const ExampleBlock: Block = {
          // Now Payload uses `slug` to generate graphQL schema
          slug: 'content',
          label: 'Content Block',
          // To override the usage of slug in graphQL schema generation
          graphQL: {
            singularName: 'ContentBlock',
          },
        }
        ```

    **Breaking changes recap**:
    ````

* On Collections

  - Use `graphQL.singularName`, `graphQL.pluralName` for GraphQL schema names.
  - Use `typescript.interface` for typescript generation name.

* On Globals

  - Use `graphQL.name` for GraphQL Schema name.
  - Use `typescript.interface` for typescript generation name.

* On Blocks (within Block fields)
  - Use `graphQL.singularName` for graphQL schema names.

## [1.1.26](https://github.com/payloadcms/payload/compare/v1.1.25...v1.1.26) (2022-11-15)

### Bug Fixes

- [#1414](https://github.com/payloadcms/payload/issues/1414) ([50bcf00](https://github.com/payloadcms/payload/commit/50bcf001ea613c65cfe0545e7257d5b13ca688f3))

## [1.1.25](https://github.com/payloadcms/payload/compare/v1.1.24...v1.1.25) (2022-11-15)

### Bug Fixes

- add slug to DocumentInfo context ([#1389](https://github.com/payloadcms/payload/issues/1389)) ([4d8cc97](https://github.com/payloadcms/payload/commit/4d8cc97475c73e5131699ef03dca275a17535a25))
- adds unique key to upload cards to prevent old images being shown while navigating to new page ([5e8a8b2](https://github.com/payloadcms/payload/commit/5e8a8b2df9af435f0df8a8a07dddf7dcc24cf9ac))
- ensures admin components is defaulted ([d103f6c](https://github.com/payloadcms/payload/commit/d103f6c94f91b5359aea722c2d7781bf144f6a26))
- global afterRead and afterChange execution ([#1405](https://github.com/payloadcms/payload/issues/1405)) ([cdaa8cc](https://github.com/payloadcms/payload/commit/cdaa8cc29f58308a387375ec41eafd0d38b13bcb))

### Features

- admin UI logout extensibility ([#1274](https://github.com/payloadcms/payload/issues/1274)) ([a345ef0](https://github.com/payloadcms/payload/commit/a345ef0d3179000a2930f8b09886e06fd0801d21))
- let textarea grow based on value ([#1398](https://github.com/payloadcms/payload/issues/1398)) ([0f27b10](https://github.com/payloadcms/payload/commit/0f27b103b44935480b8ffe17427fc5ed05b92446))
- saves tab index to user preferences ([5eb8e4a](https://github.com/payloadcms/payload/commit/5eb8e4a28f34a1c51790d4eabfb21606b7fb41c6))

## [1.1.24](https://github.com/payloadcms/payload/compare/v1.1.23...v1.1.24) (2022-11-14)

### Bug Fixes

- cursor jumping while typing in inputs ([216b9f8](https://github.com/payloadcms/payload/commit/216b9f88d988c692d6acdf920ee4dbb9903020ae)), closes [#1393](https://github.com/payloadcms/payload/issues/1393)

## [1.1.23](https://github.com/payloadcms/payload/compare/v1.1.22...v1.1.23) (2022-11-12)

### Bug Fixes

- [#1361](https://github.com/payloadcms/payload/issues/1361), ensures collection auth depth works while retrieving static assets ([2f68404](https://github.com/payloadcms/payload/commit/2f684040fc9ca717d48b0d95cbd3468c35973993))

### Features

- optimizes field performance by storing internal values in useField hook ([66210b8](https://github.com/payloadcms/payload/commit/66210b856b97139f9959fac47154bca44f0a4de0))

## [1.1.22](https://github.com/payloadcms/payload/compare/v1.1.21...v1.1.22) (2022-11-12)

### Bug Fixes

- [#1353](https://github.com/payloadcms/payload/issues/1353), ensures errors returned from server make their way to UI ([3f28a69](https://github.com/payloadcms/payload/commit/3f28a69959be9c98869f81bcd379b8c7cd505a12))
- [#1357](https://github.com/payloadcms/payload/issues/1357), nested arrays and blocks sometimes not allowing save ([86855d6](https://github.com/payloadcms/payload/commit/86855d68f65dfadbf51050bdaf6a28c3220add6f))
- [#1358](https://github.com/payloadcms/payload/issues/1358), allows listSearchableFields to work when indicated fields are nested ([eb0023e](https://github.com/payloadcms/payload/commit/eb0023e9617894873fe75748de187d85279498c8))
- [#1360](https://github.com/payloadcms/payload/issues/1360), relationship field onMenuScrollToBottom not working in some browsers ([7136db4](https://github.com/payloadcms/payload/commit/7136db4c718b70833fa75f5c8e9ae596298b3aa9))
- [#1367](https://github.com/payloadcms/payload/issues/1367), allows custom global components within schema validation ([1d76e97](https://github.com/payloadcms/payload/commit/1d76e973bb8e6e33e40b469bd410042ae4b90e2e))
- 1309, duplicative logout in admin UI ([35f91b0](https://github.com/payloadcms/payload/commit/35f91b038b66d74468dad250dbe7cbf1ea88b444))
- fixed GraphQL Access query resolver to return the correct data ([#1339](https://github.com/payloadcms/payload/issues/1339)) ([cfef68f](https://github.com/payloadcms/payload/commit/cfef68f36477e34b9943d9334c65fa46ee3eb339))

## [1.1.21](https://github.com/payloadcms/payload/compare/v1.1.20...v1.1.21) (2022-11-05)

## [1.1.20](https://github.com/payloadcms/payload/compare/v1.1.19...v1.1.20) (2022-11-05)

### Features

- optimizes blocks and arrays by removing some additional rerenders ([483adf0](https://github.com/payloadcms/payload/commit/483adf08c4131d0401e47ec45d72200b9dc60de2))

## [1.1.19](https://github.com/payloadcms/payload/compare/v1.1.18...v1.1.19) (2022-10-31)

### Bug Fixes

- [#1307](https://github.com/payloadcms/payload/issues/1307), [#1321](https://github.com/payloadcms/payload/issues/1321) - bug with disableFormData and blocks field ([2a09f15](https://github.com/payloadcms/payload/commit/2a09f15a158ff30e89c5454f81aa140448f15d30))
- [#1311](https://github.com/payloadcms/payload/issues/1311), select existing upload modal always updates state ([e2ec2f7](https://github.com/payloadcms/payload/commit/e2ec2f7b97ed308c4ff7deefbc58cf0df6ff0602))
- [#1318](https://github.com/payloadcms/payload/issues/1318), improves popup positioning and logic ([c651835](https://github.com/payloadcms/payload/commit/c6518350617d14818dfc537b5b0a147274c1119b))
- custom pino logger options ([#1299](https://github.com/payloadcms/payload/issues/1299)) ([2500026](https://github.com/payloadcms/payload/commit/25000261bd6ecb0f05ae79de9a0693078a0e3e0d))

## [1.1.18](https://github.com/payloadcms/payload/compare/v1.1.17...v1.1.18) (2022-10-25)

## [1.1.17](https://github.com/payloadcms/payload/compare/v1.1.16...v1.1.17) (2022-10-25)

### Bug Fixes

- [#1286](https://github.com/payloadcms/payload/issues/1286), uses defaultDepth in graphql rich text depth ([66bf8c3](https://github.com/payloadcms/payload/commit/66bf8c3cbd080ee5a28b7af521d427d3aae59ba2))
- [#1290](https://github.com/payloadcms/payload/issues/1290), renders more than one rich text leaf where applicable ([a9f2f0e](https://github.com/payloadcms/payload/commit/a9f2f0ec03383ef4c3ef3ba98274b0abaaf962ed))
- [#1291](https://github.com/payloadcms/payload/issues/1291), add inline relationship drafts ([3967c12](https://github.com/payloadcms/payload/commit/3967c1233fda00b48e9df15276502a6b14b737ff))
- enforces depth: 0 in graphql resolvers ([3301f59](https://github.com/payloadcms/payload/commit/3301f598223d517ac310909bb74e455891c27693))
- ensures field updates when disableFormData changes ([c929725](https://github.com/payloadcms/payload/commit/c929725dd565de08871dad655442ee9ac4f29dd5))
- group + group styles within collapsible ([17dbbc7](https://github.com/payloadcms/payload/commit/17dbbc77757a7cd6e517bac443859561fee86e32))

### Features

- added beforeLogin hook ([#1289](https://github.com/payloadcms/payload/issues/1289)) ([09d7939](https://github.com/payloadcms/payload/commit/09d793926dbb642bbcb6ab975735d069df355a8a))
- adds default max length for text-based fields ([6a1b25a](https://github.com/payloadcms/payload/commit/6a1b25ab302cbdf7f312012b29b78288815810af))
- specify node 14+ and yarn classic LTS ([#1240](https://github.com/payloadcms/payload/issues/1240)) ([9181477](https://github.com/payloadcms/payload/commit/91814777b0bf3830c4a468b76783ff6f42ad824a))

## [1.1.16](https://github.com/payloadcms/payload/compare/v1.1.15...v1.1.16) (2022-10-21)

### Bug Fixes

- indexSortableFields not respected ([785b992](https://github.com/payloadcms/payload/commit/785b992c3ea31f7818f1c87c816b8b8de644851d))
- obscure bug where upload collection has upload field relating to itself ([36ef378](https://github.com/payloadcms/payload/commit/36ef3789fbe00cafe8b3587d6c370e28efd5a187))

## [1.1.15](https://github.com/payloadcms/payload/compare/v1.1.14...v1.1.15) (2022-10-14)

### Bug Fixes

- ensures svg mime type is always image/svg+xml ([0b0d971](https://github.com/payloadcms/payload/commit/0b0d9714917b1a56fb899a053e2e35c878a00992))

## [1.1.14](https://github.com/payloadcms/payload/compare/v1.1.13...v1.1.14) (2022-10-14)

## [1.1.11](https://github.com/payloadcms/payload/compare/v1.1.10...v1.1.11) (2022-10-12)

### Bug Fixes

- ensures arrays and blocks mount as disableFormData: true, fixes [#1242](https://github.com/payloadcms/payload/issues/1242) ([5ca5aba](https://github.com/payloadcms/payload/commit/5ca5abab422ad1cdb1b449a8298f439c57dda464))

### Features

- builds beforeDuplicate admin hook, closes [#1243](https://github.com/payloadcms/payload/issues/1243) ([6f6f2f8](https://github.com/payloadcms/payload/commit/6f6f2f8e7b83821ae2f2d30d08460439746cc0c6))

## [1.1.10](https://github.com/payloadcms/payload/compare/v1.1.9...v1.1.10) (2022-10-11)

## [1.1.9](https://github.com/payloadcms/payload/compare/v1.1.8...v1.1.9) (2022-10-11)

### Features

- improves access control typing ([5322ada](https://github.com/payloadcms/payload/commit/5322ada9e690544c4864abba202a14ec1f2f5e9d))

## [1.1.8](https://github.com/payloadcms/payload/compare/v1.1.7...v1.1.8) (2022-10-11)

### Features

- adds ability to create related docs while editing another ([1e048fe](https://github.com/payloadcms/payload/commit/1e048fe03787577fe4d584cec9c2d7c78bc90a17))
- implements use-context-selector for form field access ([5c1a3fa](https://github.com/payloadcms/payload/commit/5c1a3fabeef48b78f173af084f9117515e1297ba))

## [1.1.7](https://github.com/payloadcms/payload/compare/v1.1.6...v1.1.7) (2022-10-06)

## [1.1.6](https://github.com/payloadcms/payload/compare/v1.1.5...v1.1.6) (2022-10-06)

### Bug Fixes

- [#1184](https://github.com/payloadcms/payload/issues/1184) ([c2ec54a](https://github.com/payloadcms/payload/commit/c2ec54a7cbd8cd94bcd4a68d885e35986fec7f18))
- [#1189](https://github.com/payloadcms/payload/issues/1189) ([3641dfd](https://github.com/payloadcms/payload/commit/3641dfd38a147b24e0e3ef93a125b12ad7763f66))
- [#1204](https://github.com/payloadcms/payload/issues/1204) ([b4becd1](https://github.com/payloadcms/payload/commit/b4becd1493d55aae887008ab573ab710c400103a))
- [#940](https://github.com/payloadcms/payload/issues/940) ([7926083](https://github.com/payloadcms/payload/commit/7926083732fbaec78d87f67742cdbd8bd00cd48a))
- ajusts how disabled states are being set on anchors and buttons ([00ef170](https://github.com/payloadcms/payload/commit/00ef1700ae41e68ff0831a587bf3f09fe6c2c966))
- remove min-width from fileupload ([73848b6](https://github.com/payloadcms/payload/commit/73848b603790b3c3d8ad8c9dac81b33c0b65fc7e))
- resize textarea only vertically ([6e1dfff](https://github.com/payloadcms/payload/commit/6e1dfff1b8195a1f81e6ea6ccf3b36dd5359c039))
- richText e2e test, specific selectors ([09a8144](https://github.com/payloadcms/payload/commit/09a8144f3cc63f7ec15fd75f51b8ac8d0cf3f1b5))
- styles readOnly RichTextEditor, removes interactivity within when readOnly ([9181304](https://github.com/payloadcms/payload/commit/918130486e1e38a3d57fb993f466207209c5c0bb))
- **style:** system dark scrollbars ([a30d9dc](https://github.com/payloadcms/payload/commit/a30d9dc1d70340cc6c5ac5b3415a6f57bec117ae))
- threads readOnly to ReactSelect ([b454811](https://github.com/payloadcms/payload/commit/b454811698c7ea0cee944ed50030c13163cf72c9))
- upload xls renaming ext ([7fd8124](https://github.com/payloadcms/payload/commit/7fd8124df68d208813de46172c5cd3f479b9b8be))

### Features

- async admin access control ([1cfce87](https://github.com/payloadcms/payload/commit/1cfce8754947487e6c598ed5bc881526295acabf))
- sort select and relationship fields by default ([813c46c](https://github.com/payloadcms/payload/commit/813c46c86d86f8b0a3ba7280d31f24e844c916b6))

## [1.1.5](https://github.com/payloadcms/payload/compare/v1.1.4...v1.1.5) (2022-09-29)

### Bug Fixes

- bug in useThrottledEffect ([3ce8ee4](https://github.com/payloadcms/payload/commit/3ce8ee4661bfa3825c5b8c41232d5da57f7591ed))

## [1.1.4](https://github.com/payloadcms/payload/compare/v1.1.3...v1.1.4) (2022-09-24)

### Bug Fixes

- field level access for nested fields ([22ea98c](https://github.com/payloadcms/payload/commit/22ea98ca33770a0ec6652f814726454abb6da24e))
- refine type generation for relationships ([ef83bdb](https://github.com/payloadcms/payload/commit/ef83bdb709ebde008b90930a6875b24f042a41b0))

### Features

- supports root endpoints ([52cd3b4](https://github.com/payloadcms/payload/commit/52cd3b4a7ed9bc85e93d753a3aaf190489ca98cd))

## [1.1.3](https://github.com/payloadcms/payload/compare/v1.1.2...v1.1.3) (2022-09-16)

### Bug Fixes

- adjust prevPage and nextPage graphql typing ([#1140](https://github.com/payloadcms/payload/issues/1140)) ([b3bb421](https://github.com/payloadcms/payload/commit/b3bb421c6ca4176974488b3270384386a151560c))
- duplicate with relationships ([eabb981](https://github.com/payloadcms/payload/commit/eabb981243e005facb5fff6d9222903d4704ca55))

## [1.1.2](https://github.com/payloadcms/payload/compare/v1.1.1...v1.1.2) (2022-09-14)

### Bug Fixes

- resize images without local storage ([1496679](https://github.com/payloadcms/payload/commit/14966796ae0d0bcff8cb56b62e3a21c2de2176da))
- resize images without local storage ([7b756f3](https://github.com/payloadcms/payload/commit/7b756f3421f02d1ff55374a72396e15e9f3e23d7))

## [1.1.1](https://github.com/payloadcms/payload/compare/v1.1.0...v1.1.1) (2022-09-13)

### Bug Fixes

- conditions on collapsible fields ([9c4f2b6](https://github.com/payloadcms/payload/commit/9c4f2b68b07bbdd2ac9a6dee280f50379638fc50))
- dashboard links to globals ([dcc8dad](https://github.com/payloadcms/payload/commit/dcc8dad53b006f86e93150f9439eafc8d9e01d79))

# [1.1.0](https://github.com/payloadcms/payload/compare/v1.0.36...v1.1.0) (2022-09-13)

### Bug Fixes

- [#1106](https://github.com/payloadcms/payload/issues/1106) ([9a461b8](https://github.com/payloadcms/payload/commit/9a461b853689fdbc8229c8e103c5e237e451425f))
- word boundaries, no regex lookbehind support for Safari ([#1114](https://github.com/payloadcms/payload/issues/1114)) ([391c9d8](https://github.com/payloadcms/payload/commit/391c9d8682175ea37f1f7b2bb9d1361dc4ac8140))

### Features

- [#1001](https://github.com/payloadcms/payload/issues/1001) - builds a way to allow list view to search multiple fields ([a108372](https://github.com/payloadcms/payload/commit/a1083727ef54ec15ea2c3b4dfd114567639dfef1))
- collection groups ([dffeaf6](https://github.com/payloadcms/payload/commit/dffeaf6a69746b944bf36bd172da3cc19fa025a0))
- globals groups ([59af872](https://github.com/payloadcms/payload/commit/59af8725b4625f8e08aaab730fce177e870279ca))
- hide nav labels with no un-grouped collections ([c40e232](https://github.com/payloadcms/payload/commit/c40e232ac67e7bc1ced3775060beb835efff46b9))
- implement gravatar ([#1107](https://github.com/payloadcms/payload/issues/1107)) ([ca434b8](https://github.com/payloadcms/payload/commit/ca434b8a929af081bb3b92b51f35058a23ce5e37))
- support localized tab fields ([a83921a](https://github.com/payloadcms/payload/commit/a83921a2fe927d59562272cb111c68a840b1914f))
- tabs support localization at the tab level ([6a6a691](https://github.com/payloadcms/payload/commit/6a6a69190fe13bebf3e0b089265d71be2a691488))
- WIP tab compatible with traverseFields ([2ae33b6](https://github.com/payloadcms/payload/commit/2ae33b603abaec4ff80261a465781f508b4a1e06))

## [1.0.36](https://github.com/payloadcms/payload/compare/v1.0.35...v1.0.36) (2022-09-10)

### Bug Fixes

- bug with account view ([ada1871](https://github.com/payloadcms/payload/commit/ada1871993bae92bc7a30f48029b437d63eb3871))

## [1.0.35](https://github.com/payloadcms/payload/compare/v1.0.34...v1.0.35) (2022-09-10)

### Bug Fixes

- [#1059](https://github.com/payloadcms/payload/issues/1059) ([13dc39d](https://github.com/payloadcms/payload/commit/13dc39dc6da4cb7c450477f539b09a3cb54ed5af))
- add height/width if imageSizes not specified ([8bd2a0e](https://github.com/payloadcms/payload/commit/8bd2a0e6c9a9cd05c7b162ade47f3bb111236ba3))
- incorrect auth strategy type ([c8b37f4](https://github.com/payloadcms/payload/commit/c8b37f40cbdc766a45dbe21573b1848bfc091901))
- rich text link with no selection ([5a19f69](https://github.com/payloadcms/payload/commit/5a19f6915a17dbb072b89f63f32705d5f0fc75ce))

### Features

- allows rich text links to link to other docs ([a99d9c9](https://github.com/payloadcms/payload/commit/a99d9c98c3f92d6fbeb65c384ca4d43b82184bfd))
- improves rich text link ux ([91000d7](https://github.com/payloadcms/payload/commit/91000d7fdaa9628650c737fc3f7f6a900b7447d4))

## [1.0.34](https://github.com/payloadcms/payload/compare/v1.0.33...v1.0.34) (2022-09-07)

### Bug Fixes

- pins faceless ui modal ([b38b642](https://github.com/payloadcms/payload/commit/b38b6427b8b813487922db0bb7d3762cc41d3447))

## [1.0.33](https://github.com/payloadcms/payload/compare/v1.0.30...v1.0.33) (2022-09-07)

### Bug Fixes

- [#1062](https://github.com/payloadcms/payload/issues/1062) ([05d1b14](https://github.com/payloadcms/payload/commit/05d1b141b22f66cb9007f20f2ae9d8e31db4f32f))
- [#948](https://github.com/payloadcms/payload/issues/948) ([8df9ee7](https://github.com/payloadcms/payload/commit/8df9ee7b2dfcb2f77f049d02788a5c60c45f8c12))
- [#981](https://github.com/payloadcms/payload/issues/981) ([d588843](https://github.com/payloadcms/payload/commit/d58884312132e109ae3f6619be2e0d7bab3f3111))
- accented label char sanitization for GraphQL ([#1080](https://github.com/payloadcms/payload/issues/1080)) ([888734d](https://github.com/payloadcms/payload/commit/888734dcdf775f416395f8830561c47235bb9019))
- children of conditional fields required in graphql schema ([#1055](https://github.com/payloadcms/payload/issues/1055)) ([29e82ec](https://github.com/payloadcms/payload/commit/29e82ec845f69bf5a09b682739e88529ebc53c16))
- ensures adding new media to upload works when existing doc does not exist ([5ae666b](https://github.com/payloadcms/payload/commit/5ae666b0e08b128bdf2d576428e8638c2b8c2ed8))
- implement the same word boundary search as the like query ([#1038](https://github.com/payloadcms/payload/issues/1038)) ([c3a0bd8](https://github.com/payloadcms/payload/commit/c3a0bd86254dfc3f49e46d4e41bdf717424ea342))
- reorder plugin wrapping ([#1051](https://github.com/payloadcms/payload/issues/1051)) ([cd8edba](https://github.com/payloadcms/payload/commit/cd8edbaa1faa5a94166396918089a01058a4e75e))
- require min 1 option in field schema validation ([#1082](https://github.com/payloadcms/payload/issues/1082)) ([d56882c](https://github.com/payloadcms/payload/commit/d56882cc20764b793049f20a91864c943e711375))
- update removing a relationship with null ([#1056](https://github.com/payloadcms/payload/issues/1056)) ([44b0073](https://github.com/payloadcms/payload/commit/44b0073834830a9d645a11bcafab3869b4eb1899))
- update removing an upload with null ([#1076](https://github.com/payloadcms/payload/issues/1076)) ([2ee4c7a](https://github.com/payloadcms/payload/commit/2ee4c7ad727b9311578d3049660de81c27dace55))

### Features

- cyrillic like query support ([#1078](https://github.com/payloadcms/payload/issues/1078)) ([b7e5828](https://github.com/payloadcms/payload/commit/b7e5828adc7bc6602da7992b073b005b30aa896f))
- duplicate copies all locales ([51c7770](https://github.com/payloadcms/payload/commit/51c7770b10c34a3e40520ca8d64beedc67693c5c))
- update operator type with contains ([#1045](https://github.com/payloadcms/payload/issues/1045)) ([482cbe7](https://github.com/payloadcms/payload/commit/482cbe71c7b1d39b665fb0b29a7a0b69f454180a))

## [1.0.30](https://github.com/payloadcms/payload/compare/v1.0.29...v1.0.30) (2022-08-30)

### Bug Fixes

- upload field validation not required ([#1025](https://github.com/payloadcms/payload/issues/1025)) ([689fa00](https://github.com/payloadcms/payload/commit/689fa008fb0b28fb92be4ca785a77f4c35ae16b2))

## [1.0.29](https://github.com/payloadcms/payload/compare/v1.0.28...v1.0.29) (2022-08-29)

### Bug Fixes

- [#953](https://github.com/payloadcms/payload/issues/953) ([a73c391](https://github.com/payloadcms/payload/commit/a73c391c2cecc3acf8dc3115b56c018f85d9bebf))

## [1.0.28](https://github.com/payloadcms/payload/compare/v1.0.27...v1.0.28) (2022-08-29)

### Bug Fixes

- incorrect field paths when nesting unnamed fields ([#1011](https://github.com/payloadcms/payload/issues/1011)) ([50b0303](https://github.com/payloadcms/payload/commit/50b0303ab39f0d0500c5e4116df95f02d1d7fff3)), closes [#976](https://github.com/payloadcms/payload/issues/976)
- relationship cell loading ([#1021](https://github.com/payloadcms/payload/issues/1021)) ([6a3cfce](https://github.com/payloadcms/payload/commit/6a3cfced9a6e0ef75b398ec663f908c725b10d1a))
- remove lazy loading of array and blocks ([4900fa7](https://github.com/payloadcms/payload/commit/4900fa799ffbeb70e689622b269dc04a67978552))
- require properties in blocks and arrays fields ([#1020](https://github.com/payloadcms/payload/issues/1020)) ([6bc6e7b](https://github.com/payloadcms/payload/commit/6bc6e7bb616bd9f28f2464d3e55e7a1d19a8e7f8))
- unpublish item will not crash the UI anymore ([#1016](https://github.com/payloadcms/payload/issues/1016)) ([0586d7a](https://github.com/payloadcms/payload/commit/0586d7aa7d0938df25492487aa073c2aa366e1e4))

### Features

- export more fields config types and validation type ([#989](https://github.com/payloadcms/payload/issues/989)) ([25f5d68](https://github.com/payloadcms/payload/commit/25f5d68b74b081c060ddf6f0405c9211f5da6b54))
- types custom components to allow any props ([#1013](https://github.com/payloadcms/payload/issues/1013)) ([3736755](https://github.com/payloadcms/payload/commit/3736755a12cf5bbaaa916a5c0363026318a60823))
- validate relationship and upload ids ([#1004](https://github.com/payloadcms/payload/issues/1004)) ([d727fc8](https://github.com/payloadcms/payload/commit/d727fc8e2467e3f438ea6b1d2031e0657bffd183))

## [1.0.27](https://github.com/payloadcms/payload/compare/v1.0.26...v1.0.27) (2022-08-18)

### Bug Fixes

- react-sortable-hoc dependency instead of dev dependency ([4ef6801](https://github.com/payloadcms/payload/commit/4ef6801230cb0309a9d20dd092f8a3372f75f9ca))

## [1.0.26](https://github.com/payloadcms/payload/compare/v1.0.25...v1.0.26) (2022-08-18)

### Bug Fixes

- missing fields in rows on custom id collections ([#954](https://github.com/payloadcms/payload/issues/954)) ([39586d3](https://github.com/payloadcms/payload/commit/39586d3cdb01131b29f1f8f7346086d2bc9903c1))

### Features

- adds more prismjs syntax highlighting options for code blocks ([#961](https://github.com/payloadcms/payload/issues/961)) ([f45d5a0](https://github.com/payloadcms/payload/commit/f45d5a0421117180f85f8e3cd86f835c13ac6d16))
- enable reordering of hasMany relationship and select fields ([#952](https://github.com/payloadcms/payload/issues/952)) ([38a1a38](https://github.com/payloadcms/payload/commit/38a1a38c0c52403083458619b2f9b58044c5c0ea))

## [1.0.25](https://github.com/payloadcms/payload/compare/v1.0.24...v1.0.25) (2022-08-17)

### Bug Fixes

- [#568](https://github.com/payloadcms/payload/issues/568) ([a3edbf4](https://github.com/payloadcms/payload/commit/a3edbf4fef5efd8293cb4d6139b2513441cb741e))

### Features

- add new pickerAppearance option 'monthOnly' ([566c6ba](https://github.com/payloadcms/payload/commit/566c6ba3a9beb13ea9437844313ec6701effce27))
- custom api endpoints ([11d8fc7](https://github.com/payloadcms/payload/commit/11d8fc71e8bdb62c6755789903702b0ee257b448))

## [1.0.24](https://github.com/payloadcms/payload/compare/v1.0.23...v1.0.24) (2022-08-16)

### Bug Fixes

- [#939](https://github.com/payloadcms/payload/issues/939) ([b1a1575](https://github.com/payloadcms/payload/commit/b1a1575122f602ff6ba77973ab2a67893d352487))
- create indexes in nested fields ([f615abc](https://github.com/payloadcms/payload/commit/f615abc9b1d9000aff114010ef7f618ec70b6491))
- format graphql localization input type ([#932](https://github.com/payloadcms/payload/issues/932)) ([1c7445d](https://github.com/payloadcms/payload/commit/1c7445dc7fd883f6d5dcba532e9e048b1cff08f5))

### Features

- ensures you can query on blocks via specifying locale or not specifying locale ([078e8dc](https://github.com/payloadcms/payload/commit/078e8dcc51197133788294bac6fa380b192defbc))

## [1.0.23](https://github.com/payloadcms/payload/compare/v1.0.22...v1.0.23) (2022-08-15)

### Bug Fixes

- [#930](https://github.com/payloadcms/payload/issues/930) ([cbb1c84](https://github.com/payloadcms/payload/commit/cbb1c84be76146301ce41c4bdace647df83a4aac))
- dev:generate-types on all test configs ([#919](https://github.com/payloadcms/payload/issues/919)) ([145e1db](https://github.com/payloadcms/payload/commit/145e1db05db0e71149ba74e95764970dfdfd8b6b))

## [1.0.22](https://github.com/payloadcms/payload/compare/v1.0.21...v1.0.22) (2022-08-12)

### Bug Fixes

- [#905](https://github.com/payloadcms/payload/issues/905) ([b8421dd](https://github.com/payloadcms/payload/commit/b8421ddc0c9357de7a61bdc565fe2f9c4cf62681))
- ensures you can query on mixed schema type within blocks ([fba0847](https://github.com/payloadcms/payload/commit/fba0847f0fbc4c144ec85bb7a1ed3f2a953f5e05))

## [1.0.21](https://github.com/payloadcms/payload/compare/v1.0.20...v1.0.21) (2022-08-11)

### Bug Fixes

- ensures you can query on nested block fields ([ca852e8](https://github.com/payloadcms/payload/commit/ca852e8cb2d78982abeae0b5db4117f0261d8fed))
- saving multiple versions ([#918](https://github.com/payloadcms/payload/issues/918)) ([d0da3d7](https://github.com/payloadcms/payload/commit/d0da3d7962bbddfbdc1c553816409823bf6e1335))

## [1.0.20](https://github.com/payloadcms/payload/compare/v1.0.19...v1.0.20) (2022-08-11)

### Bug Fixes

- E11000 duplicate key error has no keyValue ([#916](https://github.com/payloadcms/payload/issues/916)) ([50972b9](https://github.com/payloadcms/payload/commit/50972b98a1d30c86d8b429ee5ba1c7dacac59f2c))
- number validation works with 0 min and max ([#906](https://github.com/payloadcms/payload/issues/906)) ([874c001](https://github.com/payloadcms/payload/commit/874c001d3b9712bce342c206e66f794a7e4938ba))

### Features

- field name validation ([#903](https://github.com/payloadcms/payload/issues/903)) ([2f4f075](https://github.com/payloadcms/payload/commit/2f4f075441768475f1202587abf578d5e4ae9f2a))

## [1.0.19](https://github.com/payloadcms/payload/compare/v1.0.18...v1.0.19) (2022-08-07)

### Features

- exposes static upload handlers ([a8d2e09](https://github.com/payloadcms/payload/commit/a8d2e099523cc7b99f94ae0cad574b41679c6e25))

## [1.0.18](https://github.com/payloadcms/payload/compare/v1.0.17...v1.0.18) (2022-08-06)

## [1.0.17](https://github.com/payloadcms/payload/compare/v1.0.16...v1.0.17) (2022-08-06)

### Bug Fixes

- [#898](https://github.com/payloadcms/payload/issues/898) ([209b02b](https://github.com/payloadcms/payload/commit/209b02b0699b17d060dab3cc09cdd06ad813c053))

## [1.0.16](https://github.com/payloadcms/payload/compare/v1.0.15...v1.0.16) (2022-08-05)

### Bug Fixes

- [#896](https://github.com/payloadcms/payload/issues/896) ([c32dfea](https://github.com/payloadcms/payload/commit/c32dfea35607991f7260c74121074d105f1b200c))

## [1.0.15](https://github.com/payloadcms/payload/compare/v1.0.14...v1.0.15) (2022-08-04)

## [1.0.14](https://github.com/payloadcms/payload/compare/v1.0.13...v1.0.14) (2022-08-04)

### Bug Fixes

- [#884](https://github.com/payloadcms/payload/issues/884) ([e9b3f3f](https://github.com/payloadcms/payload/commit/e9b3f3f060d134f3ed4b410adddb9d2593f6ee95))
- allows querying incomplete drafts in graphql ([8d968b7](https://github.com/payloadcms/payload/commit/8d968b7690c147685d569c334c108d8830ee7581))

### Features

- allows querying on rich text content ([3343adb](https://github.com/payloadcms/payload/commit/3343adb95257daae0be49daf6c768788292ef267))

## [1.0.13](https://github.com/payloadcms/payload/compare/v1.0.12...v1.0.13) (2022-08-03)

### Bug Fixes

- [#878](https://github.com/payloadcms/payload/issues/878) ([b8504ff](https://github.com/payloadcms/payload/commit/b8504ffb25310095097f35107e2b33dc648580cc))
- [#880](https://github.com/payloadcms/payload/issues/880) ([9c0c606](https://github.com/payloadcms/payload/commit/9c0c606b20e963a12d23b428c54c63d6a73be472))

### Features

- improves adjacent group styling ([0294c02](https://github.com/payloadcms/payload/commit/0294c02aedaa11a72240ab1dc7d6ccd2318de51f))

## [1.0.12](https://github.com/payloadcms/payload/compare/v1.0.11...v1.0.12) (2022-08-02)

### Bug Fixes

- ensures tabs can overflow on mobile when there are many ([663cae4](https://github.com/payloadcms/payload/commit/663cae4788f2726f3fa2430228706be63b7e642b))
- unique index creation ([#867](https://github.com/payloadcms/payload/issues/867)) ([c175476](https://github.com/payloadcms/payload/commit/c175476e74b31ea1fbc4a250fa8d23953d13e541))

## [1.0.11](https://github.com/payloadcms/payload/compare/v1.0.10...v1.0.11) (2022-07-28)

### Bug Fixes

- ensures when initial values changes, field value is updated ([858b1af](https://github.com/payloadcms/payload/commit/858b1afa546db68416d625a7ab970c9693d0595e))

## [1.0.10](https://github.com/payloadcms/payload/compare/v1.0.9...v1.0.10) (2022-07-27)

### Bug Fixes

- [#806](https://github.com/payloadcms/payload/issues/806), allow partial word matches using 'like' operator ([c96985b](https://github.com/payloadcms/payload/commit/c96985be0c14fcff768e036de96ebef3caa24d1c))
- [#836](https://github.com/payloadcms/payload/issues/836) ([84611af](https://github.com/payloadcms/payload/commit/84611aff2c9e0b1a1e721a72e9d3fc0740f10aff))
- accesses payload config correctly in gql refresh resolver ([d5e88cc](https://github.com/payloadcms/payload/commit/d5e88cc1a93ee8f93ee2eb75ab1690281f266f6a))
- email not always loading while viewing auth collections ([36e9acc](https://github.com/payloadcms/payload/commit/36e9acc637c4a706f0d3d07fbfb88e9afdccc2da))
- ensures collapsible preferences are retained through doc save ([61f0e8e](https://github.com/payloadcms/payload/commit/61f0e8ea9fd574fc40186f63c0016da150610d70))
- id now properly required in graphql findByID operation ([5dc7caf](https://github.com/payloadcms/payload/commit/5dc7caf35689d3f5cd71b9b2759edcb9b7eaadc5))
- set overflow payload modal container to auto ([cfb5540](https://github.com/payloadcms/payload/commit/cfb5540e64ccc016a4ef408a71b9aaf3d219b0fc))
- trim trailing whitespaces of email in login ([8feed39](https://github.com/payloadcms/payload/commit/8feed39fb92f2e194ae628b090cbb84d802586b6))

### Features

- greatly enhances performance by using dataloader pattern to batch populations ([c5bcd1e](https://github.com/payloadcms/payload/commit/c5bcd1e3412087249a2a3d98830a1b69e33736a0))
- significantly improves complex GraphQL query performance ([5d57bfa](https://github.com/payloadcms/payload/commit/5d57bfa4382470d2a171dcac3743523c930e3a3f))

## [1.0.9](https://github.com/payloadcms/payload/compare/v1.0.8...v1.0.9) (2022-07-21)

### Bug Fixes

- avoid assuming Email will be present on JWT token. Using ID instead as email might not be in if using disableLocalStrategy ([#789](https://github.com/payloadcms/payload/issues/789)) ([3b4d5af](https://github.com/payloadcms/payload/commit/3b4d5afd41f898c06c5d0f2b96ce0478c27d0976))
- enable index creation from schema ([#791](https://github.com/payloadcms/payload/issues/791)) ([2a1f387](https://github.com/payloadcms/payload/commit/2a1f387bcc071730692b5eadadf01a91d7a1f5d4))
- graphql gen logging output ([#795](https://github.com/payloadcms/payload/issues/795)) ([8a81d0b](https://github.com/payloadcms/payload/commit/8a81d0b2746b727784280704aab26b0aed3a757d))
- sharpens radio input edges by replacing box-shadow trick with border property ([#768](https://github.com/payloadcms/payload/issues/768)) ([e2c366f](https://github.com/payloadcms/payload/commit/e2c366f5363aa88b29a1b90688f75a1da0c2cca8))

### Features

- pass payload and names to custom auth strategies ([#781](https://github.com/payloadcms/payload/issues/781)) ([3a3026c](https://github.com/payloadcms/payload/commit/3a3026cd637c1274fdf6e4c4cba4f30a202e1ff7))
- use provided auth strategy name or strategy.name ([#797](https://github.com/payloadcms/payload/issues/797)) ([f22f56e](https://github.com/payloadcms/payload/commit/f22f56e73c979ee3e1b165b327b1bcf6e1de6eda))

## [1.0.8](https://github.com/payloadcms/payload/compare/v1.0.7...v1.0.8) (2022-07-20)

### Bug Fixes

- await field hooks recursively ([893772e](https://github.com/payloadcms/payload/commit/893772ebd8b3d565f9c62d83ca0fa131b9d59970))
- potential solution for [#756](https://github.com/payloadcms/payload/issues/756) ([b987cb8](https://github.com/payloadcms/payload/commit/b987cb8dc4774fbcc11b71661f2c4d25208f7de2))

### Features

- export PayloadRequest ([66c820c](https://github.com/payloadcms/payload/commit/66c820c863e7aeaa9050c0a0964256d6878af9d9))
- improves generated types by removing unnecessary optional properties ([#784](https://github.com/payloadcms/payload/issues/784)) ([6f748f1](https://github.com/payloadcms/payload/commit/6f748f1adb78a70c9e5dba6cedcf1e2cdd55498a))

## [1.0.7](https://github.com/payloadcms/payload/compare/v1.0.6...v1.0.7) (2022-07-19)

## [1.0.6](https://github.com/payloadcms/payload/compare/v1.0.5...v1.0.6) (2022-07-19)

### Features

- improves initAsync pattern ([428edb0](https://github.com/payloadcms/payload/commit/428edb05c4d8805bb2c4fb98f51e57eed2926374))

## [1.0.5](https://github.com/payloadcms/payload/compare/v1.0.4...v1.0.5) (2022-07-19)

### Features

- adds initAsync ([b4ffa22](https://github.com/payloadcms/payload/commit/b4ffa228858e584b3a177b0b096077a5c660b892))

## [1.0.4](https://github.com/payloadcms/payload/compare/v0.20.1...v1.0.4) (2022-07-19)

### Features

- Updated UI: Dark Mode
- Updated UI: Collapsibles ([60bfb1c](https://github.com/payloadcms/payload/commit/60bfb1c3b801c89de055d11cee50a1b51e864b7b))
- Updated UI: Tabs field ([68e7c41](https://github.com/payloadcms/payload/commit/68e7c41fdc07df04dcc3caaf486d2d596354039d))
- Updated UI: Styling Revamp and responsive improvements
- More maintainable colors via CSS vars
- Improved test coverage through granular Payload configs
- Introduction of E2E tests through Playwright
- allow clear select value ([#735](https://github.com/payloadcms/payload/issues/735)) ([3132d35](https://github.com/payloadcms/payload/commit/3132d35e27f3c1037aeb3d1801e13df2e992e98b))

### BREAKING CHANGES

We have removed our reliance on SCSS variables like color and font, replacing them instead with CSS variables wherever possible.

Due to this change, the `admin.scss` functionality has become obsolete, and overriding SCSS variables is not longer needed or supported. If you want to customize CSS, you can still do so, but via the `admin.css` property instead.

## [0.19.2](https://github.com/payloadcms/payload/compare/v0.19.1...v0.19.2) (2022-07-11)

### Bug Fixes

- ensures only plain objects are merged within incoming configs ([2c66ad8](https://github.com/payloadcms/payload/commit/2c66ad86898c28da32b1714821c2ea8fe8e17868))

### Features

- :tada: [Extensible Authentication Strategies](https://github.com/payloadcms/payload/discussions/290)!
- add afterMe afterLogout and afterRefresh ([4055908](https://github.com/payloadcms/payload/commit/4055908bc885ec1b2d69817a9937e4591d099fa1))
- add preMiddleware and postMiddleware, deprecate middleware ([e806437](https://github.com/payloadcms/payload/commit/e8064371b01b4e66d3b1af980e71364714bf3d5b))
- better types useAuth and custom provider components ([38b52bf](https://github.com/payloadcms/payload/commit/38b52bf67b0d1545bb8ee627f3b6140e27887099))

## [0.19.1](https://github.com/payloadcms/payload/compare/v0.19.0...v0.19.1) (2022-07-09)

### Bug Fixes

- ensures duplicative relationship options are not present ([#732](https://github.com/payloadcms/payload/issues/732)) ([ce1c99b](https://github.com/payloadcms/payload/commit/ce1c99b01c0b615401d618bd1894450114cc1f4c))

# [0.19.0](https://github.com/payloadcms/payload/compare/v0.18.5...v0.19.0) (2022-07-08)

### BREAKING CHANGES

- relationship fields with access control preventing read of relation will return id instead of null ([#644](https://github.com/payloadcms/payload/pull/644))

### Bug Fixes

- allow passing of autoIndex mongoose connectionOptions ([#722](https://github.com/payloadcms/payload/issues/722)) ([567d8c1](https://github.com/payloadcms/payload/commit/567d8c19bff05c4d5edfcff1f04ff5e7804412ce))
- copyfiles cross platform ([#712](https://github.com/payloadcms/payload/issues/712)) ([67331eb](https://github.com/payloadcms/payload/commit/67331eb975c57897236466bef109a9559ff0d1a0))
- ensures auth/me relations in gql can be queried ([01bc1fe](https://github.com/payloadcms/payload/commit/01bc1fef1e498038457b9454fc0969c2a1fe4601))
- ensures old data from arrays is not persisted ([d9ef803](https://github.com/payloadcms/payload/commit/d9ef803d203c03a161dedff7076381ed944cf8d6))
- relationship field disabled from access control in related collections ([#644](https://github.com/payloadcms/payload/issues/644)) ([91e33d1](https://github.com/payloadcms/payload/commit/91e33d1c1cf97d3f8512caea72dc1012969b84bb))

### Features

- allow clearing DatePicker value ([#641](https://github.com/payloadcms/payload/issues/641)) ([9fd171b](https://github.com/payloadcms/payload/commit/9fd171b26db5e3aaa6ade706f02c9697e1d785f3))
- File argument in create/update operation ([#708](https://github.com/payloadcms/payload/issues/708)) ([f3b7dcf](https://github.com/payloadcms/payload/commit/f3b7dcff57961e0c6a5b1536de23b7fe6fa035cf))
- graphql schema output ([#730](https://github.com/payloadcms/payload/issues/730)) ([ad43cbc](https://github.com/payloadcms/payload/commit/ad43cbc808572f15157e4e52d211253c63012d7f))

## [0.18.5](https://github.com/payloadcms/payload/compare/v0.18.4...v0.18.5) (2022-06-29)

### Bug Fixes

- empty cell data renders in list ([#699](https://github.com/payloadcms/payload/issues/699)) ([b6b0ffb](https://github.com/payloadcms/payload/commit/b6b0ffb674ca6d1568981ab110013e66c678270f))
- icon appears above select field's option list ([#685](https://github.com/payloadcms/payload/issues/685)) ([c78d774](https://github.com/payloadcms/payload/commit/c78d77446a6a8fd1e85f8c094f751dfc1f8b0530))

## [0.18.4](https://github.com/payloadcms/payload/compare/v0.18.3...v0.18.4) (2022-06-24)

## [0.18.3](https://github.com/payloadcms/payload/compare/v0.18.2...v0.18.3) (2022-06-24)

### Bug Fixes

- [#670](https://github.com/payloadcms/payload/issues/670), max tokenExpiration ([918062d](https://github.com/payloadcms/payload/commit/918062de2fba371068efc62a989a93ee07fd4c17))

## [0.18.2](https://github.com/payloadcms/payload/compare/v0.18.1...v0.18.2) (2022-06-24)

### Features

- telemetry ([1c37ec3](https://github.com/payloadcms/payload/commit/1c37ec39027c73e57ff53db58eca94d485d1fa14))

## [0.18.1](https://github.com/payloadcms/payload/compare/v0.18.0...v0.18.1) (2022-06-21)

### Bug Fixes

- [#671](https://github.com/payloadcms/payload/issues/671), password reset broken ([3d5ed93](https://github.com/payloadcms/payload/commit/3d5ed93fcea8a44d70aa6d46184fa7a50372cf88))

# [0.18.0](https://github.com/payloadcms/payload/compare/v0.17.3...v0.18.0) (2022-06-14)

### Bug Fixes

- custom fields values resetting in ui ([#626](https://github.com/payloadcms/payload/issues/626)) ([f2bf239](https://github.com/payloadcms/payload/commit/f2bf2399fa34c49b3b68be55257908b0f8733962))
- me auth route breaks with query params ([#648](https://github.com/payloadcms/payload/issues/648)) ([a1fe17d](https://github.com/payloadcms/payload/commit/a1fe17d05da57a6fc3ab933d064289fdcd7bf280))

### Features

- adds timestamps to generated collection types if enabled ([#604](https://github.com/payloadcms/payload/issues/604)) ([af6479b](https://github.com/payloadcms/payload/commit/af6479bf34128ee1c64f534778d6151fdc15f4f6))
- enable webpack filesystem cache in dev ([#621](https://github.com/payloadcms/payload/issues/621)) ([44c1232](https://github.com/payloadcms/payload/commit/44c12325b4e47eed26c70047c4e594650bcf2648))

## [0.17.3](https://github.com/payloadcms/payload/compare/v0.17.2...v0.17.3) (2022-06-08)

### Bug Fixes

- duplicate objects in array fields in validate data and siblingData ([#599](https://github.com/payloadcms/payload/issues/599)) ([20bbda9](https://github.com/payloadcms/payload/commit/20bbda95c67efb985f08b0380c6f21c13068a8b5))
- ensures unflattening locales only happens if config specifies locales ([c18cc23](https://github.com/payloadcms/payload/commit/c18cc23c71bf8147a0cebed8415642c81f38eb0f))

## [0.17.2](https://github.com/payloadcms/payload/compare/v0.17.1...v0.17.2) (2022-05-24)

### Bug Fixes

- [#576](https://github.com/payloadcms/payload/issues/576), graphql where on hasMany relationship not working ([#582](https://github.com/payloadcms/payload/issues/582)) ([20d251f](https://github.com/payloadcms/payload/commit/20d251fd5dabd06f8d58ffcd5acec4dbd64ee515))
- adds optional chaining to safely read drafts setting on versions ([#577](https://github.com/payloadcms/payload/issues/577)) ([982b3f0](https://github.com/payloadcms/payload/commit/982b3f0582d9f64bd560e96b0df3cc505cc86a2a))
- passes required prop for select field ([#579](https://github.com/payloadcms/payload/issues/579)) ([734e905](https://github.com/payloadcms/payload/commit/734e905c186ebf96ff659008cb240f5adaa2b5b5))

## [0.17.1](https://github.com/payloadcms/payload/compare/v0.17.0...v0.17.1) (2022-05-17)

### Bug Fixes

- only localizes schema if both field and top-level config are enabled ([e1a5547](https://github.com/payloadcms/payload/commit/e1a5547fea065f5590930cbeb6d07bf59d62d21d))

# [0.17.0](https://github.com/payloadcms/payload/compare/v0.16.4...v0.17.0) (2022-05-16)

### Bug Fixes

- apply field condition to custom components ([#560](https://github.com/payloadcms/payload/issues/560)) ([1dfe2b8](https://github.com/payloadcms/payload/commit/1dfe2b892947411ff5295f5818befe28c4972915))
- prevent changing order of readOnly arrays ([#563](https://github.com/payloadcms/payload/issues/563)) ([16b7edb](https://github.com/payloadcms/payload/commit/16b7edbc9782dcfb3bef77f1ff312e041d66922c))

## [0.16.4](https://github.com/payloadcms/payload/compare/v0.16.3...v0.16.4) (2022-05-06)

### Bug Fixes

- fields in groups causing console error in browser ([#553](https://github.com/payloadcms/payload/issues/553)) ([78edac6](https://github.com/payloadcms/payload/commit/78edac684e54d335b15303d8348c8abcb2bba716))
- save resized image file when equal to upload size ([#555](https://github.com/payloadcms/payload/issues/555)) ([46f4bc2](https://github.com/payloadcms/payload/commit/46f4bc2a077ce668e9b30c187092b9b0c6d83f86))

## [0.16.3](https://github.com/payloadcms/payload/compare/v0.16.2...v0.16.3) (2022-05-04)

### Bug Fixes

- rare bug while merging locale data ([47c37e0](https://github.com/payloadcms/payload/commit/47c37e015300be4f9d5d4387f26a0adb39b8379c))

## [0.16.2](https://github.com/payloadcms/payload/compare/v0.16.1...v0.16.2) (2022-05-02)

### Bug Fixes

- checkbox defaultValues and more typing of sanitize ([#550](https://github.com/payloadcms/payload/issues/550)) ([1e4a68f](https://github.com/payloadcms/payload/commit/1e4a68f76eeaab58ced0cc500223a1b86d66668e))

### Features

- exposes findMany argument to afterRead hooks to discern between find and findByID ([b3832e2](https://github.com/payloadcms/payload/commit/b3832e21c91fa5d52067cfc24a0b4f8aa6e178ec))
- optimizes field operations ([18489fa](https://github.com/payloadcms/payload/commit/18489facebe5d7b0abc87dcc30fae28510b6bb19))

## [0.16.1](https://github.com/payloadcms/payload/compare/v0.16.0...v0.16.1) (2022-04-29)

### Features

- exposes payload within server-side validation args ([e46b942](https://github.com/payloadcms/payload/commit/e46b94225957bba7758a0a2c22776c44a2d2d633))

# [0.16.0](https://github.com/payloadcms/payload/compare/v0.15.13...v0.16.0) (2022-04-29)

### Bug Fixes

- file upload safely handles missing mimeTypes ([#540](https://github.com/payloadcms/payload/issues/540)) ([bf48fdf](https://github.com/payloadcms/payload/commit/bf48fdf18961a2e57bcc5aae73de4c569e97e42b))

### Features

- allow subfield readOnly to override parent readOnly ([#546](https://github.com/payloadcms/payload/issues/546)) ([834f4c2](https://github.com/payloadcms/payload/commit/834f4c270020bf32852c00a3abbb908853689006))
- allows defaultValue to accept async function to calculate defaultValue ([#547](https://github.com/payloadcms/payload/issues/547)) ([e297eb9](https://github.com/payloadcms/payload/commit/e297eb90907d933524d220255d5f8dc4276358c5))

## [0.15.13](https://github.com/payloadcms/payload/compare/v0.15.12...v0.15.13) (2022-04-26)

## [0.15.12](https://github.com/payloadcms/payload/compare/v0.15.11...v0.15.12) (2022-04-26)

### Bug Fixes

- ensures adding array / block rows modifies form state ([8bdbd0d](https://github.com/payloadcms/payload/commit/8bdbd0dd418cd665441703fa4fd87becafd26170))

## [0.15.11](https://github.com/payloadcms/payload/compare/v0.15.10...v0.15.11) (2022-04-24)

### Bug Fixes

- improperly typed access control ([b99ec06](https://github.com/payloadcms/payload/commit/b99ec060cacf7a05c20ba0a05dd6ef6ab60df304))

## [0.15.10](https://github.com/payloadcms/payload/compare/v0.15.9...v0.15.10) (2022-04-24)

### Bug Fixes

- block form-data bug ([3b70560](https://github.com/payloadcms/payload/commit/3b70560e2566de5294eb15945120ffd6f1f5f1c4))

## [0.15.9](https://github.com/payloadcms/payload/compare/v0.15.8...v0.15.9) (2022-04-20)

### Bug Fixes

- intermittent blocks UI issue ([3c1dfb8](https://github.com/payloadcms/payload/commit/3c1dfb88df8651b26cb1dbc102a34cd0aad722bc))

## [0.15.8](https://github.com/payloadcms/payload/compare/v0.15.7...v0.15.8) (2022-04-20)

### Bug Fixes

- ensure relationTo is valid in upload fields ([#533](https://github.com/payloadcms/payload/issues/533)) ([9e324be](https://github.com/payloadcms/payload/commit/9e324be0577447965ee2f87c3a3943cd4f0c0a1c))
- richtext editor input height ([#529](https://github.com/payloadcms/payload/issues/529)) ([3dcd8a2](https://github.com/payloadcms/payload/commit/3dcd8a24cb8cbb77aae82a1f841429e7149e3182))

## [0.15.7](https://github.com/payloadcms/payload/compare/v0.15.6...v0.15.7) (2022-04-12)

### Bug Fixes

- checkbox validation error positioning ([9af89b6](https://github.com/payloadcms/payload/commit/9af89b6c03bc4e82a0c3e353f0d53ec14a847ee2))

### Features

- sanitize defaultValue to false when field is required ([6f84c0a](https://github.com/payloadcms/payload/commit/6f84c0a86943e9d99edde21b1d448e7ece3dd83c))

## [0.15.6](https://github.com/payloadcms/payload/compare/v0.15.5...v0.15.6) (2022-04-06)

### Bug Fixes

- new up separate logger for generateTypes script ([cf54b33](https://github.com/payloadcms/payload/commit/cf54b336d17a79d775dd673c0eda361b356d159c))

## [0.15.5](https://github.com/payloadcms/payload/compare/v0.15.4...v0.15.5) (2022-04-06)

### Bug Fixes

- relationship component showing no results ([#508](https://github.com/payloadcms/payload/issues/508)) ([e1c6d9d](https://github.com/payloadcms/payload/commit/e1c6d9dd7d390c671edb0430d04aa0f194bf43e3))

## [0.15.4](https://github.com/payloadcms/payload/compare/v0.15.3...v0.15.4) (2022-04-05)

### Bug Fixes

- [#495](https://github.com/payloadcms/payload/issues/495), avoids appending version to id queries ([ab432a4](https://github.com/payloadcms/payload/commit/ab432a43dc568da0b7e65e275aed335d729600fa))
- default point validation allows not required and some edge cases ([29405bb](https://github.com/payloadcms/payload/commit/29405bbc0e3a5c3c1f3dadb2386a68e1fe159c42))

### Features

- allows like to search by many words, adds contain to match exact strings ([ec91757](https://github.com/payloadcms/payload/commit/ec91757257ed062c7743fca3d07d1b6af21cacb4))
- extended validation function arguments ([#494](https://github.com/payloadcms/payload/issues/494)) ([1b4b570](https://github.com/payloadcms/payload/commit/1b4b5707bfa731bedc5d9ca49ac9f425932b999c)), closes [#495](https://github.com/payloadcms/payload/issues/495)
- filter relationship options using filterOptions ([485991b](https://github.com/payloadcms/payload/commit/485991bd48c3512acca8dd94b3ab6c160bf1f153))
- **logging:** allow pino logger options to be passed into init ([6620a4f](https://github.com/payloadcms/payload/commit/6620a4f682f0a3169218dd83e1de315f95726287))
- support className config for row, block and array fields ([#504](https://github.com/payloadcms/payload/issues/504)) ([0461c21](https://github.com/payloadcms/payload/commit/0461c2109bea76742f94ae6f830c655ec67d1428))

## [0.15.3](https://github.com/payloadcms/payload/compare/v0.15.2...v0.15.3) (2022-04-04)

### Bug Fixes

- [#499](https://github.com/payloadcms/payload/issues/499), graphql row / ui field bug ([f4a2dff](https://github.com/payloadcms/payload/commit/f4a2dff892e6e8a6aa201c2a66b4db4fa2cd98b8))

## [0.15.2](https://github.com/payloadcms/payload/compare/v0.15.1...v0.15.2) (2022-04-04)

### Bug Fixes

- [#495](https://github.com/payloadcms/payload/issues/495), avoids appending version to id queries ([a703e05](https://github.com/payloadcms/payload/commit/a703e0582df3f4706ee051cf1752c79ff4b551ef))

## [0.15.1](https://github.com/payloadcms/payload/compare/v0.15.0...v0.15.1) (2022-03-28)

### Features

- builds a way to inject custom React providers into admin UI ([5a7e8a9](https://github.com/payloadcms/payload/commit/5a7e8a980be4e93f2503d8d007019948199a4867))
- export Plugin type from config types ([#491](https://github.com/payloadcms/payload/issues/491)) ([45f7011](https://github.com/payloadcms/payload/commit/45f70114e6664942228b46373843879c06ab8211))

# [0.15.0](https://github.com/payloadcms/payload/compare/v0.14.0...v0.15.0) (2022-03-16)

### BREAKING CHANGES

The GraphQL error response data object has moved from the top level to the extensions object.

Here is a previous example:

```js
{
 "message": "The following fields are invalid: location,",
 "data": [
  {
   "message": "This field requires two numbers",
   "field": "location"
  },
 ]
},
```

The new shape of GraphQL errors is as follows:

```js
"extensions": {
 "name": "ValidationError",
 "data": [
  {
   "message": "This field requires two numbers",
   "field": "location"
  },
 ]
}
```

### Bug Fixes

- [#422](https://github.com/payloadcms/payload/issues/422), prevents loading duplicative relationship options ([414679d](https://github.com/payloadcms/payload/commit/414679d86aac7ed94970a6eee14ff77b65f5c1d1))
- [#423](https://github.com/payloadcms/payload/issues/423), [#391](https://github.com/payloadcms/payload/issues/391) - prevents loading edit views until data initializes ([2884654](https://github.com/payloadcms/payload/commit/28846547afc7e7bb8accc5dbe9f3b98593f332fa))
- [#424](https://github.com/payloadcms/payload/issues/424), unable to clear localized property vals ([1a05fe4](https://github.com/payloadcms/payload/commit/1a05fe448c0755438dedc20c95d4a6a587912e2f))
- [#431](https://github.com/payloadcms/payload/issues/431) - relationship field not properly fetching option results ([6fab8bf](https://github.com/payloadcms/payload/commit/6fab8bfbef43d5da67cadc7dd61fd14b9b36bdc1))
- [#454](https://github.com/payloadcms/payload/issues/454), withCondition type usability ([56c16d5](https://github.com/payloadcms/payload/commit/56c16d5c16311b445662f715cc07e67d651e53a6))
- [#459](https://github.com/payloadcms/payload/issues/459) - in Relationship field to multiple collections, when the value is null, options are not populated ([#460](https://github.com/payloadcms/payload/issues/460)) ([a9b83c8](https://github.com/payloadcms/payload/commit/a9b83c87980df0a62823950e5ef31ad0de218f1a))
- [#461](https://github.com/payloadcms/payload/issues/461) ([08924a1](https://github.com/payloadcms/payload/commit/08924a1934ef257992381dfdded0cd9c7333e40c))
- [#464](https://github.com/payloadcms/payload/issues/464), graphql upload access control ([fd0629e](https://github.com/payloadcms/payload/commit/fd0629e93202dfaa399c753c59481b1cbd139bf6))
- adds key to RichText based on initialValue ([f710b8c](https://github.com/payloadcms/payload/commit/f710b8c4f3247156f64fb2b528a960bf808ef7ac))
- adjusts lte and gte types to match docs and codebase ([#480](https://github.com/payloadcms/payload/issues/480)) ([8fc4f7f](https://github.com/payloadcms/payload/commit/8fc4f7f8068cb8fcef13b1cfd6de7b4f74b5415f))
- allow jwt to work without csrf in config ([4048734](https://github.com/payloadcms/payload/commit/40487347e3f8bd03da440a73bec0ee491abbef85))
- awaits beforeDelete hooks ([609b871](https://github.com/payloadcms/payload/commit/609b871fa274e8b6d9eaf301e52ab42179aad9b7))
- config empty and sparse csrf is now allowed ([7e7b058](https://github.com/payloadcms/payload/commit/7e7b0589ef6c06941af3e7e3a24c7071d8b77a1a))
- ensures empty hasMany relationships save as empty arrays ([08b3e8f](https://github.com/payloadcms/payload/commit/08b3e8f18f0aa620d537f3258b2e080600e0f43e))
- ensures nested lists always render properly ([20e5dfb](https://github.com/payloadcms/payload/commit/20e5dfbb4ab8dab320d60772f5195c5faffe38d3))
- ensures overrideAccess is false if undefined while populating ([97f3178](https://github.com/payloadcms/payload/commit/97f31780051828a9d506eba3520a1390acb99a96))
- ensures rte upload is populated when only upload is enabled ([39438b8](https://github.com/payloadcms/payload/commit/39438b8460f853f64d84436eed49dde74cd207d2))
- import path for createRichTextRelationshipPromise ([586cd4d](https://github.com/payloadcms/payload/commit/586cd4d6af5485116ebb299a5af3d24f5baeaa2e))
- improperly typed local create method ([48aa27c](https://github.com/payloadcms/payload/commit/48aa27ce701e44561edf442ee6c248b007ecafcb))
- mobile styling to not found page ([d3f88a1](https://github.com/payloadcms/payload/commit/d3f88a1bd9aeb1551d64b9ed975da5e69e5821bd))
- new slate version types ([c5de01b](https://github.com/payloadcms/payload/commit/c5de01bfc48ca6793c1526499fe934d9ad8f0cc9))
- optimizes relationship input search querying ([7e69fcb](https://github.com/payloadcms/payload/commit/7e69fcbc7d89012a7caff6e0e9013a9ad8a62a14))
- prevents None from appearing in hasMany relationship select options ([cbf43fa](https://github.com/payloadcms/payload/commit/cbf43fa0d8ba50b7a9ef952f1693de6923068ffd))
- rare crash with link rte element ([f5535f6](https://github.com/payloadcms/payload/commit/f5535f613ac4d876d040be74b45e105e0f4775a8))
- rte upload field population ([8327b5a](https://github.com/payloadcms/payload/commit/8327b5aae505a189a5b9617c3485d646b5f8b517))
- type error in useField ([ef4e6d3](https://github.com/payloadcms/payload/commit/ef4e6d32a90215c07aa2c1e7217cf53558bfae97))

### Features

- :tada: versions, drafts, & autosave!
- [#458](https://github.com/payloadcms/payload/issues/458), provides field hooks with sibling data ([8e23a24](https://github.com/payloadcms/payload/commit/8e23a24f34ef7425bb4d43e96e869b255740c739))
- add before and after login components ([#427](https://github.com/payloadcms/payload/issues/427)) ([5591eea](https://github.com/payloadcms/payload/commit/5591eeafca1aa6e8abcc2d8276f7478e00b75ef2))
- add logMockCredentials email option ([ff33453](https://github.com/payloadcms/payload/commit/ff3345373630ca6913165284123a62269b3fa2c6))
- add pagination argument to optimize graphql relationships and use in local api ([#482](https://github.com/payloadcms/payload/issues/482)) ([647db51](https://github.com/payloadcms/payload/commit/647db5122e7b7be7f032d50ccf332780d8203369))
- adds a way to customize express.static options ([dbb3c50](https://github.com/payloadcms/payload/commit/dbb3c502227597ef4d04c9e5c8db6d2f51a8aac4))
- adds admin.upload.collections[collection-name].fields to the RTE to save specific data on upload elements ([3adf44a](https://github.com/payloadcms/payload/commit/3adf44a24162e5adbcebdb0ca7d0d460d23c57eb))
- adds indentation controls to rich text ([7df50f9](https://github.com/payloadcms/payload/commit/7df50f9bf9d4867e65bdd8cebdf43e0ab1737a63))
- adds originalDoc to field access control ([c979513](https://github.com/payloadcms/payload/commit/c9795133b376d8159457a0a38784d0b53a549061))
- adds path to GraphQL errors ([#457](https://github.com/payloadcms/payload/issues/457)) ([ad98b29](https://github.com/payloadcms/payload/commit/ad98b293983016db3c730112c9d2387de7bacb34))
- adds recursion to richText field to populate relationship and upload nested fields ([42af22c](https://github.com/payloadcms/payload/commit/42af22c2a10de44555bfedf902e7b4a4c9b25d6b))
- allow empty string radio and select option values ([#479](https://github.com/payloadcms/payload/issues/479)) ([f14e187](https://github.com/payloadcms/payload/commit/f14e187545b759ac4623189d5e31f25382728cc0))
- allows access control to prevent reading of drafts ([c38470c](https://github.com/payloadcms/payload/commit/c38470c7b2119cec6ff9a3efc89f087a5999bb66))
- allows global access control to return query constraints ([c0150ae](https://github.com/payloadcms/payload/commit/c0150ae8465777a2be1b6bc496a5be30cf478f42))
- allows select input to receive new options ([#435](https://github.com/payloadcms/payload/issues/435)) ([500fb1c](https://github.com/payloadcms/payload/commit/500fb1c5c41a55d35c41173d50a976388fd0bd1b))
- builds a way for multipart/form-data reqs to retain non-string values ([4efc2cf](https://github.com/payloadcms/payload/commit/4efc2cf71c8ec4c452fea0febfd1156b37868739))
- enhances rich text upload with custom field API ([0e4eb90](https://github.com/payloadcms/payload/commit/0e4eb906f2881dca518fea6b41e460bc57da9801))
- ensures field hooks run on all locales when locale=all ([c3f743a](https://github.com/payloadcms/payload/commit/c3f743af03bbde856dcd87114383f0b484c0b20f))
- exposes data arg within create and update access control ([73f418b](https://github.com/payloadcms/payload/commit/73f418bb5cadf73f683fe04ee94e4d24c8cfe96f))
- exposes FieldWithPath type for reuse ([df3a836](https://github.com/payloadcms/payload/commit/df3a83634fcb64724ef239600e3af4fc295fee4f))
- exposes useLocale for reuse ([bef0206](https://github.com/payloadcms/payload/commit/bef02062e769d1b0279c51af748f06d41c924c8a))
- improves adding rich text voids to RTE ([966c3c6](https://github.com/payloadcms/payload/commit/966c3c647198569ba06013481a3b6fa9042b058d))
- improves relationship field performance ([13318ff](https://github.com/payloadcms/payload/commit/13318ff3608a6be3dc7b86cc4e97155b26ef9df6))
- improves rich text link ([2e9a4c7](https://github.com/payloadcms/payload/commit/2e9a4c7d717e3a08b2982b8c49eb358baf23da17))
- indexes filenames ([07c8ac0](https://github.com/payloadcms/payload/commit/07c8ac08e21689cc6a3a2a546e58cf544fb61dec))
  a79570c))
- rich text indentation ([2deed8b](https://github.com/payloadcms/payload/commit/2deed8b1464931c4bc76a288923b307cf04b6a4a))
- serverURL is no longer required ([#437](https://github.com/payloadcms/payload/issues/437)) ([dca90c4](https://github.com/payloadcms/payload/commit/dca90c4aa92dd0cc2084ba16249254c9259622c3))
- updates dependencies ([3ca3f53](https://github.com/payloadcms/payload/commit/3ca3f533d07b644fa8a3d077932860e9f12318c2))

## [0.14.31-beta.0](https://github.com/payloadcms/payload/compare/v0.14.0...v0.14.31-beta.0) (2022-03-10)

### Bug Fixes

- improves rich text link ([2e9a4c7](https://github.com/payloadcms/payload/commit/2e9a4c7d717e3a08b2982b8c49eb358baf23da17))
- improves adding rich text voids to RTE ([966c3c6](https://github.com/payloadcms/payload/commit/966c3c647198569ba06013481a3b6fa9042b058d))
- rare crash with link rte element ([f5535f6](https://github.com/payloadcms/payload/commit/f5535f613ac4d876d040be74b45e105e0f4775a8))
- ensures empty hasMany relationships save as empty arrays ([08b3e8f](https://github.com/payloadcms/payload/commit/08b3e8f18f0aa620d537f3258b2e080600e0f43e))
- [#422](https://github.com/payloadcms/payload/issues/422), prevents loading duplicative relationship options ([414679d](https://github.com/payloadcms/payload/commit/414679d86aac7ed94970a6eee14ff77b65f5c1d1))
- [#423](https://github.com/payloadcms/payload/issues/423), [#391](https://github.com/payloadcms/payload/issues/391) - prevents loading edit views until data initializes ([2884654](https://github.com/payloadcms/payload/commit/28846547afc7e7bb8accc5dbe9f3b98593f332fa))
- [#424](https://github.com/payloadcms/payload/issues/424), unable to clear localized property vals ([1a05fe4](https://github.com/payloadcms/payload/commit/1a05fe448c0755438dedc20c95d4a6a587912e2f))
- [#431](https://github.com/payloadcms/payload/issues/431) - relationship field not properly fetching option results ([6fab8bf](https://github.com/payloadcms/payload/commit/6fab8bfbef43d5da67cadc7dd61fd14b9b36bdc1))
- adds key to RichText based on initialValue ([f710b8c](https://github.com/payloadcms/payload/commit/f710b8c4f3247156f64fb2b528a960bf808ef7ac))
- awaits beforeDelete hooks ([609b871](https://github.com/payloadcms/payload/commit/609b871fa274e8b6d9eaf301e52ab42179aad9b7))
- ensures multipart/form-data using \_payload flattens field data before sending ([ae44727](https://github.com/payloadcms/payload/commit/ae44727fb9734fc3801f7249fa9e78668311c09e))
- ensures nested lists always render properly ([20e5dfb](https://github.com/payloadcms/payload/commit/20e5dfbb4ab8dab320d60772f5195c5faffe38d3))
- ensures rte upload is populated when only upload is enabled ([39438b8](https://github.com/payloadcms/payload/commit/39438b8460f853f64d84436eed49dde74cd207d2))
- import path for createRichTextRelationshipPromise ([586cd4d](https://github.com/payloadcms/payload/commit/586cd4d6af5485116ebb299a5af3d24f5baeaa2e))
- improperly typed local create method ([48aa27c](https://github.com/payloadcms/payload/commit/48aa27ce701e44561edf442ee6c248b007ecafcb))
- mobile styling to not found page ([d3f88a1](https://github.com/payloadcms/payload/commit/d3f88a1bd9aeb1551d64b9ed975da5e69e5821bd))
- new slate version types ([c5de01b](https://github.com/payloadcms/payload/commit/c5de01bfc48ca6793c1526499fe934d9ad8f0cc9))
- rte upload field population ([8327b5a](https://github.com/payloadcms/payload/commit/8327b5aae505a189a5b9617c3485d646b5f8b517))
- type error in useField ([ef4e6d3](https://github.com/payloadcms/payload/commit/ef4e6d32a90215c07aa2c1e7217cf53558bfae97))
- [#464](https://github.com/payloadcms/payload/issues/464), graphql upload access control ([fd0629e](https://github.com/payloadcms/payload/commit/fd0629e93202dfaa399c753c59481b1cbd139bf6))
- ensures overrideAccess is false if undefined while populating ([97f3178](https://github.com/payloadcms/payload/commit/97f31780051828a9d506eba3520a1390acb99a96))

### Features

- :tada: versions, drafts, & autosave!
- adds originalDoc to field access control ([c979513](https://github.com/payloadcms/payload/commit/c9795133b376d8159457a0a38784d0b53a549061))
- [#458](https://github.com/payloadcms/payload/issues/458), provides field hooks with sibling data ([8e23a24](https://github.com/payloadcms/payload/commit/8e23a24f34ef7425bb4d43e96e869b255740c739))
- add before and after login components ([#427](https://github.com/payloadcms/payload/issues/427)) ([5591eea](https://github.com/payloadcms/payload/commit/5591eeafca1aa6e8abcc2d8276f7478e00b75ef2))
- add logMockCredentials email option ([ff33453](https://github.com/payloadcms/payload/commit/ff3345373630ca6913165284123a62269b3fa2c6))
- adds a way to customize express.static options ([dbb3c50](https://github.com/payloadcms/payload/commit/dbb3c502227597ef4d04c9e5c8db6d2f51a8aac4))
- adds admin.upload.collections[collection-name].fields to the RTE to save specific data on upload elements ([3adf44a](https://github.com/payloadcms/payload/commit/3adf44a24162e5adbcebdb0ca7d0d460d23c57eb))
- adds indentation controls to rich text ([7df50f9](https://github.com/payloadcms/payload/commit/7df50f9bf9d4867e65bdd8cebdf43e0ab1737a63))
- adds recursion to richText field to populate relationship and upload nested fields ([42af22c](https://github.com/payloadcms/payload/commit/42af22c2a10de44555bfedf902e7b4a4c9b25d6b))
- allows access control to prevent reading of drafts ([c38470c](https://github.com/payloadcms/payload/commit/c38470c7b2119cec6ff9a3efc89f087a5999bb66))
- allows global access control to return query constraints ([c0150ae](https://github.com/payloadcms/payload/commit/c0150ae8465777a2be1b6bc496a5be30cf478f42))
- allows select input to receive new options ([#435](https://github.com/payloadcms/payload/issues/435)) ([500fb1c](https://github.com/payloadcms/payload/commit/500fb1c5c41a55d35c41173d50a976388fd0bd1b))
- builds a way for multipart/form-data reqs to retain non-string values ([4efc2cf](https://github.com/payloadcms/payload/commit/4efc2cf71c8ec4c452fea0febfd1156b37868739))
- enhances rich text upload with custom field API ([0e4eb90](https://github.com/payloadcms/payload/commit/0e4eb906f2881dca518fea6b41e460bc57da9801))
- ensures field hooks run on all locales when locale=all ([c3f743a](https://github.com/payloadcms/payload/commit/c3f743af03bbde856dcd87114383f0b484c0b20f))
- exposes FieldWithPath type for reuse ([df3a836](https://github.com/payloadcms/payload/commit/df3a83634fcb64724ef239600e3af4fc295fee4f))
- exposes useLocale for reuse ([bef0206](https://github.com/payloadcms/payload/commit/bef02062e769d1b0279c51af748f06d41c924c8a))
- improves relationship field performance ([13318ff](https://github.com/payloadcms/payload/commit/13318ff3608a6be3dc7b86cc4e97155b26ef9df6))
- indexes filenames ([07c8ac0](https://github.com/payloadcms/payload/commit/07c8ac08e21689cc6a3a2a546e58cf544fb61dec))
- serverURL is no longer required ([#437](https://github.com/payloadcms/payload/issues/437)) ([dca90c4](https://github.com/payloadcms/payload/commit/dca90c4aa92dd0cc2084ba16249254c9259622c3))
- updates dependencies ([3ca3f53](https://github.com/payloadcms/payload/commit/3ca3f533d07b644fa8a3d077932860e9f12318c2))
- uses DocumentInfo to fetch and maintain doc versions ([8f30c3b](https://github.com/payloadcms/payload/commit/8f30c3bfefaa1530ac086aba22d4b8e6bac8f97d))
- exposes data arg within create and update access control ([73f418b](https://github.com/payloadcms/payload/commit/73f418bb5cadf73f683fe04ee94e4d24c8cfe96f))

# [0.14.0](https://github.com/payloadcms/payload/compare/v0.13.6...v0.14.0) (2022-01-03)

### Bug Fixes

- [#370](https://github.com/payloadcms/payload/issues/370), only performs password functions when auth enabled ([9738873](https://github.com/payloadcms/payload/commit/97388738def687f3b26eaf8de6b067f4d3758418))
- [#390](https://github.com/payloadcms/payload/issues/390), safari rich text link bug ([a16b99b](https://github.com/payloadcms/payload/commit/a16b99b0c87d55f768ed74ab35708a291fc7bbb0))
- [#393](https://github.com/payloadcms/payload/issues/393), ensures preview button gets up to date data ([2f47e39](https://github.com/payloadcms/payload/commit/2f47e39a9f765bd8ce437d4b7500a5b314a192a5))
- [#408](https://github.com/payloadcms/payload/issues/408) ([5c3cfa4](https://github.com/payloadcms/payload/commit/5c3cfa4c93767a5ead9e816bf11a000ebdac9761))
- [#408](https://github.com/payloadcms/payload/issues/408) ([e2c5d93](https://github.com/payloadcms/payload/commit/e2c5d93751cb1902d6dce2147953b97c2dc17939))
- 407 ([a09570c](https://github.com/payloadcms/payload/commit/a09570c78dc923f3553f36d726e5cfac925290a0))
- allows null in ImageSize width and height types ([ba79fd4](https://github.com/payloadcms/payload/commit/ba79fd42dbf20ba712a0632da9193fcc516c0257))
- cross-browser upload drag and drop ([4119eec](https://github.com/payloadcms/payload/commit/4119eec796794d6a026f34f8b097b379eb9895a0))
- ensures getDataByPath works ([140a3aa](https://github.com/payloadcms/payload/commit/140a3aa9eafa29b2a43bdfd8883c79c6ee4a93e4))
- ensures local findByID retains user ([05288ee](https://github.com/payloadcms/payload/commit/05288ee08c077019e4432bf385aeacc23a0643f3))
- ensures row count is set properly in block fields ([9e091af](https://github.com/payloadcms/payload/commit/9e091af67e944e6a15d1d1174a18cde6deda40d7))
- ensures searching relationships works with many pages of results ([961787d](https://github.com/payloadcms/payload/commit/961787d681882e5ab48bb676490555c93f5d4a2e))
- globals model typing ([da7c0c9](https://github.com/payloadcms/payload/commit/da7c0c984c1fb57038d620fc59bcd27972919ade))

### Features

- builds custom routes API, Before/After Dashboard and Nav custom components ([e337c62](https://github.com/payloadcms/payload/commit/e337c62ba179821c994404a2b693871b2401861b))
- exports custom text and select inputs ([52edb5b](https://github.com/payloadcms/payload/commit/52edb5b77f45e267c43a284c5591044ac4d726e7))
- exposes default Dashboard and Nav components for re-import ([ffe8e17](https://github.com/payloadcms/payload/commit/ffe8e17ac06c2fc89c3c51cab545df9756d3910b))

## [0.13.21-beta.0](https://github.com/payloadcms/payload/compare/v0.13.6...v0.13.21-beta.0) (2021-12-29)

### Bug Fixes

- [#370](https://github.com/payloadcms/payload/issues/370), only performs password functions when auth enabled ([9738873](https://github.com/payloadcms/payload/commit/97388738def687f3b26eaf8de6b067f4d3758418))
- [#390](https://github.com/payloadcms/payload/issues/390), safari rich text link bug ([a16b99b](https://github.com/payloadcms/payload/commit/a16b99b0c87d55f768ed74ab35708a291fc7bbb0))
- [#393](https://github.com/payloadcms/payload/issues/393), ensures preview button gets up to date data ([2f47e39](https://github.com/payloadcms/payload/commit/2f47e39a9f765bd8ce437d4b7500a5b314a192a5))
- [#408](https://github.com/payloadcms/payload/issues/408) ([5c3cfa4](https://github.com/payloadcms/payload/commit/5c3cfa4c93767a5ead9e816bf11a000ebdac9761))
- [#408](https://github.com/payloadcms/payload/issues/408) ([e2c5d93](https://github.com/payloadcms/payload/commit/e2c5d93751cb1902d6dce2147953b97c2dc17939))
- 407 ([a09570c](https://github.com/payloadcms/payload/commit/a09570c78dc923f3553f36d726e5cfac925290a0))
- allows null in ImageSize width and height types ([ba79fd4](https://github.com/payloadcms/payload/commit/ba79fd42dbf20ba712a0632da9193fcc516c0257))
- cross-browser upload drag and drop ([4119eec](https://github.com/payloadcms/payload/commit/4119eec796794d6a026f34f8b097b379eb9895a0))
- ensures getDataByPath works ([140a3aa](https://github.com/payloadcms/payload/commit/140a3aa9eafa29b2a43bdfd8883c79c6ee4a93e4))
- ensures local findByID retains user ([05288ee](https://github.com/payloadcms/payload/commit/05288ee08c077019e4432bf385aeacc23a0643f3))
- ensures row count is set properly in block fields ([9e091af](https://github.com/payloadcms/payload/commit/9e091af67e944e6a15d1d1174a18cde6deda40d7))
- ensures searching relationships works with many pages of results ([961787d](https://github.com/payloadcms/payload/commit/961787d681882e5ab48bb676490555c93f5d4a2e))
- globals model typing ([da7c0c9](https://github.com/payloadcms/payload/commit/da7c0c984c1fb57038d620fc59bcd27972919ade))

### Features

- builds custom routes API, Before/After Dashboard and Nav custom components ([e337c62](https://github.com/payloadcms/payload/commit/e337c62ba179821c994404a2b693871b2401861b))
- exports custom text and select inputs ([52edb5b](https://github.com/payloadcms/payload/commit/52edb5b77f45e267c43a284c5591044ac4d726e7))
- exposes default Dashboard and Nav components for re-import ([ffe8e17](https://github.com/payloadcms/payload/commit/ffe8e17ac06c2fc89c3c51cab545df9756d3910b))

## [0.13.6](https://github.com/payloadcms/payload/compare/v0.13.5...v0.13.6) (2021-11-30)

### Bug Fixes

- requires path in select, text, textarea, and upload components ([925a33e](https://github.com/payloadcms/payload/commit/925a33e5602336f6128188aaf73001dbd23bd411))

## [0.13.5](https://github.com/payloadcms/payload/compare/v0.13.4...v0.13.5) (2021-11-30)

### Bug Fixes

- select component rendered value ([ecabf13](https://github.com/payloadcms/payload/commit/ecabf130fd1b4b87c45196d4bdf675e76b20c9e3))

## [0.13.4](https://github.com/payloadcms/payload/compare/v0.13.3...v0.13.4) (2021-11-30)

### Bug Fixes

- passes hasMany through select component ([c77bf3a](https://github.com/payloadcms/payload/commit/c77bf3aa42d76b7a0649b28fee3fe5d4bd06dcf6))
- prevents uncontrolled text field component ([f0fd859](https://github.com/payloadcms/payload/commit/f0fd859347804fdf0d79bbe566412abaeec6ff6a))
- select component types ([7e2b259](https://github.com/payloadcms/payload/commit/7e2b2598167dc59b8982f635cb95eacf247abb43))
- threads props through textarea component ([0b13eda](https://github.com/payloadcms/payload/commit/0b13eda1e55299f7d6dfac2854acc04cff459396))

### Features

- abstracts input from text component ([615e369](https://github.com/payloadcms/payload/commit/615e3695f2e62ce5d8a43ccb84192aca57770af8))
- abstracts select component ([fa67137](https://github.com/payloadcms/payload/commit/fa671378c7282cda1ed6f46340a53622e3bc96dc))
- abstracts textarea component and improves event typing ([86480b7](https://github.com/payloadcms/payload/commit/86480b7482b2b9413272ab0f9d0a82cd5e2920b8))
- abstracts upload component ([f234f68](https://github.com/payloadcms/payload/commit/f234f68019f122bd46cb2af2e8f62cf07cd53c1b))

## [0.13.3](https://github.com/payloadcms/payload/compare/v0.13.2...v0.13.3) (2021-11-29)

### Bug Fixes

- upgrade sharp for prebuilt M1 binaries ([34f416a](https://github.com/payloadcms/payload/commit/34f416aace112013359351e17c4371c30303156f))

## [0.13.2](https://github.com/payloadcms/payload/compare/v0.13.1...v0.13.2) (2021-11-29)

### Bug Fixes

- [#373](https://github.com/payloadcms/payload/issues/373) ([727fbec](https://github.com/payloadcms/payload/commit/727fbeceb4b93936ca08d0ca48ac0d2beb1ce96e))

## [0.13.1](https://github.com/payloadcms/payload/compare/v0.13.0...v0.13.1) (2021-11-29)

### Bug Fixes

- ensures sorting by \_id instead of improper id ([ded891e](https://github.com/payloadcms/payload/commit/ded891e390a93f71963762c0200c97a0beec5cad))

### Features

- only adds list search query param if value is present ([d6d76d4](https://github.com/payloadcms/payload/commit/d6d76d4088a23ed43122333873ada6846c808d37))

# [0.13.0](https://github.com/payloadcms/payload/compare/v0.12.3...v0.13.0) (2021-11-26)

### Bug Fixes

- [#351](https://github.com/payloadcms/payload/issues/351) ([94c2b8d](https://github.com/payloadcms/payload/commit/94c2b8d80b046c067057d4ad089ed6a2edd656cf))
- [#358](https://github.com/payloadcms/payload/issues/358) - reuploading with existing filenames ([a0fb48c](https://github.com/payloadcms/payload/commit/a0fb48c9a37beceafc6f0638604e9946d0814635))
- allows sync or async preview urls ([da6e1df](https://github.com/payloadcms/payload/commit/da6e1df293ce46bc4d0c84645db61feea2881aa7))
- bug with relationship cell when no doc is available ([40b33d9](https://github.com/payloadcms/payload/commit/40b33d9f5e99285cb0de148dbe059259817fcad8))
  3839ef75151f))
- ensures richtext links retain proper formatting ([abf61d0](https://github.com/payloadcms/payload/commit/abf61d0734c09fd0fc5c5b827cb0631e11701f71))
- ensures that querying by relationship subpaths works ([37b21b0](https://github.com/payloadcms/payload/commit/37b21b07628e892e85c2cf979d9e2c8af0d291f7))
- ensures uploads can be fetched with CORS ([96421b3](https://github.com/payloadcms/payload/commit/96421b3d59a87f8a3d781005c02344fe5d3a607f))
- typing for collection description ([bb18e82](https://github.com/payloadcms/payload/commit/bb18e8250c5742d9615e5780c1cd02d33ecca3d0))
- updates field description type to include react nodes ([291c193](https://github.com/payloadcms/payload/commit/291c193ad4a9ec8ce9310cc63c714eba10eca102))

### Features

- :tada: :tada: builds a way to automatically generate types for collections and globals!.
- :tada: dramatically improves Payload types like local API methods and hooks to function as `generic`s
- adds relationship filter field ([463c4e6](https://github.com/payloadcms/payload/commit/463c4e60de8e647fca6268b826d826f9c6e45412))
- applies upload access control to all auto-generated image sizes ([051b7d4](https://github.com/payloadcms/payload/commit/051b7d45befc331af3f73a669b2bb6467505902f))
- azure cosmos compatibility ([6fd5ac2](https://github.com/payloadcms/payload/commit/6fd5ac2c082a5a5e6f510d781b2a2e12b7b62cb9))
- ensures update hooks have access to full original docs even in spite of access control ([b2c5b7e](https://github.com/payloadcms/payload/commit/b2c5b7e5752e829c7a53c054decceb43ec33065e))
- improves querying logic ([4c85747](https://github.com/payloadcms/payload/commit/4c8574784995b1cb1f939648f4d2158286089b3d))
- indexes filenames ([5d43262](https://github.com/payloadcms/payload/commit/5d43262f42e0529a44572f398aa1ec5fd7858286))
- renames useFieldType to useField ([0245747](https://github.com/payloadcms/payload/commit/0245747020c7c039b15d055f54a4548a364d047e))
- supports custom onChange handling in text, select, and upload fields ([4affdc3](https://github.com/payloadcms/payload/commit/4affdc3a9397d70f5baacdd12753c8fc8c7d8368))

## [0.12.3](https://github.com/payloadcms/payload/compare/v0.12.2...v0.12.3) (2021-10-23)

### Bug Fixes

- [#348](https://github.com/payloadcms/payload/issues/348), relationship options appearing twice in admin ui ([b4c15ed](https://github.com/payloadcms/payload/commit/b4c15ed3f3649ea6d157987571874fb8486ab3cb))
- ensures tooltips in email fields are positioned properly ([a0b38f6](https://github.com/payloadcms/payload/commit/a0b38f68322cd7a39ca6ae08e6ffb7f57aa62171))

## [0.12.2](https://github.com/payloadcms/payload/compare/v0.12.1...v0.12.2) (2021-10-21)

### Bug Fixes

- improves paste html formatting ([d443ea5](https://github.com/payloadcms/payload/commit/d443ea582cc60be367dd3edbdcb062af0786b8ee))

## [0.12.1](https://github.com/payloadcms/payload/compare/v0.12.0...v0.12.1) (2021-10-21)

### Bug Fixes

- rich text copy and paste now saves formatting properly ([9d7feb9](https://github.com/payloadcms/payload/commit/9d7feb9796e4b76e01f4ac2d0cb117bb091aa3d5))

# [0.12.0](https://github.com/payloadcms/payload/compare/v0.11.0...v0.12.0) (2021-10-21)

### Bug Fixes

- bug where field hooks and access control couuld potentially compete ([c35009f](https://github.com/payloadcms/payload/commit/c35009f14c9403e63727d4d77af51a449a5f7b4b))

### Features

- builds UI field ([edb723a](https://github.com/payloadcms/payload/commit/edb723a4fb8b4c353a9073cc7ec5f5cfd026cbe0))
- exposes withCondition for re-use ([c02e8f1](https://github.com/payloadcms/payload/commit/c02e8f14c74a2ab9a53b0d8fd81f1083bede594e))

## [0.11.2-beta.0](https://github.com/payloadcms/payload/compare/v0.11.0...v0.11.2-beta.0) (2021-10-21)

### Features

- exposes withCondition for re-use ([c02e8f1](https://github.com/payloadcms/payload/commit/c02e8f14c74a2ab9a53b0d8fd81f1083bede594e))

## [0.11.1-beta.0](https://github.com/payloadcms/payload/compare/v0.11.0...v0.11.1-beta.0) (2021-10-20)

### Features

- builds UI field ([edb723a](https://github.com/payloadcms/payload/commit/edb723a4fb8b4c353a9073cc7ec5f5cfd026cbe0))

# [0.11.0](https://github.com/payloadcms/payload/compare/v0.10.11...v0.11.0) (2021-10-20)

### Bug Fixes

- [#338](https://github.com/payloadcms/payload/issues/338), array / block fields with only nested array block fields break admin UI ([86e88d9](https://github.com/payloadcms/payload/commit/86e88d998fbc36d7ea2456dfbc685edadff107d3))
- [#341](https://github.com/payloadcms/payload/issues/341) - searching on multiple relationship collections ([3b99ded](https://github.com/payloadcms/payload/commit/3b99deda450fbbe4a9d05c28c9c485c466872097))
- [#343](https://github.com/payloadcms/payload/issues/343) - upload rte element crashes admin when no upload collection present ([914cca6](https://github.com/payloadcms/payload/commit/914cca6b926923bd238605856a7b7125c13244e1))
- make name required on field types ([#337](https://github.com/payloadcms/payload/issues/337)) ([b257e01](https://github.com/payloadcms/payload/commit/b257e01c8dea5d22172ce4f71e4124aecc39bba8))
- more strict field typing ([84f6a9d](https://github.com/payloadcms/payload/commit/84f6a9d659fd443545f3ba7adf9f6adab98452ca))
- per page now properly modifies search query ([fcd9c28](https://github.com/payloadcms/payload/commit/fcd9c2887175396bdedc051f3f30f1080d8c5953))
- properly types row field ([7d49302](https://github.com/payloadcms/payload/commit/7d49302ffa8207498e6e70255b3be84b3ac890c1))
- removes node 15 from CI ([a2df67e](https://github.com/payloadcms/payload/commit/a2df67eccd9ab6f8c9d4982bdade9b47186c2c82))
- use proper error code on webpack build failure ([2eb8154](https://github.com/payloadcms/payload/commit/2eb81546c3b4bf1804d25ccd5307af4855c4f750))

### Features

- adds dynamic url field to upload-enabled collections ([cc4d1fd](https://github.com/payloadcms/payload/commit/cc4d1fd045ed54c6a35c7104182e6fbeadb6dac4))
- adds safety checks while querying on id with bad values ([900f05e](https://github.com/payloadcms/payload/commit/900f05eefdc63978809a88a2e1474be08afff6c6))
- **admin:** initial per page component ([3715e01](https://github.com/payloadcms/payload/commit/3715e011c97c8e30174c35c502fa7db12bc84e2c))
- allows richText enter key break out functionality to be extended in custom elements ([ca91f47](https://github.com/payloadcms/payload/commit/ca91f47d325de5211f24000c7d90b10a8fdfc544))
- improves richtext link ([423ca01](https://github.com/payloadcms/payload/commit/423ca01ab1d5d07e2f5369d82928d6c7dad052b0))
- **per-page:** add pagination to admin config ([c132f2f](https://github.com/payloadcms/payload/commit/c132f2ff10b3efdb3854ec2d5a895120ccf22002))
- **per-page:** set and load from preferences ([d88ce2d](https://github.com/payloadcms/payload/commit/d88ce2d342b20c1601b1b58470c226a9826758b3))
- saves active list filters in URL, implements per-page control ([a6fc1fd](https://github.com/payloadcms/payload/commit/a6fc1fdc5838c3d17c5a8b6cbe9a46b86c89af71))

## [0.10.11](https://github.com/payloadcms/payload/compare/v0.10.10...v0.10.11) (2021-10-08)

### Bug Fixes

- bug with local API and not passing array / block data ([fd4fbe8](https://github.com/payloadcms/payload/commit/fd4fbe8c8b492445ab29d26d9648cff4e98d5708))

## [0.10.10](https://github.com/payloadcms/payload/compare/v0.10.9...v0.10.10) (2021-10-07)

### Bug Fixes

- deepObjectCopy returns Date object instead of empty object ([2711729](https://github.com/payloadcms/payload/commit/27117292f3a4e207d9705e79f82fb78f70985915))

## [0.10.9](https://github.com/payloadcms/payload/compare/v0.10.8...v0.10.9) (2021-10-05)

### Bug Fixes

- ensures field read access within login operation has id ([e3229c5](https://github.com/payloadcms/payload/commit/e3229c55f352a2f68bbea967f816badfd265dd02))

## [0.10.8](https://github.com/payloadcms/payload/compare/v0.10.7...v0.10.8) (2021-10-04)

### Bug Fixes

- ensures update field access control receives id ([ffab6c4](https://github.com/payloadcms/payload/commit/ffab6c46c1c267f46d1d4eb3fd8060a4e5fada4b))

## [0.10.7](https://github.com/payloadcms/payload/compare/v0.10.6...v0.10.7) (2021-10-04)

### Bug Fixes

- ensures non populated relationships still retain IDs ([a201109](https://github.com/payloadcms/payload/commit/a20110974d781e972831fa8a52a0839a613121f6))
- ensures relationship field access control receives id ([470d434](https://github.com/payloadcms/payload/commit/470d4345f9ccc7630dc55b40172937509475d534))

### Features

- add indexSortableField option to create indexes for sortable fields on all collections ([ad09782](https://github.com/payloadcms/payload/commit/ad097820bfe32b0a4ef428a37a78e5a569258ec6))

## [0.10.6](https://github.com/payloadcms/payload/compare/v0.10.5...v0.10.6) (2021-09-30)

### Bug Fixes

- allow debug in payload config ([65bf13d](https://github.com/payloadcms/payload/commit/65bf13d7c137eafdbbeadc1d36d26b7b8389088f))
- relationship + new slate incompatibility ([f422053](https://github.com/payloadcms/payload/commit/f42205307e33916fc3b139f6ee97eb66d5d0816a))

## [0.10.5](https://github.com/payloadcms/payload/compare/v0.10.4...v0.10.5) (2021-09-28)

### Bug Fixes

- ensures that fields within non-required groups are correctly not required ([1597055](https://github.com/payloadcms/payload/commit/15970550f7b00ce0527027c362a9550ff8ad5d2a))
- index creation on localized field parent ([23e8197](https://github.com/payloadcms/payload/commit/23e81971eb94fd5b991aedb02aab84931937ae37))
- pagination estimatedCount limited to near query ([73bd698](https://github.com/payloadcms/payload/commit/73bd69870c4ff8ae92053e77ef95cfae18c142b5))

### Features

- adds rich text editor upload element ([aa76950](https://github.com/payloadcms/payload/commit/aa769500c934f4dee51a24c0cfc0297c12b5ae47))
- updates slate, finishes rte upload ([08db431](https://github.com/payloadcms/payload/commit/08db431c0c4626a0d10f4e1c7bca29fa075eedc6))

## [0.10.4](https://github.com/payloadcms/payload/compare/v0.10.0...v0.10.4) (2021-09-22)

### Bug Fixes

- allows image resizing if either width or height is larger ([8661115](https://github.com/payloadcms/payload/commit/866111528377808009fa71595691e6a08ec77dc5))
- array objects now properly save IDs ([2b8f925](https://github.com/payloadcms/payload/commit/2b8f925e81c58f6aa010bf13a318236f211ea091))
- date field error message position ([03c0435](https://github.com/payloadcms/payload/commit/03c0435e3b3ecdfa0713e3e5026b80f8985ca290))
- properly types optional req in local findByID ([02e7fe3](https://github.com/payloadcms/payload/commit/02e7fe3f1f3763f32f100cf2e5a8596aa16f3bd9))

### Features

- defaults empty group fields to empty object ([8a890fd](https://github.com/payloadcms/payload/commit/8a890fdc15b646c24963a1ef7584237b1d3c5783))
- allows local update api to replace existing files with newly uploaded ones ([dbbff4c](https://github.com/payloadcms/payload/commit/dbbff4cfa41aa20077e47c8c7b87d4d00683c571))
- exposes Pill component for re-use ([7e8df10](https://github.com/payloadcms/payload/commit/7e8df100bbf86798de292466afd4c00c455ecb35))
- performance improvement while saving large docs ([901ad49](https://github.com/payloadcms/payload/commit/901ad498b47bcb8ae995ade18f2fc08cd33f0645))

# [0.10.0](https://github.com/payloadcms/payload/compare/v0.9.5...v0.10.0) (2021-09-09)

### Bug Fixes

- admin UI collection id is required ([dc96b90](https://github.com/payloadcms/payload/commit/dc96b90cba01756374dde5b91f7702e0a0c661aa))
- allow save of collection with an undefined point ([f80646c](https://github.com/payloadcms/payload/commit/f80646c5987db4c228b00beda9549259021c2a40))
- config validation correctly prevents empty strings for option values ([41e7feb](https://github.com/payloadcms/payload/commit/41e7febf6a21d2fff39a335c033d9e9582294147))
- ensures hooks run before access ([96629f1](https://github.com/payloadcms/payload/commit/96629f1f0100efdb9c5ad57c1a46add3c15ea65d))
- ensures proper order while transforming incoming and outgoing data ([c187da0](https://github.com/payloadcms/payload/commit/c187da00b1f18c66d9252a5a3e2029455d75b371))
- improve id type semantic and restrict possible types to text and number ([29529b2](https://github.com/payloadcms/payload/commit/29529b2c56d4af7c6abce113da2f7ce84f1dcc02))
- remove media directory to improve test run consistency ([d42d8f7](https://github.com/payloadcms/payload/commit/d42d8f76efcda7a24f2f50d60caf47b1027d81f6))
- sanitize custom id number types ([c7558d8](https://github.com/payloadcms/payload/commit/c7558d8652780e24479b39e5f2a08a49ffff3358))
- sort id columns ([114dc1b](https://github.com/payloadcms/payload/commit/114dc1b3fb9a1895e09671aca7a57fd5c7d84911))

### Features

- add config validation for collections with custom id ([fe1dc0b](https://github.com/payloadcms/payload/commit/fe1dc0b191e73f350b77a90887d8172bf76d46fd))
- add config validation for collections with custom id ([d0aaf4a](https://github.com/payloadcms/payload/commit/d0aaf4a4128ad585013c392bb608f586985b71ad))
- add point field type ([7504155](https://github.com/payloadcms/payload/commit/7504155e17a2881b7a60f49e610c062665b46d21))
- allows user to pass req through local findByID ([8675481](https://github.com/payloadcms/payload/commit/8675481343ef45fefc2eaaea939eda8ed0a2577f))
- frontend polish to point field ([64ad6a3](https://github.com/payloadcms/payload/commit/64ad6a30a56969127dfb592a7e0c8807e9f3d8f7))
- graphql support for custom id types ([bc2a6e1](https://github.com/payloadcms/payload/commit/bc2a6e15753c62d2041e9afded3f1ca040dbffa3))
- point field localization and graphql ([30f1750](https://github.com/payloadcms/payload/commit/30f17509ea9927d923ffd42c703adefc902b66ea))
- replace the collection idType option with an explicit id field ([4b70a12](https://github.com/payloadcms/payload/commit/4b70a1225f834ecd0aab50c6e92ad50572389962))
- support custom ids ([3cc921a](https://github.com/payloadcms/payload/commit/3cc921acc92e1b4a372468b644b7e676400d9c26))

## [0.9.5](https://github.com/payloadcms/payload/compare/v0.9.4...v0.9.5) (2021-08-23)

### Bug Fixes

- obscure conditional logic bug ([b0dc125](https://github.com/payloadcms/payload/commit/b0dc12560423af5083d36cfd16f464f08ab66d9d))
- windows compatible absolute paths for staticDir ([b21316b](https://github.com/payloadcms/payload/commit/b21316b6cc392c793614024648c5301c7e03c326))

## [0.9.4](https://github.com/payloadcms/payload/compare/v0.9.3...v0.9.4) (2021-08-06)

## [0.9.3](https://github.com/payloadcms/payload/compare/v0.9.2...v0.9.3) (2021-08-06)

### Bug Fixes

- args no longer optional in collection and global hooks ([a5ea0ff](https://github.com/payloadcms/payload/commit/a5ea0ff61945f3da106f0d9dbb6a90fb1d884061))

## [0.9.2](https://github.com/payloadcms/payload/compare/v0.9.1...v0.9.2) (2021-08-06)

### Bug Fixes

- row admin type ([deef520](https://github.com/payloadcms/payload/commit/deef5202c15301b685fe5efc8a6ff59b012ea1d4))

### Features

- allow completely disabling local file storage ([9661c6d](https://github.com/payloadcms/payload/commit/9661c6d40acc41d21eebc42b0cc1871f28d35a73))
- allows upload resizing to maintain aspect ratio ([dea54a4](https://github.com/payloadcms/payload/commit/dea54a4cccead86e6ffc9f20457f295e1c08405b))
- exposes auto-sized uploads on payload req ([9c8935f](https://github.com/payloadcms/payload/commit/9c8935fd51439627cccf3f6625236375f5909445))
- reduces group heading from h2 to h3 ([907f8fd](https://github.com/payloadcms/payload/commit/907f8fd94d7e6cfa7eac0040c134cc714f29800d))

## [0.9.1](https://github.com/payloadcms/payload/compare/v0.9.0...v0.9.1) (2021-08-03)

### Bug Fixes

- groups with failing conditions being incorrectly required on backend ([4cc0ea1](https://github.com/payloadcms/payload/commit/4cc0ea1d81cd7579cb330091eb111a27262ff031))
- relationship field access control in admin UI ([65db8d9](https://github.com/payloadcms/payload/commit/65db8d9fc2c8b556cc284966b9b69f5d6512aca5))

### Features

- exposes collection after read hook type ([01a191a](https://github.com/payloadcms/payload/commit/01a191a13967d98ebf57891efd21b2607804e4e3))

# [0.9.0](https://github.com/payloadcms/payload/compare/v0.8.2...v0.9.0) (2021-08-02)

### BREAKING CHANGES

- Due to greater plugin possibilities and performance enhancements, plugins themselves no longer accept a completely sanitized config. Instead, they accept a _validated_ config as-provided, but sanitization is now only performed after all plugins have been initialized. By config santitization, we refer to merging in default values and ensuring that the config has its full, required shape. What this now means for plugins is that within plugin code, deeply nested properties like `config.graphQL.mutations` will need to be accessed safely (optional chaining is great for this), because a user's config may not have defined `config.graphQL`. So, the only real breaking change here is are that plugins now need to safely access properties from an incoming config.

### Features

- removes sanitization of configs before plugins are instantiated ([8af3947](https://github.com/payloadcms/payload/commit/8af39472e19a26453647d1c1ab0bbce15db2c642))

## [0.8.2](https://github.com/payloadcms/payload/compare/v0.8.1...v0.8.2) (2021-08-02)

### Bug Fixes

- more advanced conditional logic edge cases ([33983de](https://github.com/payloadcms/payload/commit/33983deb3761813506348f8ff804a2117d1324ef))

### Features

- export error types ([12cba62](https://github.com/payloadcms/payload/commit/12cba62930b8d35b22e3a7a99cf06df29bd4964a))

## [0.8.1](https://github.com/payloadcms/payload/compare/v0.8.0...v0.8.1) (2021-07-29)

### BREAKING CHANGES

- If you have any plugins that are written in TypeScript, we have changed plugin types to make them more flexible. Whereas before you needed to take in a fully sanitized config, and return a fully sanitized config, we now have simplified that requirement so that you can write configs in your own plugins just as an end user of Payload can write their own configs.

Now, configs will be sanitized **_before_** plugins are executed **_as well as_** after plugins are executed.

So, where your plugin may have been typed like this before:

```ts
import { SanitizedConfig } from "payload/config";

const plugin = (config: SanitizedConfig): SanitizedConfig => {
  return {
    ...config,
  };
};
```

It can now be written like this:

```ts
import { Config } from "payload/config";

const plugin = (config: Config): Config => {
  return {
    ...config,
  };
};
```

### Features

- improves plugin writability ([a002b71](https://github.com/payloadcms/payload/commit/a002b7105f5c312e846c80032a350046db10236c))

# [0.8.0](https://github.com/payloadcms/payload/compare/v0.7.10...v0.8.0) (2021-07-28)

### BREAKING CHANGES

- There have been a few very minor, yet breaking TypeScript changes in this release. If you are accessing Payload config types from directly within the `dist` folder, like any of the following:

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

- ensures text component is always controlled ([c649362](https://github.com/payloadcms/payload/commit/c649362b95f1ddaeb47cb121b814ca30712dea86))

### Features

- revises naming conventions of config types ([5a7e5b9](https://github.com/payloadcms/payload/commit/5a7e5b921d7803ec2da8cc3dc8162c1dd6828ca0))

## [0.7.10](https://github.com/payloadcms/payload/compare/v0.7.9...v0.7.10) (2021-07-27)

### Bug Fixes

- jest debug testing ([a2fa30f](https://github.com/payloadcms/payload/commit/a2fa30fad2cd9b8ab6ac4f3905706b97d5663954))
- skipValidation logic ([fedeaea](https://github.com/payloadcms/payload/commit/fedeaeafc9607f7c21e40c2df44923056e5d460c))

### Features

- improves conditional logic performance and edge cases ([d43390f](https://github.com/payloadcms/payload/commit/d43390f2a4c5ebeb7b9b0f07e003816005efc761))

## [0.7.9](https://github.com/payloadcms/payload/compare/v0.7.8...v0.7.9) (2021-07-27)

### Bug Fixes

- missing richtext gutter ([4d1249d](https://github.com/payloadcms/payload/commit/4d1249dd03f441ee872e66437118c3e8703aaefc))

### Features

- add admin description to collections and globals ([4544711](https://github.com/payloadcms/payload/commit/4544711f0e4ea0e78570b93717a4bf213946d9b3))
- add collection slug to schema validation errors ([ebfb72c](https://github.com/payloadcms/payload/commit/ebfb72c8fa0723ec75922c6fa4739b48ee82b29f))
- add component support to collection and global description ([fe0098c](https://github.com/payloadcms/payload/commit/fe0098ccd9b3477b47985222659a0e3fc2e7bb3b))
- add component support to field description ([e0933f6](https://github.com/payloadcms/payload/commit/e0933f612a70af0a18c88ef96e7af0878e20cf01))
- add customizable admin field descriptions ([dac60a0](https://github.com/payloadcms/payload/commit/dac60a024b0eb7197d5a501daea342827ee7c751))
- add descriptions to every allowed field type, globals and collections ([29a1108](https://github.com/payloadcms/payload/commit/29a1108518c7942f8ae06a990393a6e0ad4b6b16))
- add global slug and field names to schema validation errors ([bb63b4a](https://github.com/payloadcms/payload/commit/bb63b4aad153d125f68bf1fe1e9a3e4a5358ded9))
- improves group styling when there is no label ([ea358a6](https://github.com/payloadcms/payload/commit/ea358a66e8b8d2e54dd162eae0cf7066128cfabf))

## [0.7.8](https://github.com/payloadcms/payload/compare/v0.7.7...v0.7.8) (2021-07-23)

### Features

- fixes group label schema validation ([cbac888](https://github.com/payloadcms/payload/commit/cbac8887ddb7a4446f5502c577d4600905b13380))

## [0.7.7](https://github.com/payloadcms/payload/compare/v0.7.6...v0.7.7) (2021-07-23)

### Bug Fixes

- accurately documents the props for the datepicker field ([dcd8052](https://github.com/payloadcms/payload/commit/dcd8052498dd2900f228eaffcf6142b63e8e5a9b))

### Features

- only attempts to find config when payload is initialized ([266ccb3](https://github.com/payloadcms/payload/commit/266ccb374449b0a131a574d9b12275b6bb7e5c60))

## [0.7.6](https://github.com/payloadcms/payload/compare/v0.7.5...v0.7.6) (2021-07-07)

## [0.7.5](https://github.com/payloadcms/payload/compare/v0.7.4...v0.7.5) (2021-07-07)

### Bug Fixes

- crash on bullet list de-selection ([5388513](https://github.com/payloadcms/payload/commit/538851325d1558425918098e35e108595189774b))
- updates demo richtext elements with proper SCSS ([0075912](https://github.com/payloadcms/payload/commit/007591272f77e5dcc5e5a4a8f71459402f6605d4))

### Features

- adds plugins infrastructure ([6b25531](https://github.com/payloadcms/payload/commit/6b255315e0c475d700383f2738839966449fc563))
- enables backspace to deactivate richtext list elements ([91141ad](https://github.com/payloadcms/payload/commit/91141ad62f0f6ef3528e62eef23711e937d302ce))

## [0.7.4](https://github.com/payloadcms/payload/compare/v0.7.3...v0.7.4) (2021-07-01)

### Bug Fixes

- adds proper scss stylesheets to payload/scss ([84e31ae](https://github.com/payloadcms/payload/commit/84e31aed141efe5aa1b0c24a61bf35eb3d671242))

## [0.7.3](https://github.com/payloadcms/payload/compare/v0.7.2...v0.7.3) (2021-07-01)

### Bug Fixes

- changes scss imports to allow vars imports to payload projects ([ea80fd6](https://github.com/payloadcms/payload/commit/ea80fd68b14139cb01259a47ea597d33526d0c76))

### Features

- export all field prop types for custom components ([5bea9ae](https://github.com/payloadcms/payload/commit/5bea9ae1263f1d93e8b011ae97bb067a8c9bb4e1))

## [0.7.2](https://github.com/payloadcms/payload/compare/v0.7.1...v0.7.2) (2021-06-22)

### Bug Fixes

- parses incoming numbers through query string for use in where clauses ([4933b34](https://github.com/payloadcms/payload/commit/4933b34f6b5dfa960c2a830a8c74769d6712130a))
- respect maxDepth 0 ([95c1650](https://github.com/payloadcms/payload/commit/95c165018edf8e80c4dc828d3d77b6fa6d799de9))
- safely stringifies ObjectIDs while populating relationships ([d6bc6f9](https://github.com/payloadcms/payload/commit/d6bc6f9f0e8391818783cdf7edf282506e2c9fed))

### Features

- adds maxDepth to relationships and upload fields ([880dabd](https://github.com/payloadcms/payload/commit/880dabdcad10dcd9f057da71a601190fbeecf92d))

## [0.7.1](https://github.com/payloadcms/payload/compare/v0.7.0...v0.7.1) (2021-06-21)

### Bug Fixes

- babel config file error ([3af2554](https://github.com/payloadcms/payload/commit/3af2554eacab45317745ad72c8848b4dd1ddc16a))

# [0.7.0](https://github.com/payloadcms/payload/compare/v0.6.10...v0.7.0) (2021-06-21)

### Bug Fixes

- handle all scenarios in select cell ([dd40ab0](https://github.com/payloadcms/payload/commit/dd40ab07fa359802578ed948136018dfc9a538c5))

### Features

- exposes babel config via payload/babel ([#203](https://github.com/payloadcms/payload/issues/203)) ([67c1e28](https://github.com/payloadcms/payload/commit/67c1e280eb891a736703e242518bbeac8b8c2878))
- user preferences ([#195](https://github.com/payloadcms/payload/issues/195)) ([fb60bc7](https://github.com/payloadcms/payload/commit/fb60bc79a11d69c5dab6b4921d62614a7b914fef))

## [0.6.10](https://github.com/payloadcms/payload/compare/v0.6.9...v0.6.10) (2021-05-23)

## [0.6.9](https://github.com/payloadcms/payload/compare/v0.6.8...v0.6.9) (2021-05-16)

### Bug Fixes

- misc responsive improvements
- date clipping in sidebar ([#165](https://github.com/payloadcms/payload/issues/165))
- misc polish to popup component
- admin \_verified field not displaying proper field value
- properly typed express-fileupload config options ([#180](https://github.com/payloadcms/payload/issues/180))

## [0.6.8](https://github.com/payloadcms/payload/compare/v0.6.7...v0.6.8) (2021-05-12)

### Features

- add mimeTypes validation for uploads ([a5fcdf0](https://github.com/payloadcms/payload/commit/a5fcdf03bae681c5b2e0de6b681d20efe8ebdd7f))
- disables user scalable in mobile ([#177](https://github.com/payloadcms/payload/issues/177)) ([46c1a36](https://github.com/payloadcms/payload/commit/46c1a36fdb9363201b65ecdec44088cb41532bd6))
- exposes locale within preview function ([2d67448](https://github.com/payloadcms/payload/commit/2d67448d8ad1a7d4238820d0ccd93da961fc051c))
- restrict upload mime types in file picker ([1c6f32f](https://github.com/payloadcms/payload/commit/1c6f32f2881410a1534b61711af05fd35e7977c2))

## [0.6.7](https://github.com/payloadcms/payload/compare/v0.6.6...v0.6.7) (2021-05-07)

### Features

- add ability to hide gutter for RichText fields ([e791c5b](https://github.com/payloadcms/payload/commit/e791c5b7b325e58d273041ff426d19bafc4fc102))
- allows group field gutter to be disabled ([9aebeaf](https://github.com/payloadcms/payload/commit/9aebeaf579b9c8add64734dce92e4d92c0a1a24c))
- exposes component types ([99466fa](https://github.com/payloadcms/payload/commit/99466fa41e24779705f517d29d57e6174508ebcc))
- shrink image thumbnails on larger screens ([e565fa6](https://github.com/payloadcms/payload/commit/e565fa6f1ce13d76b8111e543d4c799a5d7f450e))
- support global date format ([670ccf2](https://github.com/payloadcms/payload/commit/670ccf2f589c306d13f3060b8acf4f4d33fcdd23))

## [0.6.6](https://github.com/payloadcms/payload/compare/v0.6.5...v0.6.6) (2021-04-27)

### Bug Fixes

- graphql returns compatible error format ([6f188b1](https://github.com/payloadcms/payload/commit/6f188b1fa6e631a992439f055e8e76c341ca6dfa))
- handle rich text saving as empty string ([382089b](https://github.com/payloadcms/payload/commit/382089b484b278e6ff491a2447ad06c41b96d5e3))
- removes incoming.data.length check, since data is typed as a keyed array when it is an instance of APIError ([2643e1a](https://github.com/payloadcms/payload/commit/2643e1a1006f86b24001f65cf39da245fa4daaad))
- support image resizing on M1 chip ([8cfc039](https://github.com/payloadcms/payload/commit/8cfc039cd0ffd497728f185b6ab45695302d3b95))
- update operation can save password changes ([a85bf9e](https://github.com/payloadcms/payload/commit/a85bf9e836f9463d94f13857254f5d4df6f68c72))

## [0.6.5](https://github.com/payloadcms/payload/compare/v0.6.4...v0.6.5) (2021-04-22)

### Features

- builds plugin infrastructure ([#149](https://github.com/payloadcms/payload/issues/149)) ([f17c6e4](https://github.com/payloadcms/payload/commit/f17c6e4010de07578af21398f667fa55bc8343bc))

## [0.6.4](https://github.com/payloadcms/payload/compare/v0.6.3...v0.6.4) (2021-04-21)

### Bug Fixes

- allows \_verificationToken to come back via showHiddenFields ([74430ea](https://github.com/payloadcms/payload/commit/74430ea1519c1ba0ad655daf4e8f5d8dae855358))

## [0.6.3](https://github.com/payloadcms/payload/compare/v0.6.2...v0.6.3) (2021-04-21)

### Bug Fixes

- make admin field properties in joi schema match TS types ([519c021](https://github.com/payloadcms/payload/commit/519c021525be114f43ad321233a9b8211d309ed0))
- properly label arrays/blocks with plural and singular ([fa49811](https://github.com/payloadcms/payload/commit/fa49811377103db9241f43537e508da62eb19076))
- safely parses incoming stringified richtext json ([9c95c75](https://github.com/payloadcms/payload/commit/9c95c750305633e99e7d80b5ba407b5b3146d691))

## [0.6.2](https://github.com/payloadcms/payload/compare/v0.6.1...v0.6.2) (2021-04-19)

### Features

- modifies relationship field to react to changing relationTo ([ddf25fb](https://github.com/payloadcms/payload/commit/ddf25fbb6559d93dd5b9105bd4a0a952fc72154b))

## [0.6.1](https://github.com/payloadcms/payload/compare/v0.6.0...v0.6.1) (2021-04-19)

### Bug Fixes

- cleans up duplicative columns ([5f2073a](https://github.com/payloadcms/payload/commit/5f2073ae685f22d099bc8f0d3e406e73ee59cd1d))
- graphql localized relationship bugs ([280f809](https://github.com/payloadcms/payload/commit/280f8094217de759ba6424dfd2294a6bfcb1d57a))
- moves enableRichTextRelationship to proper spot ([16ca22b](https://github.com/payloadcms/payload/commit/16ca22b4cc0d8e5d106fa8c8c6e2dde0ff972839))

### Features

- sets enableRichTextRelationship to true by default ([9970470](https://github.com/payloadcms/payload/commit/99704707dda25f8617d26552942915aa6e9d7a57))

# [0.6.0](https://github.com/payloadcms/payload/compare/v0.5.10...v0.6.0) (2021-04-19)

### BREAKING CHANGES

- By default, all Collection and Global access control functions are now set to require a user to be logged in to interact through GraphQL or REST APIs. This default access control is set to ensure that your API data is secure out of the box. From there, you can opt to publicly expose API actions as you need.

#### Migration Instructions to `0.6.x`

If you have any Collections or Globals that should be publicly available without being logged in, you need to define an access control function for each operation that needs to be publicly available.

For example, if you have a `pages` collection with no existing access control, and it should be publicly readable, you should change its config from this:

```js
const Page = {
  slug: "pages",
  access: {
    // No `read` access control was set
  },
};
```

To:

```js
const Page = {
  slug: "pages",
  access: {
    // Now we explicitly allow public read access
    // to this collection's documents
    read: () => true,
  },
};
```

If none of your collections or globals should be publicly exposed, you don't need to do anything to upgrade.

### Bug Fixes

- clears richtext element on enter, refocuses on toolbar button click ([4b19795](https://github.com/payloadcms/payload/commit/4b1979540d2ec33ce8396f572baba5e64962c0da))
- ensures api keys are properly populated in admin ([4359a70](https://github.com/payloadcms/payload/commit/4359a70a8b0bca380cc513dfcb83b2fbe28cbef4))
- ensures first relationship options are loaded only once ([75a5b04](https://github.com/payloadcms/payload/commit/75a5b047056b4e4e7a415a6903a1131cc61b0318))
- searching on relationship fields properly fetches results ([b86c3da](https://github.com/payloadcms/payload/commit/b86c3daa9952ccc9db324fecd53bb75f69cecfd4))
- upload useAsTitle set to filename by default ([7db23f8](https://github.com/payloadcms/payload/commit/7db23f8ebbf115ca45fa55718b0d1be18ca54cd3))

### Features

- autolabel fields when label is omitted ([#42](https://github.com/payloadcms/payload/issues/42)) ([b383eb6](https://github.com/payloadcms/payload/commit/b383eb65c6b524fd7cfddb7ac60a3f263e1b891e))
- dynamically populates richtext relationships ([3530424](https://github.com/payloadcms/payload/commit/353042467f12458994d734cf54423eb95eea9003))
- improve unique field value error handling ([21b2bd4](https://github.com/payloadcms/payload/commit/21b2bd4b6708823880fb87035495ab4c2c55da90))
- improves margins in rich text elements ([20d7a01](https://github.com/payloadcms/payload/commit/20d7a01919634faa366add792f98a36e68f213e9))

## [0.5.10](https://github.com/payloadcms/payload/compare/v0.5.9...v0.5.10) (2021-04-14)

### Bug Fixes

- feeds collectionSlug through me auth for graphql resolver ([9ee2f9c](https://github.com/payloadcms/payload/commit/9ee2f9c0dc25ea32ee0f0864e30afb389903b3cd))

## [0.5.9](https://github.com/payloadcms/payload/compare/v0.5.8...v0.5.9) (2021-04-14)

## [0.5.8](https://github.com/payloadcms/payload/compare/v0.5.7...v0.5.8) (2021-04-13)

### Bug Fixes

- revises graphql import syntax ([20f1e6c](https://github.com/payloadcms/payload/commit/20f1e6cb044254af7a0db72cc9dab95d32db0333))

## [0.5.7](https://github.com/payloadcms/payload/compare/v0.5.5...v0.5.7) (2021-04-13)

### Bug Fixes

- clears verificationToken when \_verified is true ([e58b152](https://github.com/payloadcms/payload/commit/e58b152d40394ec59b7a779feb3b9f02a6f4a0b6))
- custom query / mutation types ([a78fc97](https://github.com/payloadcms/payload/commit/a78fc974b80b153028e4796b15d2b6b17fe023bb))
- ensures email is still prefilled in auth configs ([31c41c2](https://github.com/payloadcms/payload/commit/31c41c22eca96721ce2982bcf5860dfd9e5c7beb))
- ensures failed conditions send path to form ([dff72fb](https://github.com/payloadcms/payload/commit/dff72fbf2f49d372423da8bc2840aad6d9c1ea1b))
- handle add/remove labels for all usage of Array field type ([ddf5df2](https://github.com/payloadcms/payload/commit/ddf5df290c5b36af0dc37a79c476001387f73275))
- make upload cell mimetype inline ([414bc01](https://github.com/payloadcms/payload/commit/414bc01b055ed6075613f4241f185cb0c25f046d))
- pagination calculation for current range ([000dee8](https://github.com/payloadcms/payload/commit/000dee85bd5858fe3d45e08c62943a6a1c6e349c))
- updates config schema for graphQL mutations and queries ([afc9454](https://github.com/payloadcms/payload/commit/afc9454465d7445c45f560eade0b17d831b04e2c))

### Features

- auto verifies first user registration ([8f720c0](https://github.com/payloadcms/payload/commit/8f720c000df26d34f7f8652f170525c7d54184a5))
- optimize save within Edit ([91d37fb](https://github.com/payloadcms/payload/commit/91d37fb41d820fe2cdcdbb28f999df2de751316e))
- prevents DraggableSections from re-mounting on doc save ([0094837](https://github.com/payloadcms/payload/commit/00948376358a4bfecc3a6cb8cf0a6ad9a0b5a227))
- remembers conditional field values after removing / readding ([988d0a4](https://github.com/payloadcms/payload/commit/988d0a4b08e1228bb358bb133bcb05dbce7f55ab))
- remove mimetype from upload cell type ([776b9c9](https://github.com/payloadcms/payload/commit/776b9c9c30b6d9d795c509a558fd1eee666b2652))

## [0.5.5](https://github.com/payloadcms/payload/compare/v0.5.4...v0.5.5) (2021-04-02)

### Features

- allows soft breaks in rich text ([ecd277d](https://github.com/payloadcms/payload/commit/ecd277da7dff24dc49f6061e7d50e4b21bc285c9))

## [0.5.4](https://github.com/payloadcms/payload/compare/v0.5.2...v0.5.4) (2021-04-02)

### Bug Fixes

- ensures arrays and blocks reset row count on initialState change ([9a7c0e3](https://github.com/payloadcms/payload/commit/9a7c0e3dbdf4e6decb03ae085a41fb239fd5b7a8))
- unique indices ([23c45f1](https://github.com/payloadcms/payload/commit/23c45f137ac97c99ed38969bed64928f2ce2795e))

## [0.5.2](https://github.com/payloadcms/payload/compare/v0.5.1...v0.5.2) (2021-03-31)

### Bug Fixes

- modal issues with richtext relationship ([8ea4407](https://github.com/payloadcms/payload/commit/8ea4407f04fd4b63df6afffbe15301f7d5746016))

## [0.5.1](https://github.com/payloadcms/payload/compare/v0.5.0...v0.5.1) (2021-03-29)

### Bug Fixes

- base auth / upload fields no longer cause validation issues ([23e1fc3](https://github.com/payloadcms/payload/commit/23e1fc3f73673d4694763908bb819c77bf600702))

# [0.5.0](https://github.com/payloadcms/payload/compare/v0.4.7...v0.5.0) (2021-03-29)

### BREAKING CHANGES

- changes global find and update payload api from global to slug as the key to find/update with ([c71ba2b](https://github.com/payloadcms/payload/commit/c71ba2b079d109d4028d74f76603905d9382d364))

### Bug Fixes

- allows absolute urls within adminThumbnail ([51b46d4](https://github.com/payloadcms/payload/commit/51b46d44b0c88387d8b23859129f163b581bf1cc))
- handles empty indices within array field data ([d47e2c5](https://github.com/payloadcms/payload/commit/d47e2c57868667f2ff9ca87aa9ad862687bd985e))
- moving nested arrays now properly persists row count ([5f9a5c8](https://github.com/payloadcms/payload/commit/5f9a5c859eca8854592b2a7a32bef50db4584709))
- validation consistency within admin ([50b9937](https://github.com/payloadcms/payload/commit/50b99370d2b849e858fd64e6018ebf0e94103998))

### Features

- saves cursor position when relationship element is added to richText ([d24b3f7](https://github.com/payloadcms/payload/commit/d24b3f72ce222e4551c12e202238f171f9cc4b97))

## [0.4.7](https://github.com/payloadcms/payload/compare/v0.4.6...v0.4.7) (2021-03-15)

## [0.4.6](https://github.com/payloadcms/payload/compare/v0.4.5...v0.4.6) (2021-03-14)

### Features

- allows admin thumbnail to be set programmatically ([b6a9fe4](https://github.com/payloadcms/payload/commit/b6a9fe4bcfc85815a60a3fe8d3cb38b7ae673424))
- exports collection field hook types from payload/types ([36aae5c](https://github.com/payloadcms/payload/commit/36aae5c37f8ea8c5dde16a898a28b9301efa6a5b))
- only runs adminThumbnail func if image type ([5e1ddb5](https://github.com/payloadcms/payload/commit/5e1ddb552ee9fc8972c9537eee62cddc93a24f42))
- provides field access control with document data ([339f750](https://github.com/payloadcms/payload/commit/339f7503a41802421bb38c8cf5da0f0f1573bdd6))
- reorders uploads to provide beforeChange hooks with upload data ([3c42e6e](https://github.com/payloadcms/payload/commit/3c42e6e6af849a8acc45e93017b0eafea74ecdba))

## [0.4.5](https://github.com/payloadcms/payload/compare/v0.4.4...v0.4.5) (2021-03-04)

### Bug Fixes

- config validation allow admin dashboard ([2d1d1b4](https://github.com/payloadcms/payload/commit/2d1d1b4f32bcc6ee1ce709208ae28369611e5bdd))

## [0.4.4](https://github.com/payloadcms/payload/compare/v0.4.3...v0.4.4) (2021-03-04)

### Bug Fixes

- email verification template missing token ([93ed664](https://github.com/payloadcms/payload/commit/93ed6649201511edfaea14c199022f05623c404c))

## [0.4.1](https://github.com/payloadcms/payload/compare/v0.4.0...v0.4.3) (2021-03-04)

### Documentation

- fixed broken links throughout docs ([3afefbe](https://github.com/payloadcms/payload/commit/3afefbe5922ee7aff496a96c61ff9a5270d6a7cb))

## [0.4.0](https://github.com/payloadcms/payload/compare/v0.3.0...v0.4.0) (2021-02-28)

### Breaking Changes

- reverts preview function to only requiring the return of a preview URL ([ca14e66](https://github.com/payloadcms/payload/commit/ca14e66a580fea94ef71416edf6c8caffcf446b0))

### Features

- implements new billing model, including new Personal license which is free forever ([c97ddeb](https://github.com/payloadcms/payload/commit/c97ddeb2d96f949604d46212166c4784330cc72d))
- simplifies logic in update operations ([e268e25](https://github.com/payloadcms/payload/commit/e268e25719dd4ebd1a6818dca86d12dc057386ca))
- removes the requirement of returning a value from field hooks ([4de5605](https://github.com/payloadcms/payload/commit/4de56059319a6d13b6f0ec20ac4d344f265446bf))

### Bug Fixes

- properly exposes scss variables for re-use ([c1b2301](https://github.com/payloadcms/payload/commit/c1b230165033ed3cf382a6e42b590815489525f9))
- explicitly sets modal z-index and css breakpoints ([c1b2301](https://github.com/payloadcms/payload/commit/c1b230165033ed3cf382a6e42b590815489525f9))
- removes `overwrite` from update operation to ensure hidden fields don't get lost on document update ([a8e2cc1](https://github.com/payloadcms/payload/commit/a8e2cc11af177641409ff7726ed8c4f1a154dee4))

## [0.3.0](https://github.com/payloadcms/payload/compare/v0.2.13...v0.3.0) (2021-02-23)

### Bug Fixes

- properly exposes scss variables for re-use ([c1b2301](https://github.com/payloadcms/payload/commit/c1b230165033ed3cf382a6e42b590815489525f9))
- explicitly sets modal z-index and css breakpoints ([c1b2301](https://github.com/payloadcms/payload/commit/c1b230165033ed3cf382a6e42b590815489525f9))
- removes `overwrite` from update operation to ensure hidden fields don't get lost on document update ([a8e2cc1](https://github.com/payloadcms/payload/commit/a8e2cc11af177641409ff7726ed8c4f1a154dee4))

## [0.2.13](https://github.com/payloadcms/payload/compare/v0.2.12...v0.2.13) (2021-02-20)

### Breaking Changes

- Preview function now no longer takes form field state as an arg and instead takes a copy of the document itself

### Features

- supports newTab in Button, updates generatePreviewURL api to forward through PreviewButton ([6b6297f](https://github.com/payloadcms/payload/commit/6b6297fb2d22b813f45729429b7efbe9a6ab97da))
- detaches localization from mongoose entirely ([162ec74](https://github.com/payloadcms/payload/commit/162ec74445c51a79cd50f75ffb56de8e4bcf9ace))

### Bug Fixes

- infinite loop caused within block component ([9e42d11](https://github.com/payloadcms/payload/commit/9e42d119e471b0efe0d6f69e99d0e31ba5e9237f))
- sets sparse true if field localized and unique ([2bc5c59](https://github.com/payloadcms/payload/commit/2bc5c59fec842cd5c5adf201084cdba9b0cab310))
- returns entire doc to generatePreviewURL callback of PreviewButton ([9b9d0f2](https://github.com/payloadcms/payload/commit/9b9d0f24b54d46c24734f30ed9640d25e6c19097))
- log mongoose connect error message ([e36c7d2](https://github.com/payloadcms/payload/commit/e36c7d269c4b5b49d6c85f416b26196999aadfc0))

### Documentation

- removes incorrect hasMany from upload field type ([e549298](https://github.com/payloadcms/payload/commit/e549298ad5a9a6116659258bb738f5d87abe4ff7))

## [0.2.12](https://github.com/payloadcms/payload/compare/v0.2.11...v0.2.12) (2021-02-1-0)

### Bug Fixes

- middleware for cors set up on static files
- windows compatible upload filename paths

## [0.2.11](https://github.com/payloadcms/payload/compare/v0.2.11...v0.2.12) (2021-02-05)

### Bug Fixes

- middleware for cors set up on static files ([55e0de1](https://github.com/payloadcms/payload/commit/55e0de1719ec387e2182bf33922602243f7eda94))
- file size in local operations ([0feb7b7](https://github.com/payloadcms/payload/commit/0feb7b7379de6429cf5cb1cdbdad0142f72cc5dc))

## [0.2.11](https://github.com/payloadcms/payload/compare/v0.2.10...v0.2.11) (2021-02-05)

### Features

- allows upload through Local API ([1a59028](https://github.com/payloadcms/payload/commit/1a590287ea181e4548c8e75d8cdb25ada5cbbdbf))

### Bug Fixes

- fix localization within blocks ([e50fc1f](https://github.com/payloadcms/payload/commit/e50fc1f3142ae5e387cef3c778988c473b04417e))
- forces fallbackLocale to null in update ops ([3005360](https://github.com/payloadcms/payload/commit/300536033ffe50a2eaedd2a714e844a5282f2ef0))

## [0.2.10](https://github.com/payloadcms/payload/compare/v0.2.9...v0.2.10) (2021-02-04)

### Features

- add support for setting mongoose connection options ([82c4898](https://github.com/payloadcms/payload/commit/82c489841c418b953c7f08d30c8b19751ff050f4))
- admin ui create first user add confirm password field (<https://github.com/payloadcms/payload/commit/60453fec9ee17e8f83f7e98c5e2b2e39bc6d0365>)

### Bug Fixes

- flag scss variables with default ([8916e8a](https://github.com/payloadcms/payload/commit/8916e8af45e179748bf6f2a75216e8d1c35958f2))
- relationship component hasMany bug ([d540706](https://github.com/payloadcms/payload/commit/d5407060d079c333081b0298e45dfe866d31b86e))
- hide force unlock in admin ui when creating auth collection item ([3bd0de0](https://github.com/payloadcms/payload/commit/3bd0de0a0b6832f5940474c8c40fd85f6fcd1b74))

## [0.2.9](https://github.com/payloadcms/payload/compare/v0.2.6...v0.2.9) (2021-01-27)

### Bug Fixes

- field validation type can return promise ([06ddab1](https://github.com/payloadcms/payload/commit/06ddab124919b28b74667e36e315682a0c9cf459))

## [0.2.8](https://github.com/payloadcms/payload/compare/v0.2.6...v0.2.8) (2021-01-25)

### Chore

- add bugs and keywords to package.json ([37f5b32](https://github.com/payloadcms/payload/commit/37f5b3283363220caa63a5066011b1cb9841812d))

## [0.2.6](https://github.com/payloadcms/payload/compare/v0.2.5...v0.2.6) (2021-01-25)

## [0.2.5](https://github.com/payloadcms/payload/compare/v0.2.4...v0.2.5) (2021-01-25)

### Bug Fixes

- field gutter padding ([90d2078](https://github.com/payloadcms/payload/commit/90d20786c33b2ef4ea937e75769c023c5776db1b))
- richtext sticky toolbar within block ([8218343](https://github.com/payloadcms/payload/commit/8218343b6cf629faed0f752fb27b546684580ec4))

## [0.2.4](https://github.com/payloadcms/payload/compare/v0.2.3...v0.2.4) (2021-01-24)

### Bug Fixes

- block field styles ([36f0bd8](https://github.com/payloadcms/payload/commit/36f0bd81eb340b6d8ac3011a4b10e828e79c20d8))

## [0.2.3](https://github.com/payloadcms/payload/compare/v0.2.2...v0.2.3) (2021-01-24)

### Bug Fixes

- ensures modal heights are 100% of viewport ([7edab5d](https://github.com/payloadcms/payload/commit/7edab5d3543db27c444b180548fc076dd483848a))

## [0.2.2](https://github.com/payloadcms/payload/compare/v0.2.1...v0.2.2) (2021-01-24)

### Bug Fixes

- revert serverURL config change ([f558bd2](https://github.com/payloadcms/payload/commit/f558bd2733a82f1ed9d14604f8b3dea5bb5e8ef5))

### Features

- adds better serverURL validation ([75056e2](https://github.com/payloadcms/payload/commit/75056e2e13c4d5f9a2d4341282b6c1f4c42e1609))

### Reverts

- Revert "docs: configuration overview describe serverURL and removed from code examples where not needed" ([bd446b6](https://github.com/payloadcms/payload/commit/bd446b60b8c56857fb99cda5a9f8a93216efc8b0))

## [0.2.1](https://github.com/payloadcms/payload/compare/v0.2.0...v0.2.1) (2021-01-24)

### Features

- exposes further types ([e056348](https://github.com/payloadcms/payload/commit/e056348850638f3c621072668a4a9232492c209b))

# [0.2.0](https://github.com/payloadcms/payload/compare/v0.1.146...v0.2.0) (2021-01-23)

### Bug Fixes

- better error handler when sendMail fails ([ea47736](https://github.com/payloadcms/payload/commit/ea47736274b3b176da534b461907da4ddeffa5e9))
- button css specificity ([d8b5233](https://github.com/payloadcms/payload/commit/d8b52337b2d34785817b536fe7017853bbc3b5a6))
- migrates Condition UI value/operator pattern ([d23cc20](https://github.com/payloadcms/payload/commit/d23cc20b3d0fa061a2b8111f65e04dd5d35a5557))
- target es2019, optional chaining not supported for Node < 14 ([52a0096](https://github.com/payloadcms/payload/commit/52a0096d3b8eca47a8afdef42d47117d028b754d))

### Features

- adds contributing guidelines ([de5bf6e](https://github.com/payloadcms/payload/commit/de5bf6ea280f771e96de703b3732f851903b1fe5))
- allows admins to autoverify via admin ([a6a23e3](https://github.com/payloadcms/payload/commit/a6a23e3b154802e5ec874760b3d3e44e90f56e7c))
- auto-removes verificationToken upon manual user verify ([2139eb4](https://github.com/payloadcms/payload/commit/2139eb410f8c95505ef7b90e35a099b0955d4e12))
- serverURL no longer required in config ([4770f24](https://github.com/payloadcms/payload/commit/4770f24adb50367ec6f6637cafc3f076023b0416))

## [0.1.146](https://github.com/payloadcms/payload/compare/v0.1.145...v0.1.146) (2021-01-18)

### Bug Fixes

- localized groups ([f38e0fc](https://github.com/payloadcms/payload/commit/f38e0fce981a188b0adb2050cfe8a8e0f047e606))
- textarea handle undefined ([ba31397](https://github.com/payloadcms/payload/commit/ba31397ac15402eb3837bcbe454e0aaf82ecbf03))

## [0.1.145](https://github.com/payloadcms/payload/compare/v0.1.144...v0.1.145) (2021-01-17)

### Bug Fixes

- add minLength and maxLength to textarea field validations ([2c98087](https://github.com/payloadcms/payload/commit/2c98087c6f40c32dcbccf557aa61ebf8fc1fe17f))
- minLength field validation error messages ([5e60b86](https://github.com/payloadcms/payload/commit/5e60b8617e715378831f10b90dedd017ed8d4a8c))

## [0.1.144](https://github.com/payloadcms/payload/compare/v0.1.143...v0.1.144) (2021-01-16)

### Bug Fixes

- add default user to collections before checking for valid relationships ([b2d05c7](https://github.com/payloadcms/payload/commit/b2d05c781d7751bbede9e37996cbdc0736d07a66))
- handle user collection 'auth: true' ([c303711](https://github.com/payloadcms/payload/commit/c3037118133a242769dfa4a31914e8e61068edcf))

## [0.1.143](https://github.com/payloadcms/payload/compare/v0.1.142...v0.1.143) (2021-01-14)

### Bug Fixes

- payload schema validation allow '\*' ([bd92b0a](https://github.com/payloadcms/payload/commit/bd92b0a94ba3562b01000a58a4bc0e0071c1f35b))

### Features

- allows undefined collections ([6bb58ce](https://github.com/payloadcms/payload/commit/6bb58cecd8bc0b8faa42bc8995ec5da0421375db))

## [0.1.142](https://github.com/payloadcms/payload/compare/v0.1.141...v0.1.142) (2021-01-09)

### Bug Fixes

- adds disableDuplicate to schema validation of collections config ([e9ed7ee](https://github.com/payloadcms/payload/commit/e9ed7ee4bdc99bdcc0d86272816f3d5c6904ac2b))

### Features

- add getAdminURL and getAPIURL functions ([8db73bb](https://github.com/payloadcms/payload/commit/8db73bbec22646bc626d17bb783b10ea2d837520))
- adds build to CI ([87a1717](https://github.com/payloadcms/payload/commit/87a1717dcae8ec30892cebc46e88cabe8e62bf4c))
- disable graphQL flag that will bypass gql on payload init ([d78c76e](https://github.com/payloadcms/payload/commit/d78c76e0b4b7e2c2cc834a2a1288ec75468852ec))

## [0.1.141](https://github.com/payloadcms/payload/compare/v0.1.140...v0.1.141) (2021-01-07)

### Bug Fixes

- properly exports ES6 components ([f493263](https://github.com/payloadcms/payload/commit/f49326395dba523c2193c46a8ca4142ff761f3fd))

## [0.1.140](https://github.com/payloadcms/payload/compare/v0.1.139...v0.1.140) (2021-01-07)

### Bug Fixes

- admin field error messages ([423df3f](https://github.com/payloadcms/payload/commit/423df3f83af0f899b4a9eafa041ab7c79ccfac78))

## [0.1.139](https://github.com/payloadcms/payload/compare/v0.1.138...v0.1.139) (2021-01-06)

### Bug Fixes

- improves typing in delete op ([644519c](https://github.com/payloadcms/payload/commit/644519c539f6fda29d7b61978416b70306d0ea35))
- use FileSize and ImageSize types ([4d6871a](https://github.com/payloadcms/payload/commit/4d6871abc854385121c761eea4e4705f45c35832))

## [0.1.138](https://github.com/payloadcms/payload/compare/v0.1.137...v0.1.138) (2021-01-06)

### Bug Fixes

- removes old css ([6066f28](https://github.com/payloadcms/payload/commit/6066f2896a5c1e21137d41404f2a6161ef6de7a2))

## [0.1.137](https://github.com/payloadcms/payload/compare/v0.1.136...v0.1.137) (2021-01-05)

### Bug Fixes

- removes prod devtool ([6808637](https://github.com/payloadcms/payload/commit/680863702e67d69dc4ec8d6a48b0e1402164cc97))

## [0.1.136](https://github.com/payloadcms/payload/compare/v0.1.135...v0.1.136) (2021-01-05)

## [0.1.135](https://github.com/payloadcms/payload/compare/v0.1.134...v0.1.135) (2021-01-05)

## [0.1.134](https://github.com/payloadcms/payload/compare/v0.1.133...v0.1.134) (2021-01-05)

### Bug Fixes

- updates payload-config path within webpack ([6bf141c](https://github.com/payloadcms/payload/commit/6bf141c6d4707e622f56f5df4f8f3f366d847173))

## [0.1.133](https://github.com/payloadcms/payload/compare/v0.1.132...v0.1.133) (2021-01-05)

## [0.1.132](https://github.com/payloadcms/payload/compare/v0.1.131...v0.1.132) (2021-01-05)

### Bug Fixes

- renames webpack config alias ([c0636df](https://github.com/payloadcms/payload/commit/c0636dfe220b72c129c4e2b144e5714755a20043))

## [0.1.131](https://github.com/payloadcms/payload/compare/v0.1.130...v0.1.131) (2021-01-05)

## [0.1.130](https://github.com/payloadcms/payload/compare/v0.1.129...v0.1.130) (2021-01-05)

## [0.1.129](https://github.com/payloadcms/payload/compare/v0.1.128...v0.1.129) (2021-01-05)

## [0.1.128](https://github.com/payloadcms/payload/compare/v0.1.127...v0.1.128) (2021-01-05)

### Bug Fixes

- adds default thumbnail size ([f582a25](https://github.com/payloadcms/payload/commit/f582a254cd6b6f56bb8146923f3ab0130a4b7859))
- config validation of block imageURL ([c572057](https://github.com/payloadcms/payload/commit/c572057706f58f7759e167a724837f84e88d0d10))
- default config value for email removed as the property was moved out of config ([cf89d4c](https://github.com/payloadcms/payload/commit/cf89d4cb56add645e68cf0be31d943b734dabe39))
- demo email start on payload init ([57d2c86](https://github.com/payloadcms/payload/commit/57d2c8602fb81a5d67d34a38c25a0429c2b9c44b))
- Edit view main / sidebar widths ([e067fa1](https://github.com/payloadcms/payload/commit/e067fa12b2465d4767bc35b5f1ec0de8096f7439))
- graphQL access ([4d871c2](https://github.com/payloadcms/payload/commit/4d871c27f6eefea26ec55302e654fc3b0f4a2933))
- graphQL logout ([709cc9c](https://github.com/payloadcms/payload/commit/709cc9c294d959913b382e24dd0d7002d6a7c9cd))
- improves edit view layout constraints ([0f7046b](https://github.com/payloadcms/payload/commit/0f7046b98efd82caf98d0d872bd6e68b076452a1))
- issues with select hasMany ([a0bf503](https://github.com/payloadcms/payload/commit/a0bf503f888b7fde0c9660e9f8a461da2fab5d67))
- lowecases joi like everywhere else in payload ([5823a86](https://github.com/payloadcms/payload/commit/5823a864f926bc6441267a21277059a368410b92))
- payload config remove types for email ([faec969](https://github.com/payloadcms/payload/commit/faec969752622c70e9175cc226d888bf32ec732c))
- reinstate explicit labels for AllFields collection ([885c73c](https://github.com/payloadcms/payload/commit/885c73c838c597ac03f79558af9946686274969f))
- removes delete and unlock from baseField type and schema ([4fa942f](https://github.com/payloadcms/payload/commit/4fa942f3a02089c8320e483b896a59627c28f11e))
- removes old reliance on config.email ([e093e06](https://github.com/payloadcms/payload/commit/e093e06926e55916ddb0bdb6f17e0317dfab951c))

### Features

- allows for refresh operation to accept a deliberately specified token ([7d05069](https://github.com/payloadcms/payload/commit/7d05069f361d30ff36d990e0926a60b1c374149a))
- types this within crreate op ([d43ff8b](https://github.com/payloadcms/payload/commit/d43ff8b4a764dd203fa7eebda28b09dc21a88e31))

## [0.1.127](https://github.com/payloadcms/payload/compare/v0.1.126...v0.1.127) (2020-12-31)

### Bug Fixes

- converts class methods to arrow functions ([662839f](https://github.com/payloadcms/payload/commit/662839fb06e95001bb0ef20c4f318cc4c2fccc31))

## [0.1.126](https://github.com/payloadcms/payload/compare/v0.1.125...v0.1.126) (2020-12-30)

### Bug Fixes

- adds delete and unlock to joi baseField schema ([36d51de](https://github.com/payloadcms/payload/commit/36d51de201b27ef91f43f05992d980ad306ba9f3))

## [0.1.125](https://github.com/payloadcms/payload/compare/v0.1.124...v0.1.125) (2020-12-30)

### Bug Fixes

- removes prod source maps ([eeea06d](https://github.com/payloadcms/payload/commit/eeea06d6aaa84efdfb479baf1baad7bdf038d7cd))

## [0.1.124](https://github.com/payloadcms/payload/compare/v0.1.123...v0.1.124) (2020-12-30)

### Bug Fixes

- disable requiring default props in eslint ([64cf321](https://github.com/payloadcms/payload/commit/64cf32146ad75d8ce3e5f3e8e690391ac7884819))
- disables inline sourcemaps for admin dist ([8090b2a](https://github.com/payloadcms/payload/commit/8090b2a23bb6298fdd998d9a72c6f596e7473cb0))
- type issues that arose from reorganizing certain config props ([0c03c2e](https://github.com/payloadcms/payload/commit/0c03c2e3af34657e3dde1c3f2b675840147f78ec))
- updates typing on DatePicker component and joi schema ([5100fd3](https://github.com/payloadcms/payload/commit/5100fd35dc796c5862ef9fd7261abdcba925b020))
- webpack config override ([8401400](https://github.com/payloadcms/payload/commit/84014001297519ce7f82f691fb2c4d1c525222f9))

### Features

- allows for adding custom CSS in addition to SCSS overrides ([544a4db](https://github.com/payloadcms/payload/commit/544a4dbd3ab17e1c8c9ed864fe17b7359883d845))

## [0.1.123](https://github.com/payloadcms/payload/compare/v0.1.123...v0.1.123) (2020-12-28)

### Bug Fixes

- allows config validation to accept esmodules as components ([b8ad84c](https://github.com/payloadcms/payload/commit/b8ad84c525e597e237caf05e00832ded30668a6b))
- prod webpack publicPath ([8bda6ea](https://github.com/payloadcms/payload/commit/8bda6eaa762dff0027036d918155f4618740a84c))

## [0.1.122](https://github.com/payloadcms/payload/compare/v0.1.121...v0.1.122) (2020-12-28)

### Bug Fixes

- improves field schema validation ([db13512](https://github.com/payloadcms/payload/commit/db135129d84bab9df03516ebfa2b667acead3cc9))
- safely accesses field permissions ([1fff737](https://github.com/payloadcms/payload/commit/1fff7374d43921d203b9b655ac64dbed3867ad2a))

### Features

- sends config through babel/register ([fec718e](https://github.com/payloadcms/payload/commit/fec718e9e523b1e92ca2dc216d99eef2dcbed83a))
- splits tsconfig between admin and server ([efe0b40](https://github.com/payloadcms/payload/commit/efe0b40aca4b88084c71f851604d08cae1d62a9a))

## [0.1.121](https://github.com/payloadcms/payload/compare/v0.1.120...v0.1.121) (2020-12-27)

## [0.1.20](https://github.com/payloadcms/payload/compare/v0.1.19...v0.1.20) (2020-12-27)

### Bug Fixes

- production webpack css ([6e83edc](https://github.com/payloadcms/payload/commit/6e83edc988e9284ec52164fc6399f45ab5851652))
- removes unnecessary meta defaults in admin config ([0117f18](https://github.com/payloadcms/payload/commit/0117f18eb1dd163143e18cd8061a4b96d41c411e))

### Features

- improves edit scroll UX in Account and Globals ([604922a](https://github.com/payloadcms/payload/commit/604922a26e7aabde71b470c96ff1b27e0f7b6fc8))
- improves scrolling UX in Edit views ([a715a42](https://github.com/payloadcms/payload/commit/a715a4206ed2cedc9b02b58339e44354c571fec5))

## [0.1.19](https://github.com/payloadcms/payload/compare/v0.1.18...v0.1.19) (2020-12-27)

### Bug Fixes

- copyfiles, autocomplete transition ([5b8c721](https://github.com/payloadcms/payload/commit/5b8c721292140e4cd0ed55d13e97c1d4cd359c98))

### Features

- flattens build into one command ([8571dc3](https://github.com/payloadcms/payload/commit/8571dc396591487d2a2854b9fe93f5338eb10659))

## [0.1.18](https://github.com/payloadcms/payload/compare/v0.1.17...v0.1.18) (2020-12-27)

## [0.1.17](https://github.com/payloadcms/payload/compare/v0.1.16...v0.1.17) (2020-12-27)

## [0.1.16](https://github.com/payloadcms/payload/compare/v0.1.15...v0.1.16) (2020-12-27)

### Bug Fixes

- handle access result gracefully ([1cd578e](https://github.com/payloadcms/payload/commit/1cd578ef445499ceb3704ab28d736baaae123cbd))
- undo property fix, field exists - bad typing ([66946c8](https://github.com/payloadcms/payload/commit/66946c86973c252585e98aa3f0a453cae9dff598))

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

- **webpack:** more require.resolves needed ([924eb1d](https://github.com/payloadcms/payload/commit/924eb1d0b566eb7bb3912018e06cf431e5a85524))
- **webpack:** use require.resolve for modules ([badd59a](https://github.com/payloadcms/payload/commit/badd59ac38e10e9caf700eece5761e7d65341c21))
- add missing webpack dep path-browserify ([8789dae](https://github.com/payloadcms/payload/commit/8789dae155bbb93fdef5104cc616e0a29b1b6409))

### Features

- add initial types ([983bf71](https://github.com/payloadcms/payload/commit/983bf713b395a68d2374f2446a8a759aeda48579))

## [0.0.141](https://github.com/payloadcms/payload/compare/v0.0.140...v0.0.141) (2020-11-20)

## [0.0.140](https://github.com/payloadcms/payload/compare/v0.0.139...v0.0.140) (2020-11-20)

### Features

- show email creds when explicitly set to 'mock' ([dbd305a](https://github.com/payloadcms/payload/commit/dbd305acc5b083cea08227cbff8afebe8aa4c374))
- use react-toastify for notifications ([131dd51](https://github.com/payloadcms/payload/commit/131dd51c39b08c2235582d23deb53188a04e5d80))
- validate admin user ([83d32e4](https://github.com/payloadcms/payload/commit/83d32e44498460584bbc82512df91848bcf7cf47))

## [0.0.139](https://github.com/payloadcms/payload/compare/v0.0.138...v0.0.139) (2020-11-17)

### Bug Fixes

- missed a file ([f52836a](https://github.com/payloadcms/payload/commit/f52836a7e342ecccd7409ba382eade43adb18d90))

## [0.0.138](https://github.com/payloadcms/payload/compare/v0.0.137...v0.0.138) (2020-11-17)

### Bug Fixes

- allow e-mail to be unconfigured, remove default fromName and fromAddress ([dceeeaa](https://github.com/payloadcms/payload/commit/dceeeaac6a1a9057cdd9f973c7500b3763514f0a))
- auth json schema didn't allow auth as boolean ([0694a09](https://github.com/payloadcms/payload/commit/0694a09abdde59eb8e785301230ed4e8e244c84a))
- properly concat verification and locking fields ([2624ad5](https://github.com/payloadcms/payload/commit/2624ad5f7e50332eb9212877d0eefcdcb2fa399b))

### Features

- add blind index for encrypting API Keys ([9a1c1f6](https://github.com/payloadcms/payload/commit/9a1c1f64c0ea0066b679195f50e6cb1ac4bf3552))
- add license key to access routej ([2565005](https://github.com/payloadcms/payload/commit/2565005cc099797a6e3b8995e0984c28b7837e82))

## [0.0.137](https://github.com/payloadcms/payload/commit/5c1e2846a2694a80cc8707703406c2ac1bb6af8a) (2020-11-12)