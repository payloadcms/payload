## [2.28.0](https://github.com/payloadcms/payload/compare/v2.27.0...v2.28.0) (2024-09-04)


### Features

* collections can use custom database operations ([#7675](https://github.com/payloadcms/payload/issues/7675)) ([6ba293c](https://github.com/payloadcms/payload/commit/6ba293c0f84f91bf89cf089a20e47de130013ebb))


### Bug Fixes

* **db-postgres:** migration exit codes ([#7873](https://github.com/payloadcms/payload/issues/7873)) ([25e9bc6](https://github.com/payloadcms/payload/commit/25e9bc62dbcbabcb3619cf83e3dc0110e0a4cabf)), closes [#7031](https://github.com/payloadcms/payload/issues/7031)
* **db-postgres:** query hasMany text/number in array/blocks ([#8033](https://github.com/payloadcms/payload/issues/8033)) ([96a624a](https://github.com/payloadcms/payload/commit/96a624ad5c5259b197b4ca793d8419d1e827de9c))
* **plugin-cloud:** better logging on static handler ([#7924](https://github.com/payloadcms/payload/issues/7924)) ([1f09348](https://github.com/payloadcms/payload/commit/1f0934877ce5aabb771c936c3677a26d2ef006ec))

## [2.27.0](https://github.com/payloadcms/payload/compare/v2.26.0...v2.27.0) (2024-08-26)


### Features

* add support for custom image size file names ([#7637](https://github.com/payloadcms/payload/issues/7637)) ([f976270](https://github.com/payloadcms/payload/commit/f97627092cabe4eabbebefa75afc53579188386b))
* upgrade react-toastify dependency, and upgrade to pnpm v9 in our monorepo ([#7667](https://github.com/payloadcms/payload/issues/7667)) ([94d18e8](https://github.com/payloadcms/payload/commit/94d18e8d747588efce225cde0b621db9b513e7c1))


### Bug Fixes

* update state of field if either `valid` status or `errorMessage` changes ([#7632](https://github.com/payloadcms/payload/issues/7632)) ([c624eea](https://github.com/payloadcms/payload/commit/c624eea0d868938f4603860fa25be3df580ba7fe)), closes [#6413](https://github.com/payloadcms/payload/issues/6413)

## [2.26.0](https://github.com/payloadcms/payload/compare/v2.25.0...v2.26.0) (2024-08-09)


### Features

* adds classnames to edit, list views ([#7595](https://github.com/payloadcms/payload/issues/7595)) ([7f39afa](https://github.com/payloadcms/payload/commit/7f39afa1928b118451138e811ea71a04fce021d5))
* adds upload's relationship thumbnail ([#5015](https://github.com/payloadcms/payload/issues/5015)) ([39e110e](https://github.com/payloadcms/payload/commit/39e110e6331efff0ca8ca7174780076243a016de))
* **ui:** expose custom errors in delete many ([#7439](https://github.com/payloadcms/payload/issues/7439)) ([3e780b9](https://github.com/payloadcms/payload/commit/3e780b98155550f877021996dd094ba435dff81b))


### Bug Fixes

* **db-postgres:** localized array inside blocks field ([#7458](https://github.com/payloadcms/payload/issues/7458)) ([a308d63](https://github.com/payloadcms/payload/commit/a308d6384f9724c5ff330382070a5803fbcf167c)), closes [#5240](https://github.com/payloadcms/payload/issues/5240)
* deprecated `inflight` package ([#6558](https://github.com/payloadcms/payload/issues/6558)) ([eca1517](https://github.com/payloadcms/payload/commit/eca1517237c78983c192f4bafa92a86d94a0de9e)), closes [#6492](https://github.com/payloadcms/payload/issues/6492)
* enable `relationship` & `upload` field population in `versions` ([#7533](https://github.com/payloadcms/payload/issues/7533)) ([9865ae9](https://github.com/payloadcms/payload/commit/9865ae998b9aeb5d72724023976bb203133e19ff))
* filtering by non-poly `relationships` with `not_equals` operator ([#7573](https://github.com/payloadcms/payload/issues/7573)) ([efa56ce](https://github.com/payloadcms/payload/commit/efa56cefc15a48cd45b3aaba2eddacca79e1be30)), closes [#5212](https://github.com/payloadcms/payload/issues/5212) [#6278](https://github.com/payloadcms/payload/issues/6278)
* filtering by polymorphic `relationships` with `drafts` enabled ([#7565](https://github.com/payloadcms/payload/issues/7565)) ([907d7d1](https://github.com/payloadcms/payload/commit/907d7d1d3a89ed22bb991a1f238bb77d54e3e173)), closes [#6880](https://github.com/payloadcms/payload/issues/6880)
* retained date milliseconds ([#7393](https://github.com/payloadcms/payload/issues/7393)) ([9c9e689](https://github.com/payloadcms/payload/commit/9c9e6896a502de209c6cccf63cc5cfc0f0143bf3)), closes [#6108](https://github.com/payloadcms/payload/issues/6108)
* prevents `hasMany` text going outside of input boundaries ([#7454](https://github.com/payloadcms/payload/issues/7454)) ([1a0ef48](https://github.com/payloadcms/payload/commit/1a0ef4824b3d6548d36e7f28a2030640361c0655)), closes [#6034](https://github.com/payloadcms/payload/issues/6034)
* previousValue missing from ValidateOptions type ([#6931](https://github.com/payloadcms/payload/issues/6931)) ([fca5a40](https://github.com/payloadcms/payload/commit/fca5a404dbf3b440b428e55cf5e03db647f9a453))
* render singular label for `ArrayCell` when length is 1 ([#7585](https://github.com/payloadcms/payload/issues/7585)) ([fc4d24a](https://github.com/payloadcms/payload/commit/fc4d24aa8889ac9be76059a92478d5532b142b5c)), closes [#6099](https://github.com/payloadcms/payload/issues/6099)

## [2.25.0](https://github.com/payloadcms/payload/compare/v2.24.2...v2.25.0) (2024-07-26)


### Features

* allows metadata to be appended to the file of the output media ([#7295](https://github.com/payloadcms/payload/issues/7295)) ([3c5cce4](https://github.com/payloadcms/payload/commit/3c5cce4c6f108f87e87b091bbfec976423de73a2))
* **db-mongodb:** adds new optional `collation` feature flag behind mongodb collation option ([#7359](https://github.com/payloadcms/payload/issues/7359)) ([9750bc2](https://github.com/payloadcms/payload/commit/9750bc217ee7d63732a34908c84eb88b88dac0a8)), closes [#7349](https://github.com/payloadcms/payload/issues/7349)


### Bug Fixes

* properly handles `0` value number fields in list view ([#7364](https://github.com/payloadcms/payload/issues/7364)) ([5321098](https://github.com/payloadcms/payload/commit/5321098d7eada43838f6d5c69f3233c150fe0afa)), closes [#5510](https://github.com/payloadcms/payload/issues/5510)
* preserves objectids in deepCopyObject ([#7385](https://github.com/payloadcms/payload/issues/7385)) ([1348483](https://github.com/payloadcms/payload/commit/134848364801c72cc773ef7b48854306d1b9bac3))
* relaxes equality check for relationship options in filter ([#7344](https://github.com/payloadcms/payload/issues/7344)) ([468e544](https://github.com/payloadcms/payload/commit/468e5441f16775134d915ec7caddb17b817d3408))
* supports null values in query strings ([#5241](https://github.com/payloadcms/payload/issues/5241)) ([c57591b](https://github.com/payloadcms/payload/commit/c57591bc4fb8d28b7de16a111faffea7d3e11f8d))

## [2.24.2](https://github.com/payloadcms/payload/compare/v2.24.1...v2.24.2) (2024-07-24)


### Features

* **db-mongodb:** add jsonParse flag to mongooseAdapter that preserves existing, untracked MongoDB data types ([#7338](https://github.com/payloadcms/payload/issues/7338)) ([f96cf59](https://github.com/payloadcms/payload/commit/f96cf593cedcae0d8ed55f9a70e8e4e77917a876))


### Bug Fixes

* allow autosave relationship drawers to function properly ([#7325](https://github.com/payloadcms/payload/issues/7325)) ([69e7b7a](https://github.com/payloadcms/payload/commit/69e7b7a158c38058ece54a97bfa79e65192774a6))
* **db-mongodb:** removes precedence of regular chars over international chars in sort ([#6923](https://github.com/payloadcms/payload/issues/6923)) ([0058660](https://github.com/payloadcms/payload/commit/0058660b3f8bd820abb4494ff53fa67f49f0f6b4)), closes [#6719](https://github.com/payloadcms/payload/issues/6719)
* fetches and sets permissions before setting user ([#7337](https://github.com/payloadcms/payload/issues/7337)) ([8259611](https://github.com/payloadcms/payload/commit/8259611ce60e23f6298a07564d5f6dd2966d61ff))
* **plugin-stripe:** properly types async webhooks ([#7316](https://github.com/payloadcms/payload/issues/7316)) ([c6da99b](https://github.com/payloadcms/payload/commit/c6da99b4d1b986089bb697486a7825db66323078))

## [2.24.1](https://github.com/payloadcms/payload/compare/v2.24.0...v2.24.1) (2024-07-22)


### Bug Fixes

* aliases AfterMe, AfterLogout, and AfterRefresh hook types ([#7146](https://github.com/payloadcms/payload/issues/7146)) ([20377bb](https://github.com/payloadcms/payload/commit/20377bb22c867552e412c1cafd16869399aadd68))
* exports fallback hook types to ensure backwards compatibility ([#7217](https://github.com/payloadcms/payload/issues/7217)) ([1864577](https://github.com/payloadcms/payload/commit/18645771c86664f1246f0fb599c8265a4cd1d6c0))
* resizes images first before applying focal point ([#7278](https://github.com/payloadcms/payload/issues/7278)) ([1b208c7](https://github.com/payloadcms/payload/commit/1b208c7addf56ae8a1af5e408b001b3e5f080a38))
* uploads from drawer and focal point positioning ([#7244](https://github.com/payloadcms/payload/issues/7244)) ([0841d5a](https://github.com/payloadcms/payload/commit/0841d5a35ee00650c703231a08fc9a361861ba67))

## [2.24.0](https://github.com/payloadcms/payload/compare/v2.23.1...v2.24.0) (2024-07-16)


### Features

* adds ability to upload files from a remote url ([#7087](https://github.com/payloadcms/payload/issues/7087)) ([84d214f](https://github.com/payloadcms/payload/commit/84d214f99207ad78a466b8c16eb36e29f57cd0e3))
* **db-mongodb:** allows mongoose schemaOptions to be configured ([#7099](https://github.com/payloadcms/payload/issues/7099)) ([51474fa](https://github.com/payloadcms/payload/commit/51474fa661ae24ab8fc0d13001fafc0f35216c1e))


### Bug Fixes

* ensures access query runs with locale when present ([#6981](https://github.com/payloadcms/payload/issues/6981)) ([a5492af](https://github.com/payloadcms/payload/commit/a5492afad672e19dd35b1f5370b51f22656f334c))

## [2.23.1](https://github.com/payloadcms/payload/compare/v2.23.0...v2.23.1) (2024-06-28)

### Bug Fixes

* remove unused refresh arg, this affected me/refresh hooks ([#6976](https://github.com/payloadcms/payload/issues/6976)) ([c82d2ca](https://github.com/payloadcms/payload/commit/77e8ce980ef0bcb0380b499dd1ccdfd36199b707))

## [2.23.0](https://github.com/payloadcms/payload/compare/v2.22.2...v2.23.0) (2024-06-28)


### Features

* adds me and refresh hooks ([#6968](https://github.com/payloadcms/payload/issues/6968)) ([c82d2ca](https://github.com/payloadcms/payload/commit/c82d2caa29422083e97affc99a033296d78892d6))


### Bug Fixes

* **richtext-lexical:** html converters unnecessarily growing over time ([#6963](https://github.com/payloadcms/payload/issues/6963)) ([cf52d64](https://github.com/payloadcms/payload/commit/cf52d64d984d98ab782ca33f20b43c935ce60683))

## [2.22.2](https://github.com/payloadcms/payload/compare/v2.22.1...v2.22.2) (2024-06-26)


### Bug Fixes

* return exp and strategy from auth ([#6943](https://github.com/payloadcms/payload/issues/6943)) ([ea18735](https://github.com/payloadcms/payload/commit/ea18735d3b2d2a96989009130e3724aab487e520))

## [2.22.1](https://github.com/payloadcms/payload/compare/v2.22.0...v2.22.1) (2024-06-25)


### Bug Fixes

* graphql query concurrency issues ([#6857](https://github.com/payloadcms/payload/issues/6857)) ([bb911cc](https://github.com/payloadcms/payload/commit/bb911cc7eca1eeef15ade8eb043c0056c281e311))
* sends cropped image pixel values to server instead of percent values ([#6852](https://github.com/payloadcms/payload/issues/6852)) ([8747743](https://github.com/payloadcms/payload/commit/874774375f8beada9bac0a8ef3e77f63adc30834))

## [2.22.0](https://github.com/payloadcms/payload/compare/v2.21.0...v2.22.0) (2024-06-20)


### Features

* passes prev value through to validate functions ([#6805](https://github.com/payloadcms/payload/issues/6805)) ([0a51de7](https://github.com/payloadcms/payload/commit/0a51de7623d7c7790db52f0cc3e431b5ec3436f2))


### Bug Fixes

* adjust json field schema for defaultValue ([#6872](https://github.com/payloadcms/payload/issues/6872)) ([58427ff](https://github.com/payloadcms/payload/commit/58427ffae3e0c1159fae817850b4c1770f43b9b9))
* array row validation messages ([#6780](https://github.com/payloadcms/payload/issues/6780)) ([68ea693](https://github.com/payloadcms/payload/commit/68ea693a88714951661464917d5df10a416a5ca0))
* cannot use empty string in defaultValue on text-like fields ([#6842](https://github.com/payloadcms/payload/issues/6842)) ([3364385](https://github.com/payloadcms/payload/commit/336438506ce5e54065f59a0352531e0255f5313d))
* corrects redirect with lonely slash on login ([#6784](https://github.com/payloadcms/payload/issues/6784)) ([dae56e6](https://github.com/payloadcms/payload/commit/dae56e60eef9e6456d9c51e7fc3b995a32e56f5e))
* **db-postgres:** cascade delete FKs on hasMany relationships ([#6735](https://github.com/payloadcms/payload/issues/6735)) ([9ecc6c8](https://github.com/payloadcms/payload/commit/9ecc6c889929a07d1163919eac14c9b33b90208a))
* **payload, db-mongodb:** querying relationships with `in` & `not_in` ([#6773](https://github.com/payloadcms/payload/issues/6773)) ([f6ba3be](https://github.com/payloadcms/payload/commit/f6ba3befaeb02edca66f04fbc2ea91d2d2549d08)), closes [#6741](https://github.com/payloadcms/payload/issues/6741)
* **plugin-cloud-storage:** missing error handling for invalid plugin config, leading to unexpected webpack errors ([#6786](https://github.com/payloadcms/payload/issues/6786)) ([015aafd](https://github.com/payloadcms/payload/commit/015aafda758938028c37a96e9b5fe62902757b09))
* **ui:** withinCollapsible always false from useCollapsible provider ([#6783](https://github.com/payloadcms/payload/issues/6783)) ([9f0aaf0](https://github.com/payloadcms/payload/commit/9f0aaf066e76210a85faf43b2b5dc5129ccf3879)), closes [#6760](https://github.com/payloadcms/payload/issues/6760)
* unflattening json objects containing keys with periods ([#6834](https://github.com/payloadcms/payload/issues/6834)) ([025306f](https://github.com/payloadcms/payload/commit/025306f9e685c030956dad3b0f0158c1dce49668)), closes [#5378](https://github.com/payloadcms/payload/issues/5378)
* upgrade swc, fixing swc issues on linux ([#6809](https://github.com/payloadcms/payload/issues/6809)) ([1c986a9](https://github.com/payloadcms/payload/commit/1c986a98321163c921cb071a160b6fa9fc8bd9ee))


## [2.21.0](https://github.com/payloadcms/payload/compare/v2.20.0...v2.21.0) (2024-06-14)


### Features

* draft validation ([#6746](https://github.com/payloadcms/payload/issues/6746)) ([ff70fd9](https://github.com/payloadcms/payload/commit/ff70fd9813ec7dc14bf54d3457c25e145fe01699))


### Bug Fixes

* adjust version status pill when unpublished ([#6744](https://github.com/payloadcms/payload/issues/6744)) ([b7e8529](https://github.com/payloadcms/payload/commit/b7e852993beaaa465e38caa36e75e870819516b5))
* use correct time for isLocked check ([#6052](https://github.com/payloadcms/payload/issues/6052)) ([3b4bb30](https://github.com/payloadcms/payload/commit/3b4bb3065a6d2ac2f7d6aafd0fb4a35b580f3662))
* unable to save animated file types with undefined image sizes ([#6733](https://github.com/payloadcms/payload/issues/6733)) ([e40570b](https://github.com/payloadcms/payload/commit/e40570bd0d64660bb2ae5b5785b4c85c684ca9ab)), closes [#6727](https://github.com/payloadcms/payload/issues/6727)

## [2.20.0](https://github.com/payloadcms/payload/compare/v2.19.3...v2.20.0) (2024-06-11)


### Features

* **ui:** updates draft/published version pills ([#6732](https://github.com/payloadcms/payload/issues/6732)) ([ed86b15](https://github.com/payloadcms/payload/commit/ed86b15242ccbd737f3fe80103afc7d8c4cc6915))


### Bug Fixes

* adds multi select inputs for `number` & `text` fields in where builder ([#6662](https://github.com/payloadcms/payload/issues/6662)) ([e3003b4](https://github.com/payloadcms/payload/commit/e3003b443fd3b472670ade228c174c7f755b1732))
* create sharp file for `fileHasAdjustments` files or `fileIsAnimated` files ([#6710](https://github.com/payloadcms/payload/issues/6710)) ([921a5c0](https://github.com/payloadcms/payload/commit/921a5c065d6089f0118ad8be7adbf75614c8db9c))
* enable SaveDraft button when creating new documents ([#6672](https://github.com/payloadcms/payload/issues/6672)) ([63bc6ae](https://github.com/payloadcms/payload/commit/63bc6ae52f63adf98f442c2d7992461e7f5f86e4)), closes [#6671](https://github.com/payloadcms/payload/issues/6671) [/github.com/payloadcms/payload/commit/8f03cd7c789eda7613ddced0d45a32afe49b1e01#diff-b7c978f47b1f3beff95c78ad95078e600624cbcd7ac10f9378cc4ad6803db244L75-R79](https://github.com/payloadcms//github.com/payloadcms/payload/commit/8f03cd7c789eda7613ddced0d45a32afe49b1e01/issues/diff-b7c978f47b1f3beff95c78ad95078e600624cbcd7ac10f9378cc4ad6803db244L75-R79)
* handles localized nested relationship fields in versions ([#6679](https://github.com/payloadcms/payload/issues/6679)) ([8a62298](https://github.com/payloadcms/payload/commit/8a622984e7ce4a2439d5d63e2689404652f8c96b))
* live preview device position when using zoom ([#6667](https://github.com/payloadcms/payload/issues/6667)) ([9525511](https://github.com/payloadcms/payload/commit/9525511e8bc6bc3fbd7e21e36596404604f1c109))
* only use `metadata.pages` for height if animated ([#6729](https://github.com/payloadcms/payload/issues/6729)) ([2f9ed34](https://github.com/payloadcms/payload/commit/2f9ed34d13d94070db40b1eabd04655d2e13e094))
* removes `array` & `blocks` & `group` fields from sort ([#6574](https://github.com/payloadcms/payload/issues/6574)) ([507e095](https://github.com/payloadcms/payload/commit/507e0954b2743012f0b53c396d49461120a02b1a)), closes [#6469](https://github.com/payloadcms/payload/issues/6469)
* withinCollapsible should be undefined by default ([#6666](https://github.com/payloadcms/payload/issues/6666)) ([37c8386](https://github.com/payloadcms/payload/commit/37c8386a51172966057df3477517d160e1c4a9a7)), closes [#6658](https://github.com/payloadcms/payload/issues/6658)

## [2.19.3](https://github.com/payloadcms/payload/compare/v2.19.2...v2.19.3) (2024-06-07)


### Bug Fixes

* scopes uploadEdits to documents, hoists action to doc provider ([#6664](https://github.com/payloadcms/payload/issues/6664)) ([373cb00](https://github.com/payloadcms/payload/commit/373cb0013902b52aba455542e10402316da4b2f4))

## [2.19.2](https://github.com/payloadcms/payload/compare/v2.19.1...v2.19.2) (2024-06-06)


### Bug Fixes

* cascade draft arg when querying globals with graphql ([#6651](https://github.com/payloadcms/payload/issues/6651)) ([ac8c209](https://github.com/payloadcms/payload/commit/ac8c2096af641a6886e4543ee65c9790e45f080f))
* filtered out `disableListColumn` fields reappeared after toggling other fields ([#6636](https://github.com/payloadcms/payload/issues/6636)) ([626be15](https://github.com/payloadcms/payload/commit/626be155784dda181276bb87617433822a0accf3))
* resizing animated images ([#6621](https://github.com/payloadcms/payload/issues/6621)) ([67c0b0e](https://github.com/payloadcms/payload/commit/67c0b0e6e0b5b190f6a916b59ba02f8c18479e18)), closes [#2181](https://github.com/payloadcms/payload/issues/2181) [#6146](https://github.com/payloadcms/payload/issues/6146)

## [2.19.1](https://github.com/payloadcms/payload/compare/v2.19.0...v2.19.1) (2024-06-04)


### Bug Fixes

* override ajv dependency version to 8.14.0 wherever possible ([#6618](https://github.com/payloadcms/payload/issues/6618)) ([e44ce81](https://github.com/payloadcms/payload/commit/e44ce819cefddeaaf20b2b7ce804e94a9272baf1))

## [2.19.0](https://github.com/payloadcms/payload/compare/v2.18.3...v2.19.0) (2024-06-04)


### Features

* **translations:** update Turkish translations ([#5738](https://github.com/payloadcms/payload/issues/5738)) ([4fddea8](https://github.com/payloadcms/payload/commit/4fddea86ebd5f21705be2310f8b7053d31109189))


### Bug Fixes

* adds new `userEmailAlreadyRegistered` translations ([#6549](https://github.com/payloadcms/payload/issues/6549)) ([56c6700](https://github.com/payloadcms/payload/commit/56c6700cf25570cc217e28dc69459a3b81adbced)), closes [#6535](https://github.com/payloadcms/payload/issues/6535)
* adjusts sizing of remove/add buttons to be same size ([#6527](https://github.com/payloadcms/payload/issues/6527)) ([a352ebc](https://github.com/payloadcms/payload/commit/a352ebc5520bbd0f6a9caef068825976dba05ded)), closes [#6098](https://github.com/payloadcms/payload/issues/6098)
* focalPoint undefined handling ([#6552](https://github.com/payloadcms/payload/issues/6552)) ([fcfc3c5](https://github.com/payloadcms/payload/commit/fcfc3c593f69f63c51f8aa09973fcacbfbe04952))
* pagination on polymorphic relationship field requesting entries with page parameter set to NaN ([#5366](https://github.com/payloadcms/payload/issues/5366)) ([547acfe](https://github.com/payloadcms/payload/commit/547acfe876bdf0df2ce808941f72b690c9dbcae3))
* safely evaluates `field.admin` in WhereBuilder ([#6534](https://github.com/payloadcms/payload/issues/6534)) ([4f9d78d](https://github.com/payloadcms/payload/commit/4f9d78df5e38f3f70852bb6de47cff619f57c648))
* separate sort and search fields when looking up relationship. ([#5964](https://github.com/payloadcms/payload/issues/5964)) ([c009219](https://github.com/payloadcms/payload/commit/c0092191a6ded1098a94d9f48918ab79171e5e32)), closes [#4815](https://github.com/payloadcms/payload/issues/4815) [#5222](https://github.com/payloadcms/payload/issues/5222)
* ui field validation error with `admin.disableListColumn` property ([#6530](https://github.com/payloadcms/payload/issues/6530)) ([eeddece](https://github.com/payloadcms/payload/commit/eeddeceda988d7a4ce8ad31d3036a4ee84aceec3)), closes [#6521](https://github.com/payloadcms/payload/issues/6521)
* **ui:** blocks browser save dialog from opening when hotkey used with no changes ([#6365](https://github.com/payloadcms/payload/issues/6365)) ([8f03cd7](https://github.com/payloadcms/payload/commit/8f03cd7c789eda7613ddced0d45a32afe49b1e01)), closes [#214](https://github.com/payloadcms/payload/issues/214)

## [2.18.3](https://github.com/payloadcms/payload/compare/v2.18.2...v2.18.3) (2024-05-17)


### Bug Fixes

* **db-postgres:** query with like on id columns ([#6416](https://github.com/payloadcms/payload/issues/6416)) ([bf77cec](https://github.com/payloadcms/payload/commit/bf77cec7e9e7db4988e481d464178636203fca32))
* **db-postgres:** uuid custom db name ([#6409](https://github.com/payloadcms/payload/issues/6409)) ([db5f3f3](https://github.com/payloadcms/payload/commit/db5f3f3ccdaedd9e8036c3e39fc20650a309a151))
* nested `disableListColumn` in rows ([#6412](https://github.com/payloadcms/payload/issues/6412)) ([ab8b2f3](https://github.com/payloadcms/payload/commit/ab8b2f3fb87864484582b7d819ca307888a9449b)), closes [#6407](https://github.com/payloadcms/payload/issues/6407)

## [2.18.2](https://github.com/payloadcms/payload/compare/v2.18.1...v2.18.2) (2024-05-17)


### Bug Fixes

* allow focal point when no sizes defined ([#6397](https://github.com/payloadcms/payload/issues/6397)) ([88e113a](https://github.com/payloadcms/payload/commit/88e113a5452300434f690186d10ea02ab159ffc3))

## [2.18.1](https://github.com/payloadcms/payload/compare/v2.18.0...v2.18.1) (2024-05-16)


### Bug Fixes

* add back explicit crop x and y values ([#6391](https://github.com/payloadcms/payload/issues/6391)) ([e76df32](https://github.com/payloadcms/payload/commit/e76df32f0987cc92dc8d9c693950e650c52576bf))

## [2.18.0](https://github.com/payloadcms/payload/compare/v2.17.0...v2.18.0) (2024-05-16)


### Features

* store focal point on uploads ([#6364](https://github.com/payloadcms/payload/issues/6364)) ([82b88a3](https://github.com/payloadcms/payload/commit/82b88a315ff1d52f0b19a70224d5c600a3a97eb5))


### Bug Fixes

* **db-postgres:** filter with ID not_in AND queries - postgres ([#6358](https://github.com/payloadcms/payload/issues/6358)) ([cc94078](https://github.com/payloadcms/payload/commit/cc940786072c0065f10fdd2893050bddc4595a21)), closes [#5151](https://github.com/payloadcms/payload/issues/5151)
* **richtext-lexical:** upload, relationship and block node insertion fails sometimes ([#6390](https://github.com/payloadcms/payload/issues/6390)) ([48a410e](https://github.com/payloadcms/payload/commit/48a410e294598af9c73577a04f86466248f93da0))

## [2.17.0](https://github.com/payloadcms/payload/compare/v2.16.1...v2.17.0) (2024-05-15)


### Features

* adds misc translations to API view and react select ([#6138](https://github.com/payloadcms/payload/issues/6138)) ([30e535b](https://github.com/payloadcms/payload/commit/30e535b5b929dddead007d8a9adca62808595e2c))

* **richtext-lexical:** remove LexicalBlock, RichTextFieldRequiredEditor and FieldWithRichTextRequiredEditor types ([#6279](https://github.com/payloadcms/payload/issues/6279)) ([9df5ab8](https://github.com/payloadcms/payload/commit/9df5ab8a10a35ad34615d7e4da024f59ff037e0e))

### Bug Fixes

* appends `editDepth` value to `radio` & `checkbox` IDs when inside drawer ([#6181](https://github.com/payloadcms/payload/issues/6181)) ([69c93d3](https://github.com/payloadcms/payload/commit/69c93d3c62394a5cf995a2eaec9a3ab30e0f77af))
* collection labels with locales not working when creating new doc ([#5995](https://github.com/payloadcms/payload/issues/5995)) ([51efe4f](https://github.com/payloadcms/payload/commit/51efe4f39bcaadccb109a2a02a690ca65041ee57))
* safely access cookie header for uploads ([#6367](https://github.com/payloadcms/payload/issues/6367)) ([de92c50](https://github.com/payloadcms/payload/commit/de92c50847640661f915455f8db0029873ddc7ab))
* step-nav breadcrumbs ellipsis ([#6345](https://github.com/payloadcms/payload/issues/6345)) ([d02b1fb](https://github.com/payloadcms/payload/commit/d02b1fb084e636e49122ad55b25b9c49eb761f1c))
*
### ⚠ BREAKING CHANGES

* **richtext-lexical:** remove LexicalBlock, RichTextFieldRequiredEditor and FieldWithRichTextRequiredEditor types (#6279)

## [2.16.1](https://github.com/payloadcms/payload/compare/v2.16.0...v2.16.1) (2024-05-07)


### Features

* **richtext-lexical:** add maxDepth property to various lexical features ([#6250](https://github.com/payloadcms/payload/issues/6250)) ([857b9a4](https://github.com/payloadcms/payload/commit/857b9a4ac3236c740458750f156a3a4274eda210)), closes [#6242](https://github.com/payloadcms/payload/issues/6242)


### Bug Fixes

* **richtext-lexical:** export missing HorizontalRuleFeature ([#6236](https://github.com/payloadcms/payload/issues/6236)) ([f829b08](https://github.com/payloadcms/payload/commit/f829b084ba9649ef596cce4a7bf6ae8c7ccf57e3))

## [2.16.0](https://github.com/payloadcms/payload/compare/v2.15.0...v2.16.0) (2024-05-06)


### Features

* adds disableListColumn, disableListFilter to fields admin props ([#6188](https://github.com/payloadcms/payload/issues/6188)) ([db4aace](https://github.com/payloadcms/payload/commit/db4aacebb801f1cc11ef8732f9f3b78475256641))


### Bug Fixes

* graphql upload relations returning null ([#6233](https://github.com/payloadcms/payload/issues/6233)) ([cac52da](https://github.com/payloadcms/payload/commit/cac52da638a0df4356120a2f61c6aaf25641a5ad))
* hide drag handles when `admin.isSortable: false` ([#6225](https://github.com/payloadcms/payload/issues/6225)) ([622cdb0](https://github.com/payloadcms/payload/commit/622cdb044002b2c3182c3b0432b51befbfb9b979))
* **plugin-form-builder:** hook overrides not working as intended ([#6203](https://github.com/payloadcms/payload/issues/6203)) ([b735d6a](https://github.com/payloadcms/payload/commit/b735d6aa169acca8cb638859d2c8ba43e315f02c))

## [2.15.0](https://github.com/payloadcms/payload/compare/v2.14.2...v2.15.0) (2024-05-03)


### Features

* add isSortable to arrays and blocks ([#5962](https://github.com/payloadcms/payload/issues/5962)) ([5c58bd3](https://github.com/payloadcms/payload/commit/5c58bd322da966fe610959df13dfd49add35a2ef))
* use filterOptions in list relationship filter ([#6156](https://github.com/payloadcms/payload/issues/6156)) ([23f3eb1](https://github.com/payloadcms/payload/commit/23f3eb1cf0b75a4044319d7cd3e5000d5b4e42c4))


### Bug Fixes

* bulk publish from collection list ([#6063](https://github.com/payloadcms/payload/issues/6063)) ([84570e6](https://github.com/payloadcms/payload/commit/84570e6e3bbb81fcae80da92b01bc56d09906072))
* cascade draft arg in nested GraphQL relationship queries ([#6141](https://github.com/payloadcms/payload/issues/6141)) ([a8ac8b4](https://github.com/payloadcms/payload/commit/a8ac8b463349664f3188ae77217f037da72f796b))
* GraphQL nested relationships not respecting req locale ([#6117](https://github.com/payloadcms/payload/issues/6117)) ([3fccd34](https://github.com/payloadcms/payload/commit/3fccd34abe5a332f88f5e950b755cd1d21441fb6))
* hide unusable fields from collection filter select ([#6135](https://github.com/payloadcms/payload/issues/6135)) ([2be5ad0](https://github.com/payloadcms/payload/commit/2be5ad0ebafd1d3c1c0567e2085ccfd593f18271))
* incorrect `localesNotSaved` translation ([#5996](https://github.com/payloadcms/payload/issues/5996)) ([af67749](https://github.com/payloadcms/payload/commit/af67749e49db92e675b63b52190e562468894706))
* **plugin-cloud:** purge cache for all sizes ([#5301](https://github.com/payloadcms/payload/issues/5301)) ([831f1ff](https://github.com/payloadcms/payload/commit/831f1ff5bed7e083cc076e9eb5ff9a2b2f1ed710))
* properly adds `readonly` styles to disabled `radio` fields ([#6176](https://github.com/payloadcms/payload/issues/6176)) ([9b7e62d](https://github.com/payloadcms/payload/commit/9b7e62dc20dca7402c6c68dfb8a5995c211993af))
* resets filter state when param state change within route ([#6169](https://github.com/payloadcms/payload/issues/6169)) ([6e38cc2](https://github.com/payloadcms/payload/commit/6e38cc2bcfb08b608abcb6aac4b4c1f6eea63428))
* **richtext-lexical:** drag and add block handles disappear too quickly for smaller screen sizes. ([#6145](https://github.com/payloadcms/payload/issues/6145)) ([24f6972](https://github.com/payloadcms/payload/commit/24f697219b5071d91a5c37aafb50e2d823b68d4c))
* **richtext-lexical:** floating toolbar caret positioned incorrectly for some line heights ([#6151](https://github.com/payloadcms/payload/issues/6151)) ([36b1f5a](https://github.com/payloadcms/payload/commit/36b1f5a763f782c140e62aa062b4077d6efd0738))
* sanitizes fields in default edit view for drawer content ([#6175](https://github.com/payloadcms/payload/issues/6175)) ([43dab5c](https://github.com/payloadcms/payload/commit/43dab5c7053831a0c71f3a6860113f653cab674f))
* version restoration ([#6039](https://github.com/payloadcms/payload/issues/6039)) ([91bac9c](https://github.com/payloadcms/payload/commit/91bac9c0aa1ff3da052b9c2ad83fa5ac23a16d1d))

## [2.14.2](https://github.com/payloadcms/payload/compare/v2.14.1...v2.14.2) (2024-04-26)


### Bug Fixes

* **deps:** dedupes react ([#6058](https://github.com/payloadcms/payload/issues/6058)) ([d0ba694](https://github.com/payloadcms/payload/commit/d0ba694c80a1b699c4f2cad98b1f0bde1f0d43ca))

## [2.14.1](https://github.com/payloadcms/payload/compare/v2.14.0...v2.14.1) (2024-04-25)


### Bug Fixes

* **db-postgres:** cumulative updates ([#6033](https://github.com/payloadcms/payload/issues/6033)) ([c31b8dc](https://github.com/payloadcms/payload/commit/c31b8dcaa0c43132d8a01e0cc43094f466cc9168))
* disable api key checkbox does not remove api key ([#6017](https://github.com/payloadcms/payload/issues/6017)) ([0ffdcc6](https://github.com/payloadcms/payload/commit/0ffdcc685f4e917a02e62dbaccec7cc8ebbf695d))
* **richtext-lexical:** minimize the amount of times sanitizeFields is called ([#6018](https://github.com/payloadcms/payload/issues/6018)) ([60372fa](https://github.com/payloadcms/payload/commit/60372faf36b7f6d92a61ccbaee0f528e50f5a51a))

## [2.14.0](https://github.com/payloadcms/payload/compare/v2.13.0...v2.14.0) (2024-04-24)


### Features

* add count operation to collections ([#5936](https://github.com/payloadcms/payload/issues/5936)) ([c380dee](https://github.com/payloadcms/payload/commit/c380deee4a1db82bce9fea264060000957a53eee))

### Bug Fixes

* bulk publish ([#6006](https://github.com/payloadcms/payload/issues/6006)) ([c11600a](https://github.com/payloadcms/payload/commit/c11600aac38cd67019765faf2a41e62df13e50cc))
* **db-postgres:** extra version suffix added to table names ([#5939](https://github.com/payloadcms/payload/issues/5939)) ([bd8b512](https://github.com/payloadcms/payload/commit/bd8b5123b0991e53eb209315897dbca10d14d45e))
* **db-postgres:** Fixes nested groups inside nested blocks ([#5882](https://github.com/payloadcms/payload/issues/5882)) ([e258866](https://github.com/payloadcms/payload/commit/e25886649fce414d5d47918f35ba2d4d2ba59174))
* **db-postgres:** row table names were not being built properly - v2 ([#5961](https://github.com/payloadcms/payload/issues/5961)) ([9152a23](https://github.com/payloadcms/payload/commit/9152a238d2982503e7f509350651b0ba3f83b1ec))
* header filters ([#5997](https://github.com/payloadcms/payload/issues/5997)) ([ad01c67](https://github.com/payloadcms/payload/commit/ad01c6784d283386dc819dfcd47455cad5accfaa))
* min/max attributes missing from number input ([#5779](https://github.com/payloadcms/payload/issues/5779)) ([985796b](https://github.com/payloadcms/payload/commit/985796be54b593af0a4934685ab8621b9badda10))
* removes `equals` & `not_equals` operators from fields with `hasMany` ([#5885](https://github.com/payloadcms/payload/issues/5885)) ([a8c9625](https://github.com/payloadcms/payload/commit/a8c9625cdec33476a5da87bcd9f010f9d7fb9a94))

## [2.13.0](https://github.com/payloadcms/payload/compare/v2.12.1...v2.13.0) (2024-04-19)


### Features

* allow configuration for setting headers on external file fetch ([ec1ad0b](https://github.com/payloadcms/payload/commit/ec1ad0b6628d400d7435821c8a72b6746bf87577))
* **db-\*:** custom db table and enum names ([#5045](https://github.com/payloadcms/payload/issues/5045)) ([9bbacc4](https://github.com/payloadcms/payload/commit/9bbacc4fb1ad247634f394e95c42ee3adade8048))
* json field schemas ([#5726](https://github.com/payloadcms/payload/issues/5726)) ([2c402cc](https://github.com/payloadcms/payload/commit/2c402cc65c9e8f7f33e2fb0ce5e1a8ceff52af1b))
* **plugin-seo:** add Chinese translation ([#5429](https://github.com/payloadcms/payload/issues/5429)) ([fcb29bb](https://github.com/payloadcms/payload/commit/fcb29bb1c637867301bbc1070b4a84383bf0e90a))
* **richtext-lexical:** add HorizontalRuleFeature ([d8e9084](https://github.com/payloadcms/payload/commit/d8e9084db21828968046ab59775633e409ce5c2a))
* **richtext-lexical:** improve floating handle y-positioning by positioning it in the center for smaller elements. ([0055a8e](https://github.com/payloadcms/payload/commit/0055a8eb36b95722cccdc5eb3101a79d3e764f8b))


### Bug Fixes

* adds type error validations for `email` and `password` in login operation ([#4852](https://github.com/payloadcms/payload/issues/4852)) ([1f00360](https://github.com/payloadcms/payload/commit/1f0036054a9461535b0992f2449e91e4eaf97d4e))
* avoids getting and setting doc preferences when creating new ([#5757](https://github.com/payloadcms/payload/issues/5757)) ([e3c3dda](https://github.com/payloadcms/payload/commit/e3c3ddac34dff8fa085f5b702be2838d513be300))
* block field type missing dbName ([#5695](https://github.com/payloadcms/payload/issues/5695)) ([e7608f5](https://github.com/payloadcms/payload/commit/e7608f5507d3b85ea3f44b5cb1f43edf67608b1b))
* **db-mongodb:** failing `contains` query with special chars ([#5774](https://github.com/payloadcms/payload/issues/5774)) ([5fa99fb](https://github.com/payloadcms/payload/commit/5fa99fb060cabbb69b5d6688748260e562e6bea3))
* **db-mongodb:** ignore end session errors ([#5904](https://github.com/payloadcms/payload/issues/5904)) ([cb8d562](https://github.com/payloadcms/payload/commit/cb8d562132bee437798880e1d7f64dbfdee36949))
* **db-mongodb:** version fields indexSortableFields ([#5863](https://github.com/payloadcms/payload/issues/5863)) ([fe0028c](https://github.com/payloadcms/payload/commit/fe0028c89945303a431b48efdae7b6e22304c8a3))
* **db-postgres:** hasMany relationship query contains operator ([#4212](https://github.com/payloadcms/payload/issues/4212)) ([608d6d0](https://github.com/payloadcms/payload/commit/608d6d0a872af224ea42c3e6c8a3b4f21678f550))
* **db-postgres:** issue querying by localised relationship not respecting locale as constraint ([#5666](https://github.com/payloadcms/payload/issues/5666)) ([44599cb](https://github.com/payloadcms/payload/commit/44599cbc7b8f23d6d8c7a3e05466237406812a6d))
* **db-postgres:** query hasMany fields with in ([#5881](https://github.com/payloadcms/payload/issues/5881)) ([6185f8a](https://github.com/payloadcms/payload/commit/6185f8a5d845d12651f5a3ee128eb43d3b9d2449))
* **db-postgres:** relationship query pagination ([#5802](https://github.com/payloadcms/payload/issues/5802)) ([65690a6](https://github.com/payloadcms/payload/commit/65690a675c17cfacebe775a327a57741ac09416a))
* **db-postgres:** validateExistingBlockIsIdentical localized ([#5839](https://github.com/payloadcms/payload/issues/5839)) ([4c4f924](https://github.com/payloadcms/payload/commit/4c4f924e90ee23a73c9a7cc7e69bbc2caf902b92))
* duplicate document multiple times in quick succession ([#5642](https://github.com/payloadcms/payload/issues/5642)) ([373787d](https://github.com/payloadcms/payload/commit/373787de31cbbd33b587aa4be6344948f082f5bb))
* missing date locales ([#5656](https://github.com/payloadcms/payload/issues/5656)) ([c1c8600](https://github.com/payloadcms/payload/commit/c1c86009a5e9aad401a05f7c63ad37bd3f88dc84))
* number ids were not sanitized to number in rest api ([51f84a4](https://github.com/payloadcms/payload/commit/51f84a4fcfd437eb73c7d83205b66e3620085909))
* passes parent id instead of incoming id to saveVersion ([#5831](https://github.com/payloadcms/payload/issues/5831)) ([25c9a14](https://github.com/payloadcms/payload/commit/25c9a145bec9e9566d2bbcba59d5b34394e10bbd))
* **plugin-seo:** uses correct key for ukrainian translation ([#5873](https://github.com/payloadcms/payload/issues/5873)) ([e47e544](https://github.com/payloadcms/payload/commit/e47e544364031ac834565a4d86ef6ec9c04e63c0))
* properly handle drafts in bulk update ([#5872](https://github.com/payloadcms/payload/issues/5872)) ([ad38f76](https://github.com/payloadcms/payload/commit/ad38f760111abf947c6b0ee4b983ee1224a9bf1b))
* req.collection being lost when querying a global inside a collection ([#5727](https://github.com/payloadcms/payload/issues/5727)) ([cbd03ed](https://github.com/payloadcms/payload/commit/cbd03ed2f8819ee8ac20e8739cc03e88ff4caa25))
* **richtext-lexical:** catch errors that may occur during HTML generation ([#5754](https://github.com/payloadcms/payload/issues/5754)) ([9b44296](https://github.com/payloadcms/payload/commit/9b442960929d00faa07f1383b1267f71e6f44efe))
* **richtext-lexical:** do not allow omitting editor prop for sub-richtext fields within lexical defined in the payload config ([#5766](https://github.com/payloadcms/payload/issues/5766)) ([6186493](https://github.com/payloadcms/payload/commit/6186493246157b4d4b33c8c47378f08581315942))
* **richtext-lexical:** incorrect floating handle y-position calculation next to certain kinds of HTML elements like HR ([de5d6cc](https://github.com/payloadcms/payload/commit/de5d6cc4bd591745156f0b8c56795b7bd2eaad7e))
* **richtext-lexical:** limit unnecessary floating handle positioning updates ([a00439e](https://github.com/payloadcms/payload/commit/a00439ea893e074d64be83ee6af1e780178a7ee3))
* **richtext-lexical:** pass through config for schema generation. Makes it more robust ([#5700](https://github.com/payloadcms/payload/issues/5700)) ([cf135fd](https://github.com/payloadcms/payload/commit/cf135fd1e4aeb30121281399e26be901393ada6d))
* **richtext-lexical:** use correct nodeType on HorizontalRule feature HTML converter ([#5805](https://github.com/payloadcms/payload/issues/5805)) ([3b1d331](https://github.com/payloadcms/payload/commit/3b1d3313165499616673f6d363c90ef884994525))
* updates type name of `CustomPublishButtonProps` to `CustomPublishButtonType` ([#5644](https://github.com/payloadcms/payload/issues/5644)) ([7df7bf4](https://github.com/payloadcms/payload/commit/7df7bf448bd26e870a1fde8aaa47430904d68366))
* updates var ([9530d28](https://github.com/payloadcms/payload/commit/9530d28a6760a667b718027a49ea43ba1accd546))
* use isolateObjectProperty function in createLocalReq ([#5748](https://github.com/payloadcms/payload/issues/5748)) ([c0ba6cc](https://github.com/payloadcms/payload/commit/c0ba6cc19a20c043a08ca77caacd47ef7cfb48f4))
* uses find instead of fieldIndex for custom ID check ([509ec67](https://github.com/payloadcms/payload/commit/509ec677c42993d9c08facf6928a5ef1e9767508))

### ⚠ BREAKING CHANGES

* **richtext-lexical:** do not allow omitting editor prop for sub-richtext fields within lexical defined in the payload config ([#5766](https://github.com/payloadcms/payload/issues/5766))

## [2.12.1](https://github.com/payloadcms/payload/compare/v2.12.0...v2.12.1) (2024-04-03)


### Bug Fixes

* Skip parsing if operator is 'exist' ([#5404](https://github.com/payloadcms/payload/issues/5404)) ([742a7af](https://github.com/payloadcms/payload/commit/742a7af93d2e9ef4d41ee093cef875322792ae72))
* updates colors of tooltip in light mode ([#5632](https://github.com/payloadcms/payload/issues/5632)) ([a7e7c92](https://github.com/payloadcms/payload/commit/a7e7c9276835e0a35a18daccb218c901ca2fdd8c))

## [2.12.0](https://github.com/payloadcms/payload/compare/v2.11.2...v2.12.0) (2024-04-03)


### Features

* **plugin-seo:** adds Norwegian translation ([#5621](https://github.com/payloadcms/payload/issues/5621)) ([589b492](https://github.com/payloadcms/payload/commit/589b492b2e6bc578e6f17649ff6d936ffd88b8b5))
* **richtext-*:** add ability to provide custom Field and Error components ([#5574](https://github.com/payloadcms/payload/issues/5574)) ([02d2c51](https://github.com/payloadcms/payload/commit/02d2c517176a775c6eeb4b164d9e6b45d8f5e4c1))


### Bug Fixes

* **db-postgres:** error on delete having joins ([#5459](https://github.com/payloadcms/payload/issues/5459)) ([9169230](https://github.com/payloadcms/payload/commit/916923071a2c28077326bfd2059d1665ef47e94f))
* image resize tiff files ([#5415](https://github.com/payloadcms/payload/issues/5415)) ([8184e00](https://github.com/payloadcms/payload/commit/8184e0005af1b6da93d0921c31547515a4ce6343))
* number field with hasMany accept defaultValue array ([#5618](https://github.com/payloadcms/payload/issues/5618)) ([a3ae416](https://github.com/payloadcms/payload/commit/a3ae4160850290c194bb228e1fbeb8c7533cead3))
* regression of filterOptions using different transaction ([#5169](https://github.com/payloadcms/payload/issues/5169)) ([3ceb6ef](https://github.com/payloadcms/payload/commit/3ceb6efd32cfa9556c6656469fa43d61d7679b1d))
* **richtext-lexical:** Blocks: generated output schema is not fully correct ([#5259](https://github.com/payloadcms/payload/issues/5259)) ([e7f6bfb](https://github.com/payloadcms/payload/commit/e7f6bfbe9da4cab42c7ec7019371d5e79af17ec9))
* **richtext-lexical:** checklist html converter incorrectly outputting children ([#5570](https://github.com/payloadcms/payload/issues/5570)) ([2e5400f](https://github.com/payloadcms/payload/commit/2e5400fa7a5ac7441e00134a7f4299022228f64f))
* **richtext-lexical:** disable instanceof HTMLImageElement check as it causes issues when used on the server ([2164dcc](https://github.com/payloadcms/payload/commit/2164dcc594b5c16d7111b71cdb01f5f7aaa7e127))
* **richtext-lexical:** Link: add open-in-new-tab to html converter ([23df60d](https://github.com/payloadcms/payload/commit/23df60dba5682255ce6f60e3ee8e6901f6a70c7b))
* **richtext-lexical:** properly center add- and drag-block handles ([#5568](https://github.com/payloadcms/payload/issues/5568)) ([48dc116](https://github.com/payloadcms/payload/commit/48dc116f57113c3124ff93a50fa1189053e21d76))
* sets beforeValidateHook req type to required ([#5608](https://github.com/payloadcms/payload/issues/5608)) ([e10d5df](https://github.com/payloadcms/payload/commit/e10d5df0b2dd21b86cce44d0e36b31e9d3411b39))

## [2.11.2](https://github.com/payloadcms/payload/compare/v2.11.1...v2.11.2) (2024-02-23)


### Features

* **db-postgres:** configurable custom schema to use ([#5047](https://github.com/payloadcms/payload/issues/5047)) ([e8f2ca4](https://github.com/payloadcms/payload/commit/e8f2ca484ee56cd7767d5111e46ebd24752ff8de))


### Bug Fixes

* Add Context Provider in EditMany Component ([#5005](https://github.com/payloadcms/payload/issues/5005)) ([70e57fe](https://github.com/payloadcms/payload/commit/70e57fef184f7fcf56344ea755465f246f2253a5))
* **db-mongodb:** unique sparse for not required fields ([#5114](https://github.com/payloadcms/payload/issues/5114)) ([815bdfa](https://github.com/payloadcms/payload/commit/815bdfac0b0afbff2a20e54d5aee64b90f6b3a77))
* **db-postgres:** set _parentID for array nested localized fields ([#5117](https://github.com/payloadcms/payload/issues/5117)) ([ceca5c4](https://github.com/payloadcms/payload/commit/ceca5c4e97f53f1346797a31b6abfc0375e98215))
* disabling API Key does not remove the key ([#5145](https://github.com/payloadcms/payload/issues/5145)) ([7a7f0ed](https://github.com/payloadcms/payload/commit/7a7f0ed7e8132253be607c111c160163b84bd770))
* handle thrown errors in config-level afterError hook ([#5147](https://github.com/payloadcms/payload/issues/5147)) ([32ed95e](https://github.com/payloadcms/payload/commit/32ed95e1ee87409db234f1b7bd6d2e462fd9ed5d))
* only replace the drawer content with full edit component if it exists ([#5144](https://github.com/payloadcms/payload/issues/5144)) ([0a07f60](https://github.com/payloadcms/payload/commit/0a07f607b9fb1217ad956cd05b2a84a4042a19ca))
* transaction error from access endpoint ([#5156](https://github.com/payloadcms/payload/issues/5156)) ([ad42d54](https://github.com/payloadcms/payload/commit/ad42d541b342ed56463b81cee6d6307df6f06d7f))

## [2.11.1](https://github.com/payloadcms/payload/compare/v2.11.0...v2.11.1) (2024-02-16)


### Features

* **db-postgres:** adds idType to use uuid or serial id columns ([#3864](https://github.com/payloadcms/payload/issues/3864)) ([d6c2578](https://github.com/payloadcms/payload/commit/d6c25783cfa97983bf9db27ceb5ccd39a62c62f1))
* **db-postgres:** reconnect after disconnection from database ([#5086](https://github.com/payloadcms/payload/issues/5086)) ([bf942fd](https://github.com/payloadcms/payload/commit/bf942fdfa6ea9c26cf05295cc9db646bf31fa622))
* **plugin-search:** add req to beforeSync args for transactions ([#5068](https://github.com/payloadcms/payload/issues/5068)) ([98b87e2](https://github.com/payloadcms/payload/commit/98b87e22782c0a788f79326f22be05a6b176ad74))
* **richtext-lexical:** add justify aligment to AlignFeature ([#4035](https://github.com/payloadcms/payload/issues/4035)) ([#4868](https://github.com/payloadcms/payload/issues/4868)) ([6d6823c](https://github.com/payloadcms/payload/commit/6d6823c3e5609a58eeeeb8d043945a762f9463df))
* **richtext-lexical:** AddBlock handle for all nodes, even if they aren't empty paragraphs ([#5063](https://github.com/payloadcms/payload/issues/5063)) ([00fc034](https://github.com/payloadcms/payload/commit/00fc0343dabf184d5bab418d47c403b3ad11698f))
* **richtext-lexical:** Update lexical from 0.12.6 to 0.13.1, port over all useful changes from playground ([#5066](https://github.com/payloadcms/payload/issues/5066)) ([0d18822](https://github.com/payloadcms/payload/commit/0d18822062275c1826c8e2c3da2571a2b3483310))


### Bug Fixes

* **db-mongodb:** find versions pagination ([#5091](https://github.com/payloadcms/payload/issues/5091)) ([5d4022f](https://github.com/payloadcms/payload/commit/5d4022f1445e2809c01cb1dd599280f0a56cdc6e))
* **db-postgres:** query using blockType ([#5044](https://github.com/payloadcms/payload/issues/5044)) ([35c2a08](https://github.com/payloadcms/payload/commit/35c2a085efa6d5ad59779960874bc9728a17e3a0))
* filterOptions errors cause transaction to abort ([#5079](https://github.com/payloadcms/payload/issues/5079)) ([5f3d016](https://github.com/payloadcms/payload/commit/5f3d0169bee21e1c0963dbd7ede9fe5f1c46a5a5))
* **plugin-form-builder:** hooks do not respect transactions ([#5069](https://github.com/payloadcms/payload/issues/5069)) ([82e9d31](https://github.com/payloadcms/payload/commit/82e9d31127c8df83c5bed92a5ffdab76d331900f))
* remove collection findByID caching ([#5034](https://github.com/payloadcms/payload/issues/5034)) ([1ac943e](https://github.com/payloadcms/payload/commit/1ac943ed5e8416883b863147fdf3c23380955559))
* **richtext-lexical:** do not remove adjacent paragraph node when inserting certain nodes in empty editor ([#5061](https://github.com/payloadcms/payload/issues/5061)) ([6323965](https://github.com/payloadcms/payload/commit/6323965c652ea68dffeb716957b124d165b9ce96))
* **uploads:** account for serverURL when retrieving external file ([#5102](https://github.com/payloadcms/payload/issues/5102)) ([25cee8b](https://github.com/payloadcms/payload/commit/25cee8bb102bf80b3a4bfb4b4e46712722cc7f0d))


### ⚠ BREAKING CHANGES: @payloadcms/richtext-lexical

* **richtext-lexical:** Update lexical from 0.12.6 to 0.13.1, port over all useful changes from playground (#5066)

- You HAVE to make sure that any versions of the lexical packages (IF you have any installed) match the lexical version which richtext-lexical uses: v0.13.1. If you do not do this, you may be plagued by React useContext / "cannot find active editor state" errors
- Updates to lexical's API, e.g. the removal of INTERNAL_isPointSelection, could be breaking depending on your code. Please consult the [lexical changelog](https://github.com/facebook/lexical/blob/main/CHANGELOG.md).

## [2.11.0](https://github.com/payloadcms/payload/compare/v2.10.1...v2.11.0) (2024-02-09)


### Features

* exposes collapsible provider with more functionality ([#5043](https://github.com/payloadcms/payload/issues/5043)) ([df39602](https://github.com/payloadcms/payload/commit/df39602758ae8dc3765bb48e51f7a657babfa559))

## [2.10.1](https://github.com/payloadcms/payload/compare/v2.10.0...v2.10.1) (2024-02-09)


### Bug Fixes

* clearable cells handle null values ([#5038](https://github.com/payloadcms/payload/issues/5038)) ([f6d7da7](https://github.com/payloadcms/payload/commit/f6d7da751039df25066b51bb91d6453e1a4efd82))
* **db-mongodb:** handle null values with exists ([#5037](https://github.com/payloadcms/payload/issues/5037)) ([cdc4cb9](https://github.com/payloadcms/payload/commit/cdc4cb971b9180ba2ed09741f5af1a3c18292828))
* **db-postgres:** handle nested docs with drafts ([#5012](https://github.com/payloadcms/payload/issues/5012)) ([da184d4](https://github.com/payloadcms/payload/commit/da184d40ece74bffb224002eb5df8f6987d65043))
* ensures docs with the same id are shown in relationship field select ([#4859](https://github.com/payloadcms/payload/issues/4859)) ([e1813fb](https://github.com/payloadcms/payload/commit/e1813fb884e0dc84203fcbab87527a99a4d3a5d7))
* query relationships by explicit id field ([#5022](https://github.com/payloadcms/payload/issues/5022)) ([a0a58e7](https://github.com/payloadcms/payload/commit/a0a58e7fd20dff54d210c968f4d5defd67441bdd))
* **richtext-lexical:** make editor reactive to initialValue changes ([#5010](https://github.com/payloadcms/payload/issues/5010)) ([2315781](https://github.com/payloadcms/payload/commit/2315781f1891ddde4b4c5f2f0cfa1c17af85b7a9))

## [2.10.0](https://github.com/payloadcms/payload/compare/v2.9.0...v2.10.0) (2024-02-06)


### Features

* add more options to addFieldStatePromise so that it can be used for field flattening ([#4799](https://github.com/payloadcms/payload/issues/4799)) ([8725d41](https://github.com/payloadcms/payload/commit/8725d411645bb0270376e235669f46be2227ecc0))
* extend transactions to cover after and beforeOperation hooks ([#4960](https://github.com/payloadcms/payload/issues/4960)) ([1e8a6b7](https://github.com/payloadcms/payload/commit/1e8a6b7899f7b1e6451cc4d777602208478b483c))
* previousValue and previousSiblingDoc args added to beforeChange field hooks ([#4958](https://github.com/payloadcms/payload/issues/4958)) ([5d934ba](https://github.com/payloadcms/payload/commit/5d934ba02d07d98f781ce983228858ee5ce5c226))
* re-use existing logger instance passed to payload.init ([#3124](https://github.com/payloadcms/payload/issues/3124)) ([471d211](https://github.com/payloadcms/payload/commit/471d2113a790dc0d54b2f8ed84e6899310efd600))
* **richtext-lexical:** Blocks: generate type definitions for blocks fields ([#4529](https://github.com/payloadcms/payload/issues/4529)) ([90d7ee3](https://github.com/payloadcms/payload/commit/90d7ee3e6535d51290fc734b284ff3811dbda1f8))
* use deletion success message from server if provided ([#4966](https://github.com/payloadcms/payload/issues/4966)) ([e3c8105](https://github.com/payloadcms/payload/commit/e3c8105cc2ed6fdf8007d97cd7b5556fc71ed724))


### Bug Fixes

* **db-postgres:** filtering relationships with drafts enabled ([#4998](https://github.com/payloadcms/payload/issues/4998)) ([c3a3942](https://github.com/payloadcms/payload/commit/c3a39429697e9d335e9be199e7caafb82eb26219))
* **db-postgres:** handle schema changes with supabase ([#4968](https://github.com/payloadcms/payload/issues/4968)) ([5d3659d](https://github.com/payloadcms/payload/commit/5d3659d48ad8bbf5d96fbcd80434d2287cab97e0))
* **db-postgres:** indexes not created for non unique field names ([#4967](https://github.com/payloadcms/payload/issues/4967)) ([64f705c](https://github.com/payloadcms/payload/commit/64f705c3c94148972f67e8175e718015760d6430))
* **db-postgres:** indexes not creating for relationships, arrays, hasmany and blocks ([#4976](https://github.com/payloadcms/payload/issues/4976)) ([47106d5](https://github.com/payloadcms/payload/commit/47106d5a1af2ebd073fbbc6e474174c3d3835e5c))
* **db-postgres:** localized field sort count ([#4997](https://github.com/payloadcms/payload/issues/4997)) ([f3876c2](https://github.com/payloadcms/payload/commit/f3876c2a39efe19a1864213306725aadcc14f130))
* ensures docPermissions fallback to collection permissions on create ([#4969](https://github.com/payloadcms/payload/issues/4969)) ([afa2b94](https://github.com/payloadcms/payload/commit/afa2b942e0aad90c55744ae13e0ffe1cefa4585d))
* **migrations:** safely create migration file when no name passed ([#4995](https://github.com/payloadcms/payload/issues/4995)) ([0740d50](https://github.com/payloadcms/payload/commit/0740d5095ee1aef13e4e37f6b174d529f0f2d993))
* **plugin-seo:** tabbedUI with email field causes duplicate field ([#4944](https://github.com/payloadcms/payload/issues/4944)) ([db22cbd](https://github.com/payloadcms/payload/commit/db22cbdf21a39ed0604ab96c57ca4242eac82ce7))

## [2.9.0](https://github.com/payloadcms/payload/compare/v2.8.2...v2.9.0) (2024-01-26)


### Features

* forceAcceptWarning migration arg added to accept prompts ([#4874](https://github.com/payloadcms/payload/issues/4874)) ([eba53ba](https://github.com/payloadcms/payload/commit/eba53ba60afd7c5d37389377ed06a9b556058d49))

### Bug Fixes

* afterLogin hook write conflicts ([#4904](https://github.com/payloadcms/payload/issues/4904)) ([3eb681e](https://github.com/payloadcms/payload/commit/3eb681e847e9c55eaaa69c22bea4f4e66c7eac36))
* **db-postgres:** migrate down error ([#4861](https://github.com/payloadcms/payload/issues/4861)) ([dfba522](https://github.com/payloadcms/payload/commit/dfba5222f3abf3f236dc9212a28e1aec7d7214d5))
* **db-postgres:** query unset relation ([#4862](https://github.com/payloadcms/payload/issues/4862)) ([8ce15c8](https://github.com/payloadcms/payload/commit/8ce15c8b07800397a50dcf790c263ed5b3cfad53))
* migrate down missing filter for latest batch ([#4860](https://github.com/payloadcms/payload/issues/4860)) ([b99d24f](https://github.com/payloadcms/payload/commit/b99d24fcfa698c493ea01c41621201abe18fabe3))
* **plugin-cloud-storage:** slow get file performance large collections ([#4927](https://github.com/payloadcms/payload/issues/4927)) ([f73d503](https://github.com/payloadcms/payload/commit/f73d503fecdfa5cefdc26ab9aad60b00563f881e))
* remove No Options dropdown from hasMany fields ([#4899](https://github.com/payloadcms/payload/issues/4899)) ([e5a7907](https://github.com/payloadcms/payload/commit/e5a7907a72c1371447ac2f71fce213ed22246092))
* upload input drawer does not show draft versions ([#4903](https://github.com/payloadcms/payload/issues/4903)) ([6930c4e](https://github.com/payloadcms/payload/commit/6930c4e9f2200853121391ad8f8df48ea66c40a4))

## [2.8.2](https://github.com/payloadcms/payload/compare/v2.8.1...v2.8.2) (2024-01-16)


### Features

* **db-postgres:** support drizzle logging config ([#4809](https://github.com/payloadcms/payload/issues/4809)) ([371353f](https://github.com/payloadcms/payload/commit/371353f1535fbab4ebd9f56fc14fd10a30eec289))
* **plugin-form-builder:** add validation for form ID when creating a submission ([#4730](https://github.com/payloadcms/payload/pull/4730))
* **plugin-seo:** add support for interfaceName and fieldOverrides ([#4695](https://github.com/payloadcms/payload/pull/4695))

### Bug Fixes

* **db-mongodb:** mongodb versions creating duplicates ([#4825](https://github.com/payloadcms/payload/issues/4825)) ([a861311](https://github.com/payloadcms/payload/commit/a861311c5a98126700f98f9a2ab380782e754717))
* **db-mongodb:** transactionOptions=false typeErrors ([82383a5](https://github.com/payloadcms/payload/commit/82383a5b5f52785115c0feb970da70e91971b7ca))
* **db-postgres:** Remove duplicate keys from response ([#4747](https://github.com/payloadcms/payload/issues/4747)) ([eb9e771](https://github.com/payloadcms/payload/commit/eb9e771a9ca03636486d36654f215b73435574cb))
* **db-postgres:** validateExistingBlockIsIdentical with arrays ([3b88adc](https://github.com/payloadcms/payload/commit/3b88adc7d0594af63ce190c40c9ee3905df67a31))
* **db-postgres:** validateExistingBlockIsIdentical with other tables ([0647c87](https://github.com/payloadcms/payload/commit/0647c870f15dc1b122734b678c2abeb6f56377d4))
* **plugin-seo:** fix missing spread operator in URL generator function ([#4723](https://github.com/payloadcms/payload/pull/4723))
* removes max-width from field-types class & correctly sets it on uploads ([#4829](https://github.com/payloadcms/payload/issues/4829)) ([ee5390a](https://github.com/payloadcms/payload/commit/ee5390aaca37a4154cde8392b60f091ec3e5175c))

## [2.8.1](https://github.com/payloadcms/payload/compare/v2.8.0...v2.8.1) (2024-01-12)


### Bug Fixes

* corrects config usage in build bin script ([#4796](https://github.com/payloadcms/payload/issues/4796)) ([775502b](https://github.com/payloadcms/payload/commit/775502b1616c1bd35a3044438e253a0e84219f99))

## [2.8.0](https://github.com/payloadcms/payload/compare/v2.7.0...v2.8.0) (2024-01-12)


### Features

* allow custom config properties in blocks ([#4766](https://github.com/payloadcms/payload/issues/4766)) ([d92af29](https://github.com/payloadcms/payload/commit/d92af295ebe253160ac4c8fb788a1fb143ab85ae))
* **logger:** show local time ([#4663](https://github.com/payloadcms/payload/issues/4663)) ([493fde5](https://github.com/payloadcms/payload/commit/493fde5ccceb9a95d0b950a028a1d2f8888b4e64))
* **plugin-cloud:** use resend smtp instead of custom transport ([#4746](https://github.com/payloadcms/payload/issues/4746)) ([5cfde54](https://github.com/payloadcms/payload/commit/5cfde542b19988985746e220829d429a84ba3976))
* **plugin-seo:** add fr translations ([#4774](https://github.com/payloadcms/payload/issues/4774)) ([4319fe1](https://github.com/payloadcms/payload/commit/4319fe1c6e332d35124356ce5d5d0fb48fe199e7))
* **plugin-seo:** remove support for payload <2.7.0 ([#4765](https://github.com/payloadcms/payload/issues/4765)) ([5e08368](https://github.com/payloadcms/payload/commit/5e083689d016fbff6c83419336e920f248932993))


### Bug Fixes

* allow a custom ID field to be nested inside unnamed tabs and rows ([#4701](https://github.com/payloadcms/payload/issues/4701)) ([6d5ac1d](https://github.com/payloadcms/payload/commit/6d5ac1de1ef55c4d51b253b4cf959bb703316c49))
* build payload without initializing ([#4028](https://github.com/payloadcms/payload/issues/4028)) ([1115387](https://github.com/payloadcms/payload/commit/11153877447af68389dde80fff2f9ee869468acb))
* **db-mongodb:** limit=0 returns unpaginated ([63e5c43](https://github.com/payloadcms/payload/commit/63e5c43fe620458936e2ebc4f5468aff9cb23e02))
* **db-postgres:** totalPages value when limit=0 ([5702b83](https://github.com/payloadcms/payload/commit/5702b83e829b5b1a3d95ce4a1c1967c3ec630373))
* migration regression ([#4777](https://github.com/payloadcms/payload/issues/4777)) ([fa3b3dd](https://github.com/payloadcms/payload/commit/fa3b3dd62d0a060f7419fd21d69eafff9bf99a61))
* **db-mongodb:** migration regression ([#4777](https://github.com/payloadcms/payload/issues/4777)) ([fa3b3dd](https://github.com/payloadcms/payload/commit/fa3b3dd62d0a060f7419fd21d69eafff9bf99a61))
* **db-postgres:**migration regression ([#4777](https://github.com/payloadcms/payload/issues/4777)) ([fa3b3dd](https://github.com/payloadcms/payload/commit/fa3b3dd62d0a060f7419fd21d69eafff9bf99a61))
* passes `draft=true` in fetch for relationships ([#4784](https://github.com/payloadcms/payload/issues/4784)) ([0a259d2](https://github.com/payloadcms/payload/commit/0a259d27b5ef0d632ca54cd0a9ab99629f94c2a0))
* **plugin-form-builder:** replaces curly brackets with lexical editor ([#4753](https://github.com/payloadcms/payload/issues/4753)) ([8481846](https://github.com/payloadcms/payload/commit/84818469ea50d43276915d36bd92769422eadeb0))
* prioritizes `value` key when filtering / querying for relationships ([#4727](https://github.com/payloadcms/payload/issues/4727)) ([d0f7677](https://github.com/payloadcms/payload/commit/d0f7677d5ff2e0109fc348260d87e2606fdbd293))
* text hasMany validation ([#4789](https://github.com/payloadcms/payload/issues/4789)) ([e2e56a4](https://github.com/payloadcms/payload/commit/e2e56a4d58a9e1c31c05a0624f35642f58da162b))

### ⚠ BREAKING CHANGES

#### @payloadcms/plugin-seo

* remove support for payload <2.7.0 ([#4765](https://github.com/payloadcms/payload/pull/4765))

## [2.7.0](https://github.com/payloadcms/payload/compare/v2.6.0...v2.7.0) (2024-01-09)


### Features

* **db-mongodb:** improve transaction support by passing req to migrations ([682eca2](https://github.com/payloadcms/payload/commit/682eca21860a4e2b2ab0bfd85613818790247224))
* **db-postgres:** improve transaction support by passing req to migrations ([555d027](https://github.com/payloadcms/payload/commit/555d02769a8731aeebbff9b67f9b0e1022904ade))
* hasMany property for text fields ([#4605](https://github.com/payloadcms/payload/issues/4605)) ([f43cf18](https://github.com/payloadcms/payload/commit/f43cf185d45b3c75fa0d78acd91e6cb60d87f166))
* improve transaction support by passing req to migrations ([1d14d9f](https://github.com/payloadcms/payload/commit/1d14d9f8b8ed077691175030182f094bb300ed17))
* **plugin-seo:** add i18n ([#4665](https://github.com/payloadcms/payload/issues/4665)) ([3027a03](https://github.com/payloadcms/payload/commit/3027a03ad11ecd679278e44a013e4dea4aa42b8d))
* provide document info to ActionsProvider ([#4696](https://github.com/payloadcms/payload/issues/4696)) ([6a8a6e4](https://github.com/payloadcms/payload/commit/6a8a6e4ef4913e0889e4d2eac82b28b9e4e8db22))


### Bug Fixes

* adds objectID validation to isValidID if of type `text` ([#4689](https://github.com/payloadcms/payload/issues/4689)) ([d419275](https://github.com/payloadcms/payload/commit/d419275fb50f0922307f2d3b4c0fcf80ac5ec98b))
* allow json field to be saved empty and reflect value changes ([#4687](https://github.com/payloadcms/payload/issues/4687)) ([0fb3a9c](https://github.com/payloadcms/payload/commit/0fb3a9ca89d1b63faea179bfa9b5b3d0a69c9398))
* custom ids in versions ([#4680](https://github.com/payloadcms/payload/issues/4680)) ([5d15955](https://github.com/payloadcms/payload/commit/5d15955f839d3f0cc557d8a8d7cc3a9e52e2f6b1))
* custom overrides of breadcrumb and parent fields ([7db58b4](https://github.com/payloadcms/payload/commit/7db58b482bba7e715c5be23cfe1a84295e95da29))
* **db-mongodb:** migration error calling beginTransaction with transactionOptions false ([21b9453](https://github.com/payloadcms/payload/commit/21b9453cf4e6eebf145d89a0190942015658413d))
* **db-mongodb:** querying plan for collections ignoring indexes ([#4655](https://github.com/payloadcms/payload/issues/4655)) ([63bc4ca](https://github.com/payloadcms/payload/commit/63bc4cabe1dea5f233aa1d9d4e64f3af93a8e081))
* **db-postgres:** incorrect results querying json field using exists operator ([9d9ac0e](https://github.com/payloadcms/payload/commit/9d9ac0ec28c97281bfdc7d6fb78c52baea492380))
* **db-postgres:** migrate down only runs latest batch size ([6acfae8](https://github.com/payloadcms/payload/commit/6acfae8ee7614746797e1fa91e1fd41c0240fdcd))
* **db-postgres:** query on json properties ([ec4d2f9](https://github.com/payloadcms/payload/commit/ec4d2f97cbf1c89d837372059bf3bb77f3ea6594))
* **db-postgres:** validation prevents group fields in blocks ([#4699](https://github.com/payloadcms/payload/issues/4699)) ([cab6bab](https://github.com/payloadcms/payload/commit/cab6babd608daeaabf9b63b1b446fded6804b60f))
* non-boolean condition result causes infinite looping ([#4579](https://github.com/payloadcms/payload/issues/4579)) ([a3e7816](https://github.com/payloadcms/payload/commit/a3e78161b551e8286063a173645a1d3dee162ad1))
* **plugin-form-builder:** slate serializer should replace curly braces in links ([#4703](https://github.com/payloadcms/payload/issues/4703)) ([28a3012](https://github.com/payloadcms/payload/commit/28a30120dd1aa3279fb2133aa0a0b1638d144be4))
* **plugin-nested-docs:** breadcrumbsFieldSlug used in resaveSelfAfterCreate hook ([a5a91c0](https://github.com/payloadcms/payload/commit/a5a91c08a9ade1482c512d3fa4c4f519ad85cf74))
* **plugin-nested-docs:** children wrongly publishing draft data ([#4692](https://github.com/payloadcms/payload/issues/4692)) ([5539942](https://github.com/payloadcms/payload/commit/55399424a13b1e0532d9eeefd09d442c107c3eda))
* **plugin-nested-docs:** custom parent field slug ([635e7c2](https://github.com/payloadcms/payload/commit/635e7c26e8b3b5138cf5a9bcb29e8ddd4b1e69b6))
* **plugin-nested-docs:** parent filterOptions errors when specifying breadcrumbsFieldSlug ([c4a4678](https://github.com/payloadcms/payload/commit/c4a4678afb097cf94c682595a78e416767a1fea8))
* prevents row overflow ([#4704](https://github.com/payloadcms/payload/issues/4704)) ([9828772](https://github.com/payloadcms/payload/commit/98287728900cb88fa6a465899f030f81df28fc69))
* relations with number based ids (postgres) show untitled ID: x ([1b91408](https://github.com/payloadcms/payload/commit/1b914083c8ee0c1b1d64fa7d4471ede0a24cfdb7))
* sidebar fields not disabled by access permissions ([#4682](https://github.com/payloadcms/payload/issues/4682)) ([85e38b7](https://github.com/payloadcms/payload/commit/85e38b7cfd5c0772344c4a8fb5100f7c48eb508f))
* unlock user condition always passes due to seconds conversion ([#4610](https://github.com/payloadcms/payload/issues/4610)) ([d543665](https://github.com/payloadcms/payload/commit/d543665995410256f77fe136173339aee6dcc7da))

## [2.6.0](https://github.com/payloadcms/payload/compare/v2.5.0...v2.6.0) (2024-01-03)


### Features

* **db-mongodb:** add transactionOptions ([f2c8ac4](https://github.com/payloadcms/payload/commit/f2c8ac4a9aa9120339af6759170f5a708469698d))
* extend locales to have fallbackLocales ([9fac2ef](https://github.com/payloadcms/payload/commit/9fac2ef24e2ade4cf55b0d6a0e7f67e0edf57539))


### Bug Fixes

* "The punycode module is deprecated" warning by updating nodemailer ([00d8480](https://github.com/payloadcms/payload/commit/00d8480062d99dee56ef61a955f48a92efa6cbea))
* adjusts json field joi schema to allow editorOptions ([bff4cf5](https://github.com/payloadcms/payload/commit/bff4cf518f748efb9179f112c606d11d25db3d99))
* **db-postgres:** Wait for transaction to complete on commit ([#4582](https://github.com/payloadcms/payload/issues/4582)) ([a71d37b](https://github.com/payloadcms/payload/commit/a71d37b39806cd5956378a10246802d01d06c2dd))
* detect language from request headers accept-language ([#4656](https://github.com/payloadcms/payload/issues/4656)) ([69a9944](https://github.com/payloadcms/payload/commit/69a99445c9f1638a962a9c08ffe0bdc22e538bf6))
* graphql multiple locales ([98890ee](https://github.com/payloadcms/payload/commit/98890eee1f527c8f245b2353d7e1caca4d2a7d8c))
* navigation locks when modal is closed with esc ([#4664](https://github.com/payloadcms/payload/issues/4664)) ([be3beab](https://github.com/payloadcms/payload/commit/be3beabb9bafa137aa89e84cf47246017e969be8))
* req.locale and req.fallbackLocale get reassigned in local operations ([aa048d5](https://github.com/payloadcms/payload/commit/aa048d5409acd42b8f56367a16934085df9fbce2))
* resets actions array when navigating out of view with actions ([#4585](https://github.com/payloadcms/payload/issues/4585)) ([5c55231](https://github.com/payloadcms/payload/commit/5c5523195ccfa94a9bf42441e2a378f87836e64d))
* **richtext-lexical:** z-index issues ([#4570](https://github.com/payloadcms/payload/issues/4570)) ([8015e99](https://github.com/payloadcms/payload/commit/8015e999cd5834f532a200ef03fd392d04b3209f))
* tab field error when using the same interface name ([#4657](https://github.com/payloadcms/payload/issues/4657)) ([f1fa374](https://github.com/payloadcms/payload/commit/f1fa374ed12b50fdf210f17ae1dda603f09a9726))

## [2.5.0](https://github.com/payloadcms/payload/compare/v2.4.0...v2.5.0) (2023-12-19)


### Features

* add Chinese Traditional translation ([#4372](https://github.com/payloadcms/payload/issues/4372)) ([50253f6](https://github.com/payloadcms/payload/commit/50253f617c22d0d185bbac7f9d4304cddbc01f06))
* add context to auth and globals local API ([#4449](https://github.com/payloadcms/payload/issues/4449)) ([168d629](https://github.com/payloadcms/payload/commit/168d6296974042c3ff2a113f9f6c2bded7ba2b3e))
* adds new `actions` property to admin customization ([#4468](https://github.com/payloadcms/payload/issues/4468)) ([9e8f14a](https://github.com/payloadcms/payload/commit/9e8f14a897e77f6933eedb2410956a468f4187c3))
* async live preview urls ([#4339](https://github.com/payloadcms/payload/issues/4339)) ([5f17324](https://github.com/payloadcms/payload/commit/5f173241df6dc316d498767b1c81718e9c2b9a51))
* pass path to FieldDescription ([#4364](https://github.com/payloadcms/payload/issues/4364)) ([3b8a27d](https://github.com/payloadcms/payload/commit/3b8a27d199b3969cbca6ca750450798cb70f21e8))
* **plugin-form-builder:** Lexical support ([#4487](https://github.com/payloadcms/payload/issues/4487)) ([c6c5cab](https://github.com/payloadcms/payload/commit/c6c5cabfbb7eb954eea51170a6af7582b1f9b84b))
* prevent querying relationship when filterOptions returns false ([#4392](https://github.com/payloadcms/payload/issues/4392)) ([c1bd338](https://github.com/payloadcms/payload/commit/c1bd338d0d5e899f3892f1d18e355c00b265447a))
* **richtext-lexical:** improve floating select menu Dropdown classNames ([#4444](https://github.com/payloadcms/payload/issues/4444)) ([9331204](https://github.com/payloadcms/payload/commit/9331204295bfeaf7dd10bc075f42995b2cab2de4))
* **richtext-lexical:** improve link URL validation ([#4442](https://github.com/payloadcms/payload/issues/4442)) ([9babf68](https://github.com/payloadcms/payload/commit/9babf6804ce04d5828167eb8e7717727fe1cd472))
* **richtext-lexical:** lazy import React components to prevent client-only code from leaking into the server ([#4290](https://github.com/payloadcms/payload/issues/4290)) ([5de347f](https://github.com/payloadcms/payload/commit/5de347ffffca3bf38315d3d87d2ccc5c28cd2723))
* **richtext-lexical:** Link & Relationship Feature: field-level configurable allowed relationships ([#4182](https://github.com/payloadcms/payload/issues/4182)) ([7af8f29](https://github.com/payloadcms/payload/commit/7af8f29b4a8dddf389356e4db142f8d434cdc964))
* **richtext-lexical:** link node: change doc data format to be consistent with relationship field ([#4504](https://github.com/payloadcms/payload/issues/4504)) ([cc0ba89](https://github.com/payloadcms/payload/commit/cc0ba895188f40181c6ba3779f66d547d4ea66f9))
* **richtext-lexical:** rename TreeviewFeature into TreeViewFeature ([#4520](https://github.com/payloadcms/payload/issues/4520)) ([c49fd66](https://github.com/payloadcms/payload/commit/c49fd6692231b68ca61b079103a0fd7aa4673be1))
* **richtext-lexical:** Slate to Lexical converter: add blockquote conversion, convert custom link fields ([#4486](https://github.com/payloadcms/payload/issues/4486)) ([31f8f3c](https://github.com/payloadcms/payload/commit/31f8f3cac6bfd08f3adfa0a026a57c4b1b510045))
* **richtext-lexical:** Upload html serializer: Output picture element if the image has multiple sizes, improve absolute URL creation ([e558894](https://github.com/payloadcms/payload/commit/e55889480fceb8995646621923159d92de6e89c9))


### Bug Fixes

* adds bg color for year/month select options in datepicker ([#4508](https://github.com/payloadcms/payload/issues/4508)) ([07371b9](https://github.com/payloadcms/payload/commit/07371b9cad111999f2df4e1f709d6b95cd511c15))
* correctly fetches externally stored files when passing uploadEdits ([#4505](https://github.com/payloadcms/payload/issues/4505)) ([228d45c](https://github.com/payloadcms/payload/commit/228d45cf52e592cea6377cd93648fba75d73c88d))
* cursor jumping around inside json field ([#4453](https://github.com/payloadcms/payload/issues/4453)) ([6300037](https://github.com/payloadcms/payload/commit/63000373e66fb39443f882689e0ecf5c11ed8ad0))
* **db-mongodb:** documentDB unique constraint throws incorrect error ([#4513](https://github.com/payloadcms/payload/issues/4513)) ([05e8914](https://github.com/payloadcms/payload/commit/05e8914db70fa64bfb2d15ecfb58e9c229d71108))
* **db-postgres:** findOne correctly querying with where queries ([#4550](https://github.com/payloadcms/payload/issues/4550)) ([8bc31cd](https://github.com/payloadcms/payload/commit/8bc31cd5923517ab39ae1427aa0d0fb19d876dab))
* **db-postgres:** querying nested blocks fields ([#4404](https://github.com/payloadcms/payload/issues/4404)) ([6e9ae65](https://github.com/payloadcms/payload/commit/6e9ae65374124ee000cc2988ef77247c94b0dd18))
* **db-postgres:** sorting on a not-configured field throws error ([#4382](https://github.com/payloadcms/payload/issues/4382)) ([dbaecda](https://github.com/payloadcms/payload/commit/dbaecda0e92fcb0fa67b4c5ac085e025f02de53a))
* defaultValues computed on new globals ([#4380](https://github.com/payloadcms/payload/issues/4380)) ([b6cffce](https://github.com/payloadcms/payload/commit/b6cffcea07b9fa21698b00b8bbed6f27197ded41))
* disallow duplicate fieldNames to be used on the same level in the config ([#4381](https://github.com/payloadcms/payload/issues/4381)) ([a1d66b8](https://github.com/payloadcms/payload/commit/a1d66b83e0dbea21e8da549b73cd25c537a57938))
* ensure ui fields do not make it into gql schemas ([#4457](https://github.com/payloadcms/payload/issues/4457)) ([3a20ddc](https://github.com/payloadcms/payload/commit/3a20ddc5f85162a316006f22ba66ee1c7aab99e3))
* format fields within tab for list controls ([#4516](https://github.com/payloadcms/payload/issues/4516)) ([2650c70](https://github.com/payloadcms/payload/commit/2650c70960a7374307a8862c3940c97d337d1d30))
* formats locales with multiple labels for versions locale selector ([#4495](https://github.com/payloadcms/payload/issues/4495)) ([8257661](https://github.com/payloadcms/payload/commit/8257661c47b5b968a57fb2228d7045d876a3f484))
* graphql schema generation for fields without queryable subfields ([#4463](https://github.com/payloadcms/payload/issues/4463)) ([13e3e06](https://github.com/payloadcms/payload/commit/13e3e0671353ca34e603fece57a12199f2082ca0))
* handles null upload field values ([#4397](https://github.com/payloadcms/payload/issues/4397)) ([cf9a370](https://github.com/payloadcms/payload/commit/cf9a3704df21ce8b32feb0680793cba804cd66f7))
* **live-preview:** populates rte uploads and relationships ([#4379](https://github.com/payloadcms/payload/issues/4379)) ([4090aeb](https://github.com/payloadcms/payload/commit/4090aebb0e94e776258f0c1c761044a4744a1857))
* **live-preview:** sends raw js objects through window.postMessage instead of json ([#4354](https://github.com/payloadcms/payload/issues/4354)) ([03a3872](https://github.com/payloadcms/payload/commit/03a387233d1b8876a2fcaa5f3b3fd5ed512c0bc4))
* make admin navigation transition smoother ([#4217](https://github.com/payloadcms/payload/issues/4217)) ([eb6572e](https://github.com/payloadcms/payload/commit/eb6572e9e56e680cad331c1bc5da47e91306deb9))
* omit field default value if read access returns false ([#4518](https://github.com/payloadcms/payload/issues/4518)) ([3e9ef84](https://github.com/payloadcms/payload/commit/3e9ef849cd8e69e1e8d7f2f653f0647e93c8ab39))
* pin ts-node versions which are causing swc errors ([#4447](https://github.com/payloadcms/payload/issues/4447)) ([b9c0248](https://github.com/payloadcms/payload/commit/b9c024882350d14edd57f0f662a2269ed37975e3))
* properly spreads collection fields into non-tabbed configs [#50](https://github.com/payloadcms/payload/issues/50) ([#51](https://github.com/payloadcms/payload/issues/51)) ([7e88159](https://github.com/payloadcms/payload/commit/7e88159e99e2afdc10addc02cf299c11fe188be7))
* **plugin-form-builder:** removes use of slate in rich-text serializer ([#4451](https://github.com/payloadcms/payload/issues/4451)) ([3df52a8](https://github.com/payloadcms/payload/commit/3df52a88568622f8fafeabad47c7501229e4ea5f))
* **plugin-nested-docs:** properly exports field utilities ([#4462](https://github.com/payloadcms/payload/issues/4462)) ([1cc87bd](https://github.com/payloadcms/payload/commit/1cc87bd8ea575dfa2e1f5ce5b38414bbba95b2cb))
* **richtext-*:** loosen RichTextAdapter types due to re-occuring ts strict mode errors ([#4416](https://github.com/payloadcms/payload/issues/4416)) ([48f1299](https://github.com/payloadcms/payload/commit/48f1299fcba3e3811c6a7f31499f238537f9a5e3))
* **richtext-lexical:** Blocks field: should not prompt for unsaved changes due to value comparison between null and non-existent props ([#4450](https://github.com/payloadcms/payload/issues/4450)) ([548e78c](https://github.com/payloadcms/payload/commit/548e78c598cb6d029e7cc40f80d9855754f043bc))
* **richtext-lexical:** do not add unnecessary paragraph before upload, relationship and blocks nodes ([#4441](https://github.com/payloadcms/payload/issues/4441)) ([5c2739e](https://github.com/payloadcms/payload/commit/5c2739ebd144620cfd4ff02531f5812dd62ac61d))
* **richtext-lexical:** lexicalHTML field not working when used inside of Blocks field ([128f9c4](https://github.com/payloadcms/payload/commit/128f9c4e7e6e20dd1ee221f49428a5bce5179c5f))
* **richtext-lexical:** lexicalHTML field now works when used inside of row fields ([#4440](https://github.com/payloadcms/payload/issues/4440)) ([0421173](https://github.com/payloadcms/payload/commit/0421173f9e2d6db1b6a94b25884ea807921f2d09))
* **richtext-lexical:** not all types of URLs are validated correctly ([ac7f980](https://github.com/payloadcms/payload/commit/ac7f9809bc2b9fb6a52b48c10f7d51414801e4de))
* searching by id sends undefined in where query param ([#4464](https://github.com/payloadcms/payload/issues/4464)) ([46e8c01](https://github.com/payloadcms/payload/commit/46e8c01fbed68856be68804f2bd9744c4c6f5a95))
* simplifies query validation and fixes nested relationship fields ([#4391](https://github.com/payloadcms/payload/issues/4391)) ([4b5453e](https://github.com/payloadcms/payload/commit/4b5453e8e5484f7afcadbf5bccf8369b552969c6))
* updates return value of empty arrays in getDataByPath ([#4553](https://github.com/payloadcms/payload/issues/4553)) ([f3748a1](https://github.com/payloadcms/payload/commit/f3748a1534a13e6d844aadd9f0e3e6acbe483d03))
* upload editing error with plugin-cloud ([#4170](https://github.com/payloadcms/payload/issues/4170)) ([fcbe574](https://github.com/payloadcms/payload/commit/fcbe5744d945dc43642cdaa2007ddc252ecafafa))
* upload related issues, cropping, fetching local file, external preview image ([#4461](https://github.com/payloadcms/payload/issues/4461)) ([45c472d](https://github.com/payloadcms/payload/commit/45c472d6b35c41e597038089ad1755cdb88193b6))
* uploads files after validation ([#4218](https://github.com/payloadcms/payload/issues/4218)) ([65adfd2](https://github.com/payloadcms/payload/commit/65adfd21ed538b79628dc4f8ce9e1a5a1bba6aed))

### ⚠ BREAKING CHANGES

#### @payloadcms/richtext-lexical

* **richtext-lexical:** rename TreeviewFeature into TreeViewFeature ([#4520](https://github.com/payloadcms/payload/issues/4520)) ([c49fd66](https://github.com/payloadcms/payload/commit/c49fd6692231b68ca61b079103a0fd7aa4673be1))

If you import TreeviewFeature, you have to rename the import to use TreeViewFeature (capitalized "V")

* **richtext-lexical:** link node: change doc data format to be consistent with relationship field ([#4504](https://github.com/payloadcms/payload/issues/4504)) ([cc0ba89](https://github.com/payloadcms/payload/commit/cc0ba895188f40181c6ba3779f66d547d4ea66f9))

An unpopulated, internal link node no longer saves the doc id under fields.doc.value.id. Now, it saves it under fields.doc.value.
Migration inside of payload is automatic. If you are reading from the link node inside of your frontend though, you will have to adjust it.

* **richtext-lexical:** improve floating select menu Dropdown classNames ([#4444](https://github.com/payloadcms/payload/issues/4444)) ([9331204](https://github.com/payloadcms/payload/commit/9331204295bfeaf7dd10bc075f42995b2cab2de4))

Dropdown component has a new mandatory sectionKey prop

* **richtext-lexical:** lazy import React components to prevent client-only code from leaking into the server ([#4290](https://github.com/payloadcms/payload/issues/4290)) ([5de347f](https://github.com/payloadcms/payload/commit/5de347ffffca3bf38315d3d87d2ccc5c28cd2723))

1. Most important: If you are updating `@payloadcms/richtext-lexical` to v0.4.0 or higher, you will HAVE to update payload to the latest version as well. If you don't update it, payload likely won't start up due to validation errors. It's generally good practice to upgrade packages prefixed with @payloadcms/ together with payload and keep the versions in sync.

2. `@payloadcms/richtext-slate` is not affected by this.

3. Every single property in the `Feature` interface which accepts a React component now no longer accepts a React component, but a function which imports a React component instead. This is done to ensure no unnecessary client-only code is leaked to the server when importing Features on a server.
Here's an example migration:

Old:

```ts
import { BlockIcon } from '../../lexical/ui/icons/Block'
...
Icon: BlockIcon,
```

New:

```ts
// import { BlockIcon } from '../../lexical/ui/icons/Block' // <= Remove this import
...
Icon: () =>
  // @ts-expect-error
  import('../../lexical/ui/icons/Block').then((module) => module.BlockIcon),
```

Or alternatively, if you're using default exports instead of named exports:

```ts
// import BlockIcon from '../../lexical/ui/icons/Block' // <= Remove this import
...
Icon: () =>
  // @ts-expect-error
  import('../../lexical/ui/icons/Block'),
```

4. The types for `SanitizedEditorConfig` and `EditorConfig` have changed. Their respective `lexical` property no longer expects the `LexicalEditorConfig`. It now expects a function returning the `LexicalEditorConfig`. You will have to adjust this if you adjusted that property anywhere, e.g. when initializing the lexical field editor property, or when initializing a new headless editor.

5. The following exports are now exported from the `@payloadcms/richtext-lexical/components` subpath exports instead of `@payloadcms/richtext-lexical`:

- `ToolbarButton`
- `ToolbarDropdown`
- `RichTextCell`
- `RichTextField`
- `defaultEditorLexicalConfig`

You will have to adjust your imports, only if you import any of those properties in your project.

## @payloadcms/richtext-*

### [@payloadcms/richtext-lexical 0.4.1](https://github.com/payloadcms/payload/compare/richtext-lexical/0.4.0...richtext-lexical/0.4.1) (2023-12-07)
### [@payloadcms/richtext-slate 1.3.1](https://github.com/payloadcms/payload/compare/richtext-slate/1.3.0...richtext-slate/1.3.1) (2023-12-07)

### Bug Fixes

* **richtext-*:** loosen RichTextAdapter types due to re-occuring ts strict mode errors ([#4416](https://github.com/payloadcms/payload/issues/4416)) ([48f1299](https://github.com/payloadcms/payload/commit/48f1299fcba3e3811c6a7f31499f238537f9a5e3))
* **richtext-lexical:** lexicalHTML field not working when used inside of Blocks field ([128f9c4](https://github.com/payloadcms/payload/commit/128f9c4e7e6e20dd1ee221f49428a5bce5179c5f))

## [2.4.0](https://github.com/payloadcms/payload/compare/v2.3.1...v2.4.0) (2023-12-06)


### Features

* add Chinese Traditional translation ([#4372](https://github.com/payloadcms/payload/issues/4372)) ([50253f6](https://github.com/payloadcms/payload/commit/50253f617c22d0d185bbac7f9d4304cddbc01f06))
* async live preview urls ([#4339](https://github.com/payloadcms/payload/issues/4339)) ([5f17324](https://github.com/payloadcms/payload/commit/5f173241df6dc316d498767b1c81718e9c2b9a51))
* pass path to FieldDescription ([#4364](https://github.com/payloadcms/payload/issues/4364)) ([3b8a27d](https://github.com/payloadcms/payload/commit/3b8a27d199b3969cbca6ca750450798cb70f21e8))
* **richtext-lexical:** lazy import React components to prevent client-only code from leaking into the server ([#4290](https://github.com/payloadcms/payload/issues/4290)) ([5de347f](https://github.com/payloadcms/payload/commit/5de347ffffca3bf38315d3d87d2ccc5c28cd2723))
* **richtext-lexical:** Link & Relationship Feature: field-level configurable allowed relationships ([#4182](https://github.com/payloadcms/payload/issues/4182)) ([7af8f29](https://github.com/payloadcms/payload/commit/7af8f29b4a8dddf389356e4db142f8d434cdc964))


### Bug Fixes

* **db-postgres:** sorting on a not-configured field throws error ([#4382](https://github.com/payloadcms/payload/issues/4382)) ([dbaecda](https://github.com/payloadcms/payload/commit/dbaecda0e92fcb0fa67b4c5ac085e025f02de53a))
* defaultValues computed on new globals ([#4380](https://github.com/payloadcms/payload/issues/4380)) ([b6cffce](https://github.com/payloadcms/payload/commit/b6cffcea07b9fa21698b00b8bbed6f27197ded41))
* handles null upload field values ([#4397](https://github.com/payloadcms/payload/issues/4397)) ([cf9a370](https://github.com/payloadcms/payload/commit/cf9a3704df21ce8b32feb0680793cba804cd66f7))
* **live-preview:** populates rte uploads and relationships ([#4379](https://github.com/payloadcms/payload/issues/4379)) ([4090aeb](https://github.com/payloadcms/payload/commit/4090aebb0e94e776258f0c1c761044a4744a1857))
* **live-preview:** sends raw js objects through window.postMessage instead of json ([#4354](https://github.com/payloadcms/payload/issues/4354)) ([03a3872](https://github.com/payloadcms/payload/commit/03a387233d1b8876a2fcaa5f3b3fd5ed512c0bc4))
* simplifies query validation and fixes nested relationship fields ([#4391](https://github.com/payloadcms/payload/issues/4391)) ([4b5453e](https://github.com/payloadcms/payload/commit/4b5453e8e5484f7afcadbf5bccf8369b552969c6))
* upload editing error with plugin-cloud ([#4170](https://github.com/payloadcms/payload/issues/4170)) ([fcbe574](https://github.com/payloadcms/payload/commit/fcbe5744d945dc43642cdaa2007ddc252ecafafa))
* uploads files after validation ([#4218](https://github.com/payloadcms/payload/issues/4218)) ([65adfd2](https://github.com/payloadcms/payload/commit/65adfd21ed538b79628dc4f8ce9e1a5a1bba6aed))

### ⚠ BREAKING CHANGES

* **richtext-lexical:** lazy import React components to prevent client-only code from leaking into the server (#4290)

### ⚠️ @payloadcms/richtext-lexical

Most important: If you are updating `@payloadcms/richtext-lexical` to v0.4.0 or higher, you will HAVE to update `payload` to the latest version as well. If you don't update it, payload likely won't start up due to validation errors. It's generally good practice to upgrade packages prefixed with `@payloadcms/` together with `payload` and keep the versions in sync.

`@payloadcms/richtext-slate` is not affected by this.

Every single property in the `Feature` interface which accepts a React component now no longer accepts a React component, but a function which imports a React component instead. This is done to ensure no unnecessary client-only code is leaked to the server when importing Features on a server.
Here's an example migration:

Old:

```ts
import { BlockIcon } from '../../lexical/ui/icons/Block'
...
Icon: BlockIcon,
```

New:

```ts
// import { BlockIcon } from '../../lexical/ui/icons/Block' // <= Remove this import
...
Icon: () =>
  // @ts-expect-error
  import('../../lexical/ui/icons/Block').then((module) => module.BlockIcon),
```

Or alternatively, if you're using default exports instead of named exports:

```ts
// import BlockIcon from '../../lexical/ui/icons/Block' // <= Remove this import
...
Icon: () =>
  // @ts-expect-error
  import('../../lexical/ui/icons/Block'),
```

The types for `SanitizedEditorConfig` and `EditorConfig` have changed. Their respective `lexical` property no longer expects the `LexicalEditorConfig`. It now expects a function returning the `LexicalEditorConfig`. You will have to adjust this if you adjusted that property anywhere, e.g. when initializing the lexical field editor property, or when initializing a new headless editor.

The following exports are now exported from the `@payloadcms/richtext-lexical/components` subpath exports instead of `@payloadcms/richtext-lexical`:

- ToolbarButton
- ToolbarDropdown
- RichTextCell
- RichTextField
- defaultEditorLexicalConfig

You will have to adjust your imports, only if you import any of those properties in your project.

## [2.3.1](https://github.com/payloadcms/payload/compare/v2.3.0...v2.3.1) (2023-12-01)


### Bug Fixes

* ensure doc controls are not hidden behind lexical field ([#4345](https://github.com/payloadcms/payload/issues/4345)) ([bea79fe](https://github.com/payloadcms/payload/commit/bea79feaeaee18bf94dd04262f134483f1468494))
* query validation on relationship fields ([#4353](https://github.com/payloadcms/payload/issues/4353)) ([fe888b5](https://github.com/payloadcms/payload/commit/fe888b5f6ceaa3969eac759cbdfb109b106dae05))
* **richtext-lexical:** blocks content may be hidden behind components outside of the editor ([#4325](https://github.com/payloadcms/payload/issues/4325)) ([3e745e9](https://github.com/payloadcms/payload/commit/3e745e91da620a00e3f0f91892ee3ec66ba72bc0))
* **richtext-lexical:** Blocks node: incorrect conversion from v1 node to v2 node ([ef84a2c](https://github.com/payloadcms/payload/commit/ef84a2cfffbb1be52dd948e59eeec0ce324e9046))

## [2.3.0](https://github.com/payloadcms/payload/compare/v2.2.2...v2.3.0) (2023-11-30)


### Features

* add serbian (latin and cyrillic) translations ([#4268](https://github.com/payloadcms/payload/issues/4268)) ([40c8909](https://github.com/payloadcms/payload/commit/40c8909ee0003d45a1afa4524ade557268d01067))
* **db-mongodb:** search for migrations dir intelligently ([530c825](https://github.com/payloadcms/payload/commit/530c825f806708df8672e66c8e9c559c5e625e5e))
* **db-postgres:** search for migrations dir intelligently ([308979f](https://github.com/payloadcms/payload/commit/308979f31d27979955a52f32be4ea33849b48f30))
* **live-preview:** batches api requests ([#4315](https://github.com/payloadcms/payload/issues/4315)) ([d49bb43](https://github.com/payloadcms/payload/commit/d49bb4351f22f17f68477c3145594abbb60fab05))
* relationship sortOptions property ([#4301](https://github.com/payloadcms/payload/issues/4301)) ([224cddd](https://github.com/payloadcms/payload/commit/224cddd04573eff578ea3fa9ea5419f28b66c613))
* support migrations with js files ([2122242](https://github.com/payloadcms/payload/commit/21222421929ae19728c31bdccc84995ce3951224))
* support OAuth 2.0 format Authorization: Bearer tokens in headers ([c1eb9d1](https://github.com/payloadcms/payload/commit/c1eb9d1727daf96375e73943882621127b78e593))
* useDocumentEvents ([#4284](https://github.com/payloadcms/payload/issues/4284)) ([9bb7a88](https://github.com/payloadcms/payload/commit/9bb7a88526569a726de468de6b2010d52169ea77))


### Bug Fixes

* **db-postgres:** allow for nested block fields to be queried ([#4237](https://github.com/payloadcms/payload/issues/4237)) ([cd07873](https://github.com/payloadcms/payload/commit/cd07873fc544766b4aeeff873dfb8d6e3e97e9dc))
* **db-postgres:** error saving nested arrays with versions ([#4302](https://github.com/payloadcms/payload/issues/4302)) ([3514bfb](https://github.com/payloadcms/payload/commit/3514bfbdaee99341ae739d03591cb63bd9415fe3))
* duplicate documents with required localized fields ([#4236](https://github.com/payloadcms/payload/issues/4236)) ([9da9b1f](https://github.com/payloadcms/payload/commit/9da9b1fc5050d4f29bcf6dce2f22027834aaf698))
* incorrect key property in Tabs field component ([#4311](https://github.com/payloadcms/payload/issues/4311)) ([3502ce7](https://github.com/payloadcms/payload/commit/3502ce720b3020eed5fc733884b525303faa4c15)), closes [#4282](https://github.com/payloadcms/payload/issues/4282)
* **live-preview-react:** removes payload from peer deps ([7e1052f](https://github.com/payloadcms/payload/commit/7e1052fd98c88a4d68af08f98ccc8936edb8ebf6))
* **live-preview:** compounds merge results ([#4306](https://github.com/payloadcms/payload/issues/4306)) ([381c158](https://github.com/payloadcms/payload/commit/381c158b0303b515164ae487b0ce7e555ae1a08d))
* **live-preview:** property resets rte nodes ([#4313](https://github.com/payloadcms/payload/issues/4313)) ([66679fb](https://github.com/payloadcms/payload/commit/66679fbdd6f804bff8a58d9504c226c9fb8a57a0))
* **live-preview:** re-populates externally updated relationships ([#4287](https://github.com/payloadcms/payload/issues/4287)) ([57fc211](https://github.com/payloadcms/payload/commit/57fc2116749059bc55161897cf139031926035ec))
* **live-preview:** removes payload from peer deps ([b4af95f](https://github.com/payloadcms/payload/commit/b4af95f894b5f6614bace38ef79e7148e084bd3b))
* properly exports useDocumentsEvents hook ([#4314](https://github.com/payloadcms/payload/issues/4314)) ([5420963](https://github.com/payloadcms/payload/commit/542096361f0c13aed9c6a7d971e2c47047d8e2d2))
* properly sets tabs key in fieldSchemaToJSON ([#4317](https://github.com/payloadcms/payload/issues/4317)) ([9cc88bb](https://github.com/payloadcms/payload/commit/9cc88bb47443ecdf525f4c99d9f13d81c141c471))
* **richtext-lexical:** HTML Converter field not working inside of tabs ([#4293](https://github.com/payloadcms/payload/issues/4293)) ([5bf6493](https://github.com/payloadcms/payload/commit/5bf64933b4b99a0ac8ef7d1d91d0165a16636a9f))
* **richtext-lexical:** re-use payload population logic to fix population-related issues ([#4291](https://github.com/payloadcms/payload/issues/4291)) ([094d02c](https://github.com/payloadcms/payload/commit/094d02ce1d85106470a1a8c6ffe9050873f2e57a))
* **richtext-slate:** add use client to top of tsx files importing from payload core ([#4312](https://github.com/payloadcms/payload/issues/4312)) ([d4f28b1](https://github.com/payloadcms/payload/commit/d4f28b16b4d42f224e9c5e4254f9ec55107a2f97))


### BREAKING CHANGES

### ⚠️ @payloadcms/richtext-lexical

The `SlashMenuGroup` and `SlashMenuOption` classes have changed. If you have any custom lexical Features which are adding new slash menu entries, this will be a breaking change for you. If not, no action is required from your side.

Here are the breaking changes and how to migrate:

1. The `SlashMenuOption`'s first argument is now used as a `key` and not as a display name. Additionally, a new, optional `displayName` property is added which will serve as the display name. Make sure your `key` does not contain any spaces or special characters.
2. The `title` property of `SlashMenuGroup` has been replaced by a new, mandatory `key` and an optional `displayName` property. To migrate, you will have to remove the `title` property and add a `key` property instead - make sure you do not use spaces or special characters in the `key`.
3. Additionally, if you have custom styles targeting elements inside of slash or floating-select-toolbar menus, you will have to adjust those too, as the CSS classes changed

[This is an example of performing these updates](
https://github.com/payloadcms/payload/pull/4257/files#diff-dc2e7f503dd7076dff1d810da7ec77b8fc6a9e41127df4a417dece1b6e1587a0L61)

## [2.2.2](https://github.com/payloadcms/payload/compare/v2.2.1...v2.2.2) (2023-11-27)


### Features

* **i18n:** adds Korean translation ([#4258](https://github.com/payloadcms/payload/issues/4258)) ([1401718](https://github.com/payloadcms/payload/commit/1401718b3b549ce1454389a982474dbe159eb61f))


### Bug Fixes

* number field validation ([#4233](https://github.com/payloadcms/payload/issues/4233)) ([19fcfc2](https://github.com/payloadcms/payload/commit/19fcfc27af2ecb68ff989dcaed19b7b7d041a322))
* passes date options to the react-datepicker in filter UI, removes duplicate options from operators select ([#4225](https://github.com/payloadcms/payload/issues/4225)) ([3d2b62b](https://github.com/payloadcms/payload/commit/3d2b62b2100e36a54adc6a675257a4d671fdd469))
* prevent json data getting reset when switching tabs ([#4123](https://github.com/payloadcms/payload/issues/4123)) ([1dcd3a2](https://github.com/payloadcms/payload/commit/1dcd3a27825ed9d276b997a66f84bb2c05e87955))
* transactions broken within doc access ([443847e](https://github.com/payloadcms/payload/commit/443847ec716a3b87032d9d1904b6c90aadd47197))
* typo in polish translations ([#4234](https://github.com/payloadcms/payload/issues/4234)) ([56a4692](https://github.com/payloadcms/payload/commit/56a469266207ef83053b0c9176d1be4fc26087e6))

## [2.2.1](https://github.com/payloadcms/payload/compare/v2.2.0...v2.2.1) (2023-11-21)


### Bug Fixes

* make outputSchema optional on richtext config ([#4230](https://github.com/payloadcms/payload/issues/4230)) ([3a784a0](https://github.com/payloadcms/payload/commit/3a784a06cc6c42c96b8d6cf023d942e6661be7b5))

## [2.2.0](https://github.com/payloadcms/payload/compare/v2.1.1...v2.2.0) (2023-11-20)


### Features

* allow richtext adapters to control type generation, improve generated lexical types ([#4036](https://github.com/payloadcms/payload/issues/4036)) ([989c10e](https://github.com/payloadcms/payload/commit/989c10e0e0b36a8c34822263b19f5cb4b9ed6e72))
* hide publish button based on permissions ([#4203](https://github.com/payloadcms/payload/issues/4203)) ([de02490](https://github.com/payloadcms/payload/commit/de02490231fbc8936973c1b81ac87add39878d8b))
* **richtext-lexical:** Add new position: 'top' property for plugins ([eed4f43](https://github.com/payloadcms/payload/commit/eed4f4361cd012adf4e777820adbe7ad330ffef6))


### Bug Fixes

* fully define the define property for esbuild string replacement ([#4099](https://github.com/payloadcms/payload/issues/4099)) ([e22b95b](https://github.com/payloadcms/payload/commit/e22b95bdf3b2911ae67a07a76ec109c76416ea56))
* **i18n:** polish translations ([#4134](https://github.com/payloadcms/payload/issues/4134)) ([782e118](https://github.com/payloadcms/payload/commit/782e1185698abb2fff3556052fd16d2b725611b9))
* improves live preview breakpoints and zoom options in dark mode ([#4090](https://github.com/payloadcms/payload/issues/4090)) ([b91711a](https://github.com/payloadcms/payload/commit/b91711a74ad9379ed820b6675060209626b1c2d0))
* **plugin-nested-docs:** await populate breadcrumbs on resaveChildren ([#4226](https://github.com/payloadcms/payload/issues/4226)) ([4e41dd1](https://github.com/payloadcms/payload/commit/4e41dd1bf2706001fa03130adb1c69403795ac96))
* rename tab button classname to prevent unintentional styling ([#4121](https://github.com/payloadcms/payload/issues/4121)) ([967eff1](https://github.com/payloadcms/payload/commit/967eff1aabcc9ba7f29573fc2706538d691edfdd))
* **richtext-lexical:** add missing 'use client' to TestRecorder feature plugin ([fc26275](https://github.com/payloadcms/payload/commit/fc26275b7a85fd34f424f7693b8383ad4efe0121))
* **richtext-lexical:** Blocks: Array row data is not removed ([#4209](https://github.com/payloadcms/payload/issues/4209)) ([0af9c4d](https://github.com/payloadcms/payload/commit/0af9c4d3985a6c46a071ef5ac28c8359cb320571))
* **richtext-lexical:** Blocks: fields without fulfilled condition are now skipped for validation ([50fab90](https://github.com/payloadcms/payload/commit/50fab902bd7baa1702ae0d995b4f58c1f5fca374))
* **richtext-lexical:** Blocks: make sure fields are wrapped in a uniquely-named group, change block node data format, fix react key error ([#3995](https://github.com/payloadcms/payload/issues/3995)) ([c068a87](https://github.com/payloadcms/payload/commit/c068a8784ec5780dbdca5416b25ba654afd05458))
* **richtext-lexical:** Blocks: z-index issue, e.g. select field dropdown in blocks hidden behind blocks below, or slash menu inside nested editor hidden behind blocks below ([09f17f4](https://github.com/payloadcms/payload/commit/09f17f44508539cfcb8722f7f462ef40d9ed54fd))
* **richtext-lexical:** Floating Select Toolbar: Buttons and Dropdown Buttons not clickable in nested editors ([615702b](https://github.com/payloadcms/payload/commit/615702b858e76994a174159cb69f034ef811e016)), closes [#4025](https://github.com/payloadcms/payload/issues/4025)
* **richtext-lexical:** HTMLConverter: cannot find nested lexical fields ([#4103](https://github.com/payloadcms/payload/issues/4103)) ([a6d5f2e](https://github.com/payloadcms/payload/commit/a6d5f2e3dea178e1fbde90c0d6a5ce254a8db0d1)), closes [#4034](https://github.com/payloadcms/payload/issues/4034)
* **richtext-lexical:** incorrect caret positioning when selecting second line of multi-line paragraph ([#4165](https://github.com/payloadcms/payload/issues/4165)) ([b210af4](https://github.com/payloadcms/payload/commit/b210af46968b77d96ffd6ef60adc3b8d8bdc9376))
* **richtext-lexical:** make lexicalHTML() function work for globals ([dbfc835](https://github.com/payloadcms/payload/commit/dbfc83520ca8b5e55198a3c4b517ae3a80f9cac6))
* **richtext-lexical:** nested editor may lose focus when writing ([#4139](https://github.com/payloadcms/payload/issues/4139)) ([859c2f4](https://github.com/payloadcms/payload/commit/859c2f4a6d299a42e572133502b3841a74a11002))
* **richtext-lexical:** remove optional chaining after `this` as transpilers are not handling it well ([#4145](https://github.com/payloadcms/payload/issues/4145)) ([2c8d34d](https://github.com/payloadcms/payload/commit/2c8d34d2aadf2fcaf0655c0abef233f341d9945f))
* **richtext-lexical:** visual bug after rearranging blocks ([a6b4860](https://github.com/payloadcms/payload/commit/a6b486007dc26195adc5d576d937e35471c2868f))
* simplifies block/array/hasMany-number field validations  ([#4052](https://github.com/payloadcms/payload/issues/4052)) ([803a37e](https://github.com/payloadcms/payload/commit/803a37eaa947397fa0a93b9f4f7d702c6b94ceaa))
* synchronous transaction errors ([#4164](https://github.com/payloadcms/payload/issues/4164)) ([1510baf](https://github.com/payloadcms/payload/commit/1510baf46e33540c72784f2d3f98330a8ff90923))
* thread locale through to access routes from admin panel ([#4183](https://github.com/payloadcms/payload/issues/4183)) ([05f3169](https://github.com/payloadcms/payload/commit/05f3169a75b3b62962e7fe7842fbb6df6699433d))
* transactionID isolation for GraphQL ([#4095](https://github.com/payloadcms/payload/issues/4095)) ([195a952](https://github.com/payloadcms/payload/commit/195a952c4314e0d53fd579517035373b49d6ccae))
* upload fit not accounted for when editing focal point or crop ([#4142](https://github.com/payloadcms/payload/issues/4142)) ([45e9a55](https://github.com/payloadcms/payload/commit/45e9a559bbb16b2171465c8a439044011cebf102))

## [2.1.1](https://github.com/payloadcms/payload/compare/v2.1.0...v2.1.1) (2023-11-10)


### Bug Fixes

* conditionally hide dot menu in DocumentControls ([#4075](https://github.com/payloadcms/payload/issues/4075)) ([cef4cbb](https://github.com/payloadcms/payload/commit/cef4cbb0ee59e1b0b806808d79b402dce114755f))
* disable editing option for svg image types ([#4071](https://github.com/payloadcms/payload/issues/4071)) ([949e265](https://github.com/payloadcms/payload/commit/949e265cd9c95b7d4063336dde86177008d54839))
* fixes creation of related documents within a transaction if filterOptions is used ([#4087](https://github.com/payloadcms/payload/issues/4087)) ([acad288](https://github.com/payloadcms/payload/commit/acad2888cd9a13d5fb9e4c686b2267ea69454eaf))
* hide empty image sizes from the preview drawer ([#3946](https://github.com/payloadcms/payload/issues/3946)) ([687f485](https://github.com/payloadcms/payload/commit/687f4850acf073df0a649ef6182bfc8387857173))
* **live-preview:** ensures field schema exists before traversing fields ([#4074](https://github.com/payloadcms/payload/issues/4074)) ([7059a71](https://github.com/payloadcms/payload/commit/7059a71243a8f98dcc89af0bfe502247db9e4123))
* **live-preview:** field recursion and relationship population ([#4045](https://github.com/payloadcms/payload/issues/4045)) ([2ad7340](https://github.com/payloadcms/payload/commit/2ad73401546ef6608fd67d1f00b537f149640d6a))
* **live-preview:** properly handles apiRoute ([#4076](https://github.com/payloadcms/payload/issues/4076)) ([1f851f2](https://github.com/payloadcms/payload/commit/1f851f21b18c9a5076d9afc9a31abc7a97fcb0df))
* **plugin-nested-docs:** sync write transaction errors ([#4084](https://github.com/payloadcms/payload/issues/4084)) ([47efd3b](https://github.com/payloadcms/payload/commit/47efd3b92e99594dd5b61f0017f4eb76e1d36eb7))
* possible issue with access control not using req ([#4086](https://github.com/payloadcms/payload/issues/4086)) ([348a70c](https://github.com/payloadcms/payload/commit/348a70cc33409b0b48aff3acd2b94c2df5d88f3b))
* **richtext-lexical:** Blocks: unnecessary saving node value when initially opening a document & new lexical tests ([#4059](https://github.com/payloadcms/payload/issues/4059)) ([fff377a](https://github.com/payloadcms/payload/commit/fff377ad22cce3b26142cde8f4125fcee95aa072))
* **richtext-lexical:** floating select toolbar caret not positioned correctly if first line is selected ([#4062](https://github.com/payloadcms/payload/issues/4062)) ([c462df3](https://github.com/payloadcms/payload/commit/c462df38f65b155e131e6a7b46b2bb16cd090e45))

## [2.1.0](https://github.com/payloadcms/payload/compare/v2.0.15...v2.1.0) (2023-11-08)


### Features

* add internationalization (i18n) to locales ([#4005](https://github.com/payloadcms/payload/issues/4005)) ([6a0a859](https://github.com/payloadcms/payload/commit/6a0a859563ed9e742260ea51a1839a1ef0f61fce))
* Custom Error, Label, and before/after field components ([#3747](https://github.com/payloadcms/payload/issues/3747)) ([266c327](https://github.com/payloadcms/payload/commit/266c3274d03e4fd52c692eeef1ee9248dcf66189))


### Bug Fixes

* error on graphql multiple queries ([#3985](https://github.com/payloadcms/payload/issues/3985)) ([57da3c9](https://github.com/payloadcms/payload/commit/57da3c99a7e4ce5d3d1e17315e3691815f363704))
* focal and cropping issues, adds test ([#4039](https://github.com/payloadcms/payload/issues/4039)) ([acba5e4](https://github.com/payloadcms/payload/commit/acba5e482b7ddc6e3dc6ba9b7736022770d69a55))
* handle invalid tokens in refresh token operation ([#3647](https://github.com/payloadcms/payload/issues/3647)) ([131d89c](https://github.com/payloadcms/payload/commit/131d89c3f50c237e1ab2d7cd32d7a8226a9f8ce3))
* hasMany number and select fields unable to save within arrays ([#4047](https://github.com/payloadcms/payload/issues/4047)) ([182c57b](https://github.com/payloadcms/payload/commit/182c57b191010ce3dcf659f39c1dc2f7cf80662e))
* injects array and block ids into fieldSchemaToJSON ([#4043](https://github.com/payloadcms/payload/issues/4043)) ([d068ef7](https://github.com/payloadcms/payload/commit/d068ef7e2483d49dc41bdd7735042ddcaa0a684c))
* parse predefined migrations via file arg or name prefix ([#4001](https://github.com/payloadcms/payload/issues/4001)) ([eb42c03](https://github.com/payloadcms/payload/commit/eb42c031ef980558ed051d4163925aa28d6ab090))
* polymorphic hasMany relationships missing in postgres admin ([#4053](https://github.com/payloadcms/payload/issues/4053)) ([7a9af44](https://github.com/payloadcms/payload/commit/7a9af4417a56c621f01195f9a2904b9adffaad7a))
* resets list filter row when the filter on field is changed ([#3956](https://github.com/payloadcms/payload/issues/3956)) ([8d14c21](https://github.com/payloadcms/payload/commit/8d14c213c878a1afda2b3bf03431fed5aa2a44e3))
* Update API Views ([b008b6c](https://github.com/payloadcms/payload/commit/b008b6c6463c9dc3d8e61eaa0a9210aa1a189442))
* vite not replacing env vars correctly when building ([67b3baa](https://github.com/payloadcms/payload/commit/67b3baaa445a13246be8178d57eaeba92888bef1))

## [2.0.15](https://github.com/payloadcms/payload/compare/v2.0.14...v2.0.15) (2023-11-03)


### Bug Fixes

* autosave updating data in unrelated docs ([b722f20](https://github.com/payloadcms/payload/commit/b722f202af39a1429298b700cac686ecbbd4b46b))
* better error handling within parseCookies ([#3720](https://github.com/payloadcms/payload/issues/3720)) ([6b1b4ff](https://github.com/payloadcms/payload/commit/6b1b4ffd27cc9a84e22ef2f3a8e389e5b72d41bc))
* block row removal w/ db-postgres adapter ([#3951](https://github.com/payloadcms/payload/issues/3951)) ([5ea88bb](https://github.com/payloadcms/payload/commit/5ea88bb47d9ed6457331ceab7d7c82b0face8311))
* deeply merges view configs ([#3954](https://github.com/payloadcms/payload/issues/3954)) ([a5b2333](https://github.com/payloadcms/payload/commit/a5b2333140447b12dbafd68592108ac342af4ea7))
* do not display field if read permission is false - admin panel ui ([#3949](https://github.com/payloadcms/payload/issues/3949)) ([cdc10be](https://github.com/payloadcms/payload/commit/cdc10be1a241c6a9ac09feab77bcd58d23ff3dd9))
* ensures dataloader does not run requests in parallel ([4607dbf](https://github.com/payloadcms/payload/commit/4607dbf97694bc899e597e9c7df50b6c878874f5))
* exclude files from dev bundle if aliased ([#3957](https://github.com/payloadcms/payload/issues/3957)) ([7966692](https://github.com/payloadcms/payload/commit/796669279afb8fe23723ce36e6e47a44b7088b09))
* field paths being mutated if they ended with the req.locale ([#3936](https://github.com/payloadcms/payload/issues/3936)) ([36576f1](https://github.com/payloadcms/payload/commit/36576f152ace41edd8b353703db2598d04deae44))
* findVersions pagination ([#3906](https://github.com/payloadcms/payload/issues/3906)) ([1f8f173](https://github.com/payloadcms/payload/commit/1f8f173741fd524c7c2f11cc104672854f625da9))
* global autosave and relevant e2e test ([a9d96b1](https://github.com/payloadcms/payload/commit/a9d96b10376fe1a4731b2ddb4d26ce38e333d5cb))
* **i18n:** polish translations ([#3934](https://github.com/payloadcms/payload/issues/3934)) ([e4881bb](https://github.com/payloadcms/payload/commit/e4881bb02f7c1e8f96d5b405c57e0fdc01a2e7fe))
* passes correct data to buildStateFromSchema on account page ([#3984](https://github.com/payloadcms/payload/issues/3984)) ([c7a315a](https://github.com/payloadcms/payload/commit/c7a315a7d1075361a7ee432a449769397c12185e))
* prevent sort from saving a new version in version list view ([#3944](https://github.com/payloadcms/payload/issues/3944)) ([900a9ea](https://github.com/payloadcms/payload/commit/900a9eafeb51b1e5130518d4f71034a2bf9e4c5b))
* properly load temp files into buffer ([#3996](https://github.com/payloadcms/payload/issues/3996)) ([d1a0822](https://github.com/payloadcms/payload/commit/d1a0822f8044a3f65416f4fe608e91a4ceea6b56))
* sort document tabs by order ([#3968](https://github.com/payloadcms/payload/issues/3968)) ([06cd52b](https://github.com/payloadcms/payload/commit/06cd52b622723503896af6262907d31b258d0a5e))
* vertical alignment in step nav when using larger logos ([#3955](https://github.com/payloadcms/payload/issues/3955)) ([b6d9a20](https://github.com/payloadcms/payload/commit/b6d9a2021fafea594353329fd304553bf7f2d091))

## [2.0.14](https://github.com/payloadcms/payload/compare/v2.0.13...v2.0.14) (2023-10-30)


### Bug Fixes

* adds null to non-required field unions ([#3870](https://github.com/payloadcms/payload/issues/3870)) ([7e919aa](https://github.com/payloadcms/payload/commit/7e919aa87c0116c41bf41d75dcd91ff96576a46f))
* checks for user before accessing properties in preferences update operation([#3844](https://github.com/payloadcms/payload/issues/3844)) ([24eab3a](https://github.com/payloadcms/payload/commit/24eab3af1da3b08debe0580cce8ece08a86039a4))
* **db-mongodb:** improve find query performance ([#3836](https://github.com/payloadcms/payload/issues/3836)) ([56e58e9](https://github.com/payloadcms/payload/commit/56e58e9ec732f8365f53f214a9e950fbc2a7d8b9)), closes [#3904](https://github.com/payloadcms/payload/issues/3904)
* **db-mongodb:** versions pagination ([#3875](https://github.com/payloadcms/payload/issues/3875)) ([4f2b080](https://github.com/payloadcms/payload/commit/4f2b080d1cb5f9d4ab80aa106650307c11e8811b))
* disable webpack hot reload on production ([#3891](https://github.com/payloadcms/payload/issues/3891)) ([422c803](https://github.com/payloadcms/payload/commit/422c803da67982a063a028508c44009b9577646e))
* duplicate document copying to incorrect locale ([#3874](https://github.com/payloadcms/payload/issues/3874)) ([89f273b](https://github.com/payloadcms/payload/commit/89f273bf894512b69e8647be4cf4496bff37c99b))
* enables nested AND/OR queries ([#3834](https://github.com/payloadcms/payload/issues/3834)) ([237eebd](https://github.com/payloadcms/payload/commit/237eebdf87b7d33baa9baaa54946f4ebb4276bfb))
* ensure serverURL has string value for getBaseUploadFields function ([#3900](https://github.com/payloadcms/payload/issues/3900)) ([c564a83](https://github.com/payloadcms/payload/commit/c564a83ab61b672d9a2bcc875ab890b0fede5462))
* ensures compare-version select field cannot be cleared ([#3901](https://github.com/payloadcms/payload/issues/3901)) ([42d8d11](https://github.com/payloadcms/payload/commit/42d8d11fd7e5792b119f69f17dc1100c85cfa491))
* error handling when duplicating documents fails ([#3873](https://github.com/payloadcms/payload/issues/3873)) ([435eb62](https://github.com/payloadcms/payload/commit/435eb6204e550e898a81033f794fcf568e3b017c))
* generate new block ids on create ([#3871](https://github.com/payloadcms/payload/issues/3871)) ([3404bab](https://github.com/payloadcms/payload/commit/3404bab83f1112713675eb504870a4a1786c3822))
* global permissions for live preview ([#3854](https://github.com/payloadcms/payload/issues/3854)) ([3032e0b](https://github.com/payloadcms/payload/commit/3032e0b5a239db0762abd120b2db95f30ed5ca65))
* handles null & undefined relationship field values in versions view ([#3609](https://github.com/payloadcms/payload/issues/3609)) ([115e592](https://github.com/payloadcms/payload/commit/115e592b54d9174f316daa3cff31bcc801eaf92f))
* incorrect duplication of data in admin ui ([#3907](https://github.com/payloadcms/payload/issues/3907)) ([46fc41c](https://github.com/payloadcms/payload/commit/46fc41cbd9615c58248b4d2c44d24905dd676171))
* only apply focal manipulation when necessary ([#3902](https://github.com/payloadcms/payload/issues/3902)) ([a4f36aa](https://github.com/payloadcms/payload/commit/a4f36aa8a009e9c0156924320bbcf1d04b697223))
* graphql query errors transaction race condition ([#3795](https://github.com/payloadcms/payload/issues/3795)) ([dc13b10](https://github.com/payloadcms/payload/commit/dc13b101f7351f7bae60a4a4bbc25907ed82210f))
* removes conditional return of formattedEmails in sendEmail hook [#26](https://github.com/payloadcms/payload/issues/26) ([#28](https://github.com/payloadcms/payload/issues/28)) ([e8458f8](https://github.com/payloadcms/payload/commit/e8458f84bcd5bad74b189479931fbb7faea74900))
* resize image if no aspect ratio change ([#3859](https://github.com/payloadcms/payload/issues/3859)) ([f53b713](https://github.com/payloadcms/payload/commit/f53b7131548dbe9071c65ba110f7f0d206bb33b5))
* **richtext-*:** type issues with typescript strict mode enabled ([dac9514](https://github.com/payloadcms/payload/commit/dac9514eb00b99a3caeb9f217695b2b89368f7c9))
* **richtext-lexical:** Blocks node incorrectly marked as client module ([35f00fa](https://github.com/payloadcms/payload/commit/35f00fa83d2a90967e0707ca0fd960c5608a3bf3))
* **richtext-lexical:** remove unnecessary dependencies (fixes [#3889](https://github.com/payloadcms/payload/issues/3889)) ([760565f](https://github.com/payloadcms/payload/commit/760565f1e96e4cb1f6bce8663ad3fa8a16a2601c))
* set date to 12UTC for default, dayOnly and monthOnly fields ([#3887](https://github.com/payloadcms/payload/issues/3887)) ([d393225](https://github.com/payloadcms/payload/commit/d3932252891bb8721a5abc97e204dbb6a7f3fda2))
* store resized image on req or tempFilePath ([#3883](https://github.com/payloadcms/payload/issues/3883)) ([6c5d525](https://github.com/payloadcms/payload/commit/6c5d525d8e1267eebdffeb9f31b2ef3a4df1132d))
* unique field error handling ([#3888](https://github.com/payloadcms/payload/issues/3888)) ([4d8d4c2](https://github.com/payloadcms/payload/commit/4d8d4c214ab12571e9dc71e406117c4b19f63c6b))

## [2.0.13](https://github.com/payloadcms/payload/compare/v2.0.12...v2.0.13) (2023-10-24)

### Bug Fixes

* adjusts props to accept components for before and after fields instead of functions ([#3820](https://github.com/payloadcms/payload/issues/3820)) ([c476d01](https://github.com/payloadcms/payload/commit/c476d01f4e5016f9c2bc338103ef2c778139a536))
* alignment of collapsible within row ([#3822](https://github.com/payloadcms/payload/issues/3822)) ([eaef0e7](https://github.com/payloadcms/payload/commit/eaef0e739546b4411d971da21170977ba73695f8))
* named tabs not appearing in the gql mutation input type ([#3835](https://github.com/payloadcms/payload/issues/3835)) ([a0019d0](https://github.com/payloadcms/payload/commit/a0019d0a78504b5c4d6aeec4823d7a0e224f1d6b))
* only parses live preview ready message when same origin ([#3791](https://github.com/payloadcms/payload/issues/3791)) ([e8f2377](https://github.com/payloadcms/payload/commit/e8f237783b9f48edf80b1d8c61142aeb2edb1c0b))
* prevent storing duplicate user preferences ([#3833](https://github.com/payloadcms/payload/issues/3833)) ([7eee0ec](https://github.com/payloadcms/payload/commit/7eee0ec3558c8b65afc38df7377073f042402ee3))
* prevents document sidebar from collapsing ([71a3e5b](https://github.com/payloadcms/payload/commit/71a3e5ba1037fe447dccad4a490fdfb1623ba0b0))
* renders live preview for globals ([#3801](https://github.com/payloadcms/payload/issues/3801)) ([a13ec2e](https://github.com/payloadcms/payload/commit/a13ec2ebc4858029c643f4530daa4ed49a7b024e))
* reverting localized versions ([#3831](https://github.com/payloadcms/payload/issues/3831)) ([5a0d0db](https://github.com/payloadcms/payload/commit/5a0d0dbc02850c0cd2035487361ba6e7a317bce7))


## [2.0.12](https://github.com/payloadcms/payload/compare/v2.0.11...v2.0.12) (2023-10-23)

### Features

* collection, global and field props for hooks, fix request context initialization, add context to global hooks ([#3780](https://github.com/payloadcms/payload/pull/3780))
* **richtext-lexical:** HTML Serializer ([#3685](https://github.com/payloadcms/payload/pull/3685))

### Bug Fixes

* remove duplicate removal of temp upload file ([#3818](https://github.com/payloadcms/payload/pull/3818))
* simplify how the search input and query params are connected ([#3797](https://github.com/payloadcms/payload/pull/3797))
* standardizes layout of document fields ([#3798](https://github.com/payloadcms/payload/pull/3798))
* issue where dragging unsortable item would crash the page ([#3789](https://github.com/payloadcms/payload/pull/3789))
* **richtext-lexical:** defaultValue property didn't fit into field schema ([b5c7bbed9](https://github.com/payloadcms/payload/commit/b5c7bbed93b532ec54a9c73537f4cb1290122a66))
* **richtext-*:** hasMany relationships not populated correctly ([e197e0316](https://github.com/payloadcms/payload/commit/e197e0316f9c01f945dc7f6d21ac28f9f0420f1d))

## [2.0.11](https://github.com/payloadcms/payload/compare/v2.0.10...v2.0.11) (2023-10-19)

### Features

* add ability to opt out of type gen declare statement ([#3765](https://github.com/payloadcms/payload/pull/3765))

### Bug Fixes

* corrects versions collection casing ([#3739](https://github.com/payloadcms/payload/pull/3739))
* updates req after file resize ([#3754](https://github.com/payloadcms/payload/pull/3754))
* correctly renders focal point when crop is set to false ([#3759](https://github.com/payloadcms/payload/pull/3759))
* account for many slug types in generate types ([#3698](https://github.com/payloadcms/payload/pull/3698))
* handle graphQL: false on globals when building policy type ([#3729](https://github.com/payloadcms/payload/pull/3729))
* renders id as fallback title in DeleteDocument ([#3745](https://github.com/payloadcms/payload/pull/3745))
* properly handles hideAPIURL ([#3721](https://github.com/payloadcms/payload/pull/3721))
* filesRequiredOnCreate typing, tests, linting ([#3737](https://github.com/payloadcms/payload/pull/3737))

* **webpack-bundler:** corrects payload alias ([#3769](https://github.com/payloadcms/payload/pull/3769))
* **bundler-webpack:** better node_modules resolution ([#3744](https://github.com/payloadcms/payload/pull/3744))
* **db-postgres:** block and array inserts error ([#3714](https://github.com/payloadcms/payload/pull/3714))
* **live-preview:** properly handles uploads and hasOne monomorphic relationships ([#3719](https://github.com/payloadcms/payload/pull/3719))

## [2.0.10](https://github.com/payloadcms/payload/compare/v2.0.9...v2.0.10) (2023-10-17)

### Features

* filesRequired is optional for uploads ([#3668](https://github.com/payloadcms/payload/pull/3668)) ([48de897](https://github.com/payloadcms/payload/commit/48de89794b2c5d94183090b0830fd355d8d6c6f3))

### Bug Fixes

* Register first user verify update missing transaction id / req ([#3665](https://github.com/payloadcms/payload/pull/3665)) ([68c5a5751](https://github.com/payloadcms/payload/commit/68c5a57515ffbba37c9194a75d0f672bdb10d96b))

## [2.0.8](https://github.com/payloadcms/payload/compare/v2.0.7...v2.0.8) (2023-10-17)


### Features

* allows filterOptions to return null ([c4cac99](https://github.com/payloadcms/payload/commit/c4cac998752730e7084598c92c77789da8c82e0d))
* **live-preview:** caches field schema ([#3711](https://github.com/payloadcms/payload/issues/3711)) ([dd0ac06](https://github.com/payloadcms/payload/commit/dd0ac066ce2ed88b85025309303610a95b6089e1))

### Bug Fixes

* autosave time shown minutes only ([#3492](https://github.com/payloadcms/payload/issues/3492)) ([e311e8f](https://github.com/payloadcms/payload/commit/e311e8fff9cd4264d7a71903f63c4fa825a3564d))
* blocks within groups in postgres ([45a62ba](https://github.com/payloadcms/payload/commit/45a62ba949aca33b25e0808773a5c2f1cf4adf82))
* bug with seeding ecommerce ([993568a](https://github.com/payloadcms/payload/commit/993568a1959ea10f960e35e4ed7a8e06af672a72))
* corrects add block index ([#3681](https://github.com/payloadcms/payload/issues/3681)) ([3c50443](https://github.com/payloadcms/payload/commit/3c5044368d5b30c76a2ff20c25b9234ef89dc205))
* misc upload crop/focal point updates ([#3580](https://github.com/payloadcms/payload/issues/3580)) ([d616772](https://github.com/payloadcms/payload/commit/d6167727401a01282345e63636560e029ae8e0f3))
* renders mobile document controls ([#3695](https://github.com/payloadcms/payload/issues/3695)) ([1625ff2](https://github.com/payloadcms/payload/commit/1625ff244e6e81e6edc0357037c3abc1a3bf8ba7))
* some local operations missing req.transactionID ([#3651](https://github.com/payloadcms/payload/issues/3651)) ([150799e](https://github.com/payloadcms/payload/commit/150799e10e580281d1af49388eb142ee9639a002))
* **richtext-*:** extra fields not being iterated correctly ([#3693](https://github.com/payloadcms/payload/issues/3693)) ([b8a5866](https://github.com/payloadcms/payload/commit/b8a58666e70f604af1e1cf349bcb4f9add0147e7))
* **richtext-*:** link drawer form receiving incorrect field schema ([#3696](https://github.com/payloadcms/payload/issues/3696)) ([cb39354](https://github.com/payloadcms/payload/commit/cb39354a9de3d20960110e453f62c4aa166d8448))
* **richtext-lexical:** [#3682](https://github.com/payloadcms/payload/issues/3682) isolated editor container causing z-index issues ([24918fe](https://github.com/payloadcms/payload/commit/24918fe1d2ca251e211632765d370c214cef2a38))
* **templates:** user access control ([#3712](https://github.com/payloadcms/payload/issues/3712)) ([8b8ceab](https://github.com/payloadcms/payload/commit/8b8ceabbdd6354761e7d744cacb1192cac3a2427))


## [2.0.6](https://github.com/payloadcms/payload/compare/v2.0.5...v2.0.6) (2023-10-14)

### Bug Fixes

* document sidebar vertical overflow ([#3639](https://github.com/payloadcms/payload/issues/3639)) ([fcd4c8d](https://github.com/payloadcms/payload/commit/fcd4c8d83040f00d10142ca12ba92616618b966e))
* login form clearing out and field spacing ([#3633](https://github.com/payloadcms/payload/issues/3633)) ([4bd01df](https://github.com/payloadcms/payload/commit/4bd01df411e4ad2ccacdcd6de0fb21a8145c3964))
* sidebar field permissions ([#3629](https://github.com/payloadcms/payload/issues/3629)) ([c956a85](https://github.com/payloadcms/payload/commit/c956a85252bc7de1686925cc783694383c0ac9be))
* preview button conditions ([#3613](https://github.com/payloadcms/payload/issues/3613)) ([beed83b](https://github.com/payloadcms/payload/commit/beed83b231b19090902dd502ff5eab054a67a1a6))
* allows drafts to be duplicated ([1a99d66](https://github.com/payloadcms/payload/commit/1a99d66cd0675cf2cb2c4317a121721f35682ff3))


## [2.0.5](https://github.com/payloadcms/payload/compare/v2.0.4...v2.0.5) (2023-10-12)

### Bug Fixes

* properly renders custom buttons for globals ([#3616](https://github.com/payloadcms/payload/issues/3616)) ([05cc287](https://github.com/payloadcms/payload/commit/05cc2873b4a19e2bd46be778f3610643d3e15d09))
* minor type issue in richText validate function ([06a51b3](https://github.com/payloadcms/payload/commit/06a51b3c9b9045b23051807aa03b222b542b46f5))
* live preview device size ([#3606](https://github.com/payloadcms/payload/issues/3606)) ([8bbac60](https://github.com/payloadcms/payload/commit/8bbac60e60a6dbe4dc0c7b05edbca7f6f2d1c569))
* properly handles nested routes for live preview ([#3586](https://github.com/payloadcms/payload/issues/3586)) ([6486468](https://github.com/payloadcms/payload/commit/64864686c418f9822bf61c45ece078a39e81b4cb))
* various stepnav related issues ([#3599](https://github.com/payloadcms/payload/issues/3599)) ([aaf8839](https://github.com/payloadcms/payload/commit/aaf883909c588bae1145ddddc5291a98740c2c03))
* database adapter types ([cc56da1](https://github.com/payloadcms/payload/commit/cc56da11d635d11ebbee67e6d0919c7275ede36e))
* postgres select fields within groups ([#3570](https://github.com/payloadcms/payload/issues/3570)) ([06e2fa9](https://github.com/payloadcms/payload/commit/06e2fa9d111c18fad3422953082266db9329fc91))
* [#3511](https://github.com/payloadcms/payload/issues/3511), documents don't delete their versions ([#3520](https://github.com/payloadcms/payload/issues/3520)) ([e3c7765](https://github.com/payloadcms/payload/commit/e3c776523a64da03a4756ee5ae8a84175090979f))

### Documentation

- updates building your own live preview hook ([#3604](https://github.com/payloadcms/payload/issues/3604)) ([15c7f0dbf](https://github.com/payloadcms/payload/commit/15c7f0dbf3ebf5c6a2bb011970dda515a15acb56))
- update config overview ([cfd923140](https://github.com/payloadcms/payload/commit/1a006fef19a215d7ef74c71a210fd511727f95bd))

## [2.0.4](https://github.com/payloadcms/payload/compare/v2.0.3...v2.0.4) (2023-10-12)

### Bug Fixes

- API tab breadcrumbs and results indentation ([#3564](https://github.com/payloadcms/payload/issues/3564)) ([e0afeec](https://github.com/payloadcms/payload/commit/e0afeeca974d0a0cac7aca8e40f9436449c902b5))
- sticky sidebar ([#3563](https://github.com/payloadcms/payload/issues/3563)) ([76e306d](https://github.com/payloadcms/payload/commit/76e306ddd8aae45f03fd4715415d6a44501a9400))
- sidebar width when fields have long descriptions ([#3562](https://github.com/payloadcms/payload/issues/3562)) ([cfc78ed](https://github.com/payloadcms/payload/commit/cfc78ed4f58647769f651da5a952fed20cfb217f))
- row field margins ([#3558](https://github.com/payloadcms/payload/issues/3558)) ([6d9353b](https://github.com/payloadcms/payload/commit/6d9353b53f4197bae2b15ca95298a87d784c7e76))
- removes nested array field configs from array value ([#3549](https://github.com/payloadcms/payload/issues/3549)) ([af892ec](https://github.com/payloadcms/payload/commit/af892ecb0e67777a97206bb5fccf489387ce68fc))
- [#3521](https://github.com/payloadcms/payload/issues/3521) ([eb97acd](https://github.com/payloadcms/payload/commit/eb97acd408f128438c2122ab6a6e2930f5b4a1ca))
- [#3540](https://github.com/payloadcms/payload/issues/3540) ([2567ac5](https://github.com/payloadcms/payload/commit/2567ac58bac851d0a15ee40db0f5f4737b199a75))
- row field width ([#3550](https://github.com/payloadcms/payload/issues/3550)) ([9ff014b](https://github.com/payloadcms/payload/commit/9ff014bbfe08d7b114c11824294f0d59f5f6c2c3))
- [#3541](https://github.com/payloadcms/payload/issues/3541) ([e6f0d35](https://github.com/payloadcms/payload/commit/e6f0d3598549a921e36f470adfcbacbaebaea53f))
- renders global label as page title ([#3532](https://github.com/payloadcms/payload/issues/3532)) ([ace3e57](https://github.com/payloadcms/payload/commit/ace3e577f6b1cbeb12860dc936c578c2a1f68570))
- increases document controls popup list button hitbox ([#3529](https://github.com/payloadcms/payload/issues/3529)) ([f009593](https://github.com/payloadcms/payload/commit/f0095937bafdd85c53c99bcc1d29d3361aa07238))

### Documentation

- removes MONGODB_URI ([8bfae6b93](https://github.com/payloadcms/payload/commit/8bfae6b932d6c9bd0c628a203ebf8d24121d66f8))
- adds build your own plugin page ([#3184](https://github.com/payloadcms/payload/pull/3184)) ([15f650afd](https://github.com/payloadcms/payload/commit/15f650afdef717d62c162846fec77aa0f326bb43))

## [2.0.3](https://github.com/payloadcms/payload/compare/v2.0.2...v2.0.3) (2023-10-09)

### Bug Fixes

- webpack export default was not found [#3494](https://github.com/payloadcms/payload/issues/3494) ([be049ce](https://github.com/payloadcms/payload/commit/be049cea0029cf497822e337777b8a86b7d38bed))
- postgres generated type id [#3504](https://github.com/payloadcms/payload/issues/3504) ([c90d1fa](https://github.com/payloadcms/payload/commit/c90d1faa7fedd5d902949089fd457c56eed4643d))
- hasMany relationships unable to be cleared [#3513](https://github.com/payloadcms/payload/issues/3513) ([5d9384f](https://github.com/payloadcms/payload/commit/5d9384f53052c96403d8c07ae9d05edf3676c4ef))

### Documentation

- move payload script mention to top of migrations ([26967fb92](https://github.com/payloadcms/payload/commit/26967fb92))
- payload script in package.json ([2f86c196e](https://github.com/payloadcms/payload/commit/2f86c196e))
- updates required node version ([70e068b18](https://github.com/payloadcms/payload/commit/70e068b18))
- improves custom views (#3499) ([6c17222a6](https://github.com/payloadcms/payload/commit/6c17222a6))

## [2.0.2](https://github.com/payloadcms/payload/compare/v2.0.1...v2.0.2) (2023-10-09)

### Bug Fixes

- beforeOperation hooks now correctly only run once ([e5d6a75](https://github.com/payloadcms/payload/commit/e5d6a75449acce2e53820a65386f1af78ff1317b))

## [2.0.1](https://github.com/payloadcms/payload/compare/v2.0.0...v2.0.1) (2023-10-09)

### Bug Fixes

- fix: richtext adapter types (#3497) ([7679e3f0a](https://github.com/payloadcms/payload/commit/7679e3f0aa351832ca933a3978d5931c47375e8b))

### Documentation

- remove --save flag for install command ([f7c35df6d](https://github.com/payloadcms/payload/commit/f7c35df6de6817ef33837f60951cd2812431fec7))
- updates live preview docs ([ca97f692c](https://github.com/payloadcms/payload/commit/ca97f692c3d470e658e417daf29213b2b2b49e11))
- fixes label for rich text overview ([7df1256bf](https://github.com/payloadcms/payload/commit/7df1256bf61daa911089d308cf7c0532d524c9c6))

## [2.0.0](https://github.com/payloadcms/payload/releases/tag/v2.0.0) (2023-10-09)

### Features

- New [database adapter pattern](https://payloadcms.com/docs/database/overview)
- Official [Postgres adapter](https://payloadcms.com/docs/database/postgres) released, built on [Drizzle ORM](https://orm.drizzle.team)
- Database [transactions](https://payloadcms.com/docs/database/transactions) added
- Full, first-party [migration support](https://payloadcms.com/docs/database/migrations) added
- The admin UI has been redesigned to be more extensible and offer more horizontal real estate
- Admin UI sidebar is now collapsible
- [Live preview](https://payloadcms.com/docs/live-preview/overview) added to admin UI, including usable frontend hooks
- New "Views" API added, which allows for custom sub-views on List and Edit views within Admin UI
- New [bundler adapter pattern](https://payloadcms.com/docs/admin/bundlers) released
- Official [Vite bundler](https://payloadcms.com/docs/admin/vite) released
- Offical [Lexical rich text adapter](https://payloadcms.com/docs/rich-text/lexical) released
- Lexical rich text editor now supports drag and drop of rich text elements
- Lexical rich text now supports Payload blocks directly within rich text editor
- Upload image cropping added
- Upload "focal point" controls added
- New "API" view added to Edit view(s), allowing for quick and customizable references to API response
- MongoDB draft querying has been significantly improved and is now much faster
- Arabic / RTL UI support added
- Locales can now be further configured to accept settings like `rtl`, human-friendly labels, etc.
- The `tsconfig` `path` pointing to your generated Payload types is no longer required for types to work

### BREAKING CHANGES

### ⚠️ You now need to provide your Payload config with a database, a bundler, and a rich text adapter

Here's an example of a barebones Payload config, set up to work as 1.0 did:

```ts
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { slateEditor } from "@payloadcms/richtext-slate";
import { webpackBundler } from "@payloadcms/bundler-webpack";
import { buildConfig } from "payload/config";

export default buildConfig({
  admin: {
    bundler: webpackBundler(),
  },
  editor: slateEditor({}),
  collections: [
    // your collections here
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
});
```

These new properties are all now required for Payload to function, and you will have to install each separate adapter that you use. Feel free to swap out any of the adapters with your choice (Lexical, Postgres, Vite, etc.)

Make sure to install the packages that you need. In the above example, you would need to install the following:

```bash
npm install --save @payloadcms/db-mongodb @payloadcms/richtext-slate @payloadcms/bundler-webpack
```

### ⚠️ Draft versions now require a `latest: true` property to be set on the most recent draft in your `_versions` collections(s)

We have a ready-to-go migration script for your versions from v1 to v2, and to use it, all you have to do is run the following commands:

**1. First, make sure you have a `payload` npm script in your `package.json`**

```json
{
  "scripts": {
    "payload": "cross-env PAYLOAD_CONFIG_PATH=src/payload.config.ts payload"
  }
}
```

Adjust the `PAYLOAD_CONFIG_PATH` to point to your Payload config file if necessary.

**2. Create a migration, using the new Payload migration API**

```bash
npm run payload migrate:create --file @payloadcms/db-mongodb/versions-v1-v2
```

The above command will output a migration file into your `./src/migrations` folder (default migrations location). It contains a migration script to automatically add a `latest: true` flag to each of your newest drafts, for all draft-enabled collections. It works out of the box!

**3. Run migrations**

From there, you need to run migrations. Run the following command to execute your new migration:

```bash
npm run payload migrate
```

And you'll be all good!

### ⚠️ Array and block field validations now accept the full array of field data as their validation argument instead of the value.length

This change should only affect you if you have a custom array / block validation defined.

### ⚠️ For MongoDB, all models have been moved from the Payload object to the database adapter

For example, if you are leveraging Mongoose models directly, in 1.0, you would have accessed them via `payload.collections[myCollectionSlug].Model`. Now, you can access the Mongoose model from `payload.db.collections[myCollectionSlug]`.

Version models can be accessed from `payload.db.versions[myEntitySlug]`, and the global model can be accessed via `payload.db.globals`.

### ⚠️ User preferences data shape has changed, and you will lose preferences unless you manually migrate them to the new shape

We don't have a migration ready to go yet for user preferences, and this typically wouldn't be a big deal for most Payload projects. So don't let it stop you from updating unless you have a serious amount of user preferences that you'd like to keep. If so, we'll come up with a migration script for you and hook you up. Just reach out to us on Discord to ask for this.

### ⚠️ Node 16 is now the minimum required node version and Node 14 is no longer supported

Pretty self-explanatory on this one. Node 14 is old.

### ⚠️ The Pino logger has been updated, which may require you to make changes to your Pino config if you have a custom one

If you don't have anything custom with the Pino logger, this does not apply to you.

### ⚠️ Transactions are now enabled by default if your database supports them

MongoDB requires a replica set for transactions to work, so they likely are not going to work for you unless you do indeed have a replica set configured. But if you do, transactions will now instantly work for all internal Payload operations.

This means that in some fringe cases, if you are creating a doc and then instantly trying to update it within an `afterChange` hook, the newly created doc may not truly exist yet. This should not cause any problems for 99% of projects, but if you think this applies to you, might be good to double-check through your code.

To avoid any issues, you can pass the `req.transactionID` through to your Local API calls, so that your Local API calls are included as part of the parent transaction.

### ⚠️ Locales now have more functionality, and in some places, you might need to update custom code

Payload's locales have become more powerful and now allow you to customize more aspects per locale such as a human-friendly label and if the locale is RTL or not.

This means that certain functions now return a different shape, such as `useLocale`. This hook used to return a string of the locale code you are currently editing, but it now returns an object with type of `Locale`.

### ⚠️ Admin panel CSS classes may have changed

The revisions we've made in 2.0 required changes to both HTML and CSS within the admin panel. For this reason, if you were loading custom CSS into the admin panel to customize the look and feel, your stylesheets may need to be updated. If your CSS is targeting elements on the page using HTML selectors or class names, you may need to update these selectors based on the current markup. It may also be necessary to update your style definitions if the core Payload component you are targeting has undergone significant change.

In many cases, our classnames and structure have remained the same, but technically, this could be a breaking change.

### ⚠️ Custom admin views API has changed

These changes only affect apps that are using custom views via the `admin.components.routes` config.

The type `AdminRoute` was renamed to `AdminViewConfig`. Simply update your instances with this new type and it will continue to work as expected. The properties of this type have not changed.

The `admin.components.routes` config has been merged with `admin.components.views`. Simply move your custom views to the `views` object. The properties of the config have not changed. Here is an example:

Previous:

```ts
admin: {
  components: {
    routes: [
      {
        Component: MyCustomView,
        path: "/custom-view",
      },
    ];
  }
}
```

Current:

```ts
admin: {
  components: {
    views: {
      MyCustomView: {
        Component: MyCustomView,
        path: '/custom-view'
      }
    }]
  }
}
```

### ⚠️ Rich text admin properties have moved

If you have customized the Slate rich text editor via `admin.elements` or `admin.leaves` properties, you now need to add your customizations to a `slateEditor({ admin: {} })` property. The signatures are all the same, but you might have to move some properties around.

Previous:

```ts
const myRichTextField: Field = {
  name: "content",
  type: "richText",
  admin: {
    elements: [
      "h1",
      "link",
      // etc
    ],
  },
};
```

Current:

```ts
import { slateEditor } from "@payloadcms/richtext-slate";

const myRichTextField: Field = {
  name: "content",
  type: "richText",
  editor: slateEditor({
    // Move the admin property as shown below
    admin: {
      elements: [
        "h1",
        "link",
        // etc
      ],
    },
  }),
};
```

### ⚠️ MongoDB connection options have been removed from `payload.init`

To pass connection options for MongoDB, you now need to pass them to `db: mongooseAdapter({})` instead of passing them to `payload.init()`.

### ⚠️ Some types have changed locations

If you are importing types from Payload, some of their locations may have changed. An example would be Slate-specific types being no longer exported from Payload itself—they are now exported from the `@payloadcms/richtext-slate` package.

### Recap

That's it! Most of these changes will be instantly apparent to you thanks to TypeScript, and many may not apply to you at all. But this list should be comprehensive and we will do our best to keep everything up-to-date here accordingly. There are inevitably some types that have changed locations, and similar things like that, but overall, you should be able to swing the breaking changes and get updated.

If you need a hand, reach out on Discord and we will hook you up!

## [1.14.0](https://github.com/payloadcms/payload/compare/v1.13.4...v1.14.0) (2023-08-16)

### Bug Fixes

- DatePicker showing only selected day by default ([#3169](https://github.com/payloadcms/payload/issues/3169)) ([edcb393](https://github.com/payloadcms/payload/commit/edcb3933cfb4532180c822135ea6a8be928e0fdc))
- only allow redirects to /admin sub-routes ([c0f05a1](https://github.com/payloadcms/payload/commit/c0f05a1c38fb9c958de920fabb698b5ecfb661f0))
- passes in height to resizeOptions upload option to allow height resize ([#3171](https://github.com/payloadcms/payload/issues/3171)) ([7963d04](https://github.com/payloadcms/payload/commit/7963d04a27888eb5a12d0ab37f2082cd33638abd))
- WhereBuilder component does not accept all valid Where queries ([#3087](https://github.com/payloadcms/payload/issues/3087)) ([fdfdfc8](https://github.com/payloadcms/payload/commit/fdfdfc83f36a958971f8e4e4f9f5e51560cb26e0))

### Features

- add afterOperation hook ([#2697](https://github.com/payloadcms/payload/issues/2697)) ([33686c6](https://github.com/payloadcms/payload/commit/33686c6db8373a16d7f6b0192e0701bf15881aa4))
- add support for hotkeys ([#1821](https://github.com/payloadcms/payload/issues/1821)) ([942cfec](https://github.com/payloadcms/payload/commit/942cfec286ff050e13417b037cca64b9d757d868))
- Added Azerbaijani language file ([#3164](https://github.com/payloadcms/payload/issues/3164)) ([63e3063](https://github.com/payloadcms/payload/commit/63e3063b9ecc1afd62d7a287a798d41215008f2a))
- allow async relationship filter options ([#2951](https://github.com/payloadcms/payload/issues/2951)) ([bad3638](https://github.com/payloadcms/payload/commit/bad363882c9d00d3c73547ca3329eba988e728ff))
- Improve admin dashboard accessibility ([#3053](https://github.com/payloadcms/payload/issues/3053)) ([e03a8e6](https://github.com/payloadcms/payload/commit/e03a8e6b030e82a17e1cdae5b4032433cf9c75a4))
- improve field ops ([#3172](https://github.com/payloadcms/payload/issues/3172)) ([d91b44c](https://github.com/payloadcms/payload/commit/d91b44cbb3fd526caca2a6f4bd30fd06ede3a5da))
- make PAYLOAD_CONFIG_PATH optional ([#2839](https://github.com/payloadcms/payload/issues/2839)) ([5744de7](https://github.com/payloadcms/payload/commit/5744de7ec63e3f17df7e02a7cc827818a79dbbb8))
- text alignment for richtext editor ([#2803](https://github.com/payloadcms/payload/issues/2803)) ([a0b13a5](https://github.com/payloadcms/payload/commit/a0b13a5b01fa0d7f4c4dffd1895bfe507e5c676d))

## [1.13.4](https://github.com/payloadcms/payload/compare/v1.13.3...v1.13.4) (2023-08-11)

### Bug Fixes

- correctly passes block path inside buildFieldSchemaMap ([#3162](https://github.com/payloadcms/payload/issues/3162)) ([3c60abd](https://github.com/payloadcms/payload/commit/3c60abd61aaf24d49712c80bcbd0f1113c22b85a))

## [1.13.3](https://github.com/payloadcms/payload/compare/v1.13.2...v1.13.3) (2023-08-11)

### Bug Fixes

- unable to add arrays inside secondary named tabs ([#3158](https://github.com/payloadcms/payload/issues/3158)) ([cb04d4a](https://github.com/payloadcms/payload/commit/cb04d4a82a68a764330582b93882d422b32c2527))

## [1.13.2](https://github.com/payloadcms/payload/compare/v1.13.1...v1.13.2) (2023-08-10)

## [1.13.1](https://github.com/payloadcms/payload/compare/v1.13.0...v1.13.1) (2023-08-08)

### Bug Fixes

- updates addFieldRow and replaceFieldRow rowIndex insertion ([#3145](https://github.com/payloadcms/payload/issues/3145)) ([f5cf546](https://github.com/payloadcms/payload/commit/f5cf546e1918de66998d5f0e5410bfbc1f054567))

# [1.13.0](https://github.com/payloadcms/payload/compare/v1.12.0...v1.13.0) (2023-08-08)

### Bug Fixes

- `setPreference()` return type ([#3125](https://github.com/payloadcms/payload/issues/3125)) ([463d6bb](https://github.com/payloadcms/payload/commit/463d6bbec66e61523bae3869df88bd98e7617390))
- absolute staticURL admin thumbnails ([#3135](https://github.com/payloadcms/payload/issues/3135)) ([1039f39](https://github.com/payloadcms/payload/commit/1039f39c09260537616b22228080466e8df6e981))
- adding and replacing similarly shaped block configs ([#3140](https://github.com/payloadcms/payload/issues/3140)) ([8e188cf](https://github.com/payloadcms/payload/commit/8e188cfe61db808c94d726967affdadf2e5abb9f))

### Features

- default tab labels from name ([#3129](https://github.com/payloadcms/payload/issues/3129)) ([e8f0516](https://github.com/payloadcms/payload/commit/e8f05165eb3a28c00deb11931db01ad1f8c75c74))
- radio and select fields are filterable by options ([#3136](https://github.com/payloadcms/payload/issues/3136)) ([b117e73](https://github.com/payloadcms/payload/commit/b117e7346434bfc8edbfa92f5db45f63c57bab08))
- recursive saveToJWT field support ([#3130](https://github.com/payloadcms/payload/issues/3130)) ([c6e0908](https://github.com/payloadcms/payload/commit/c6e09080767dad2ab8128ba330b2b344bb25ac6f))

# [1.12.0](https://github.com/payloadcms/payload/compare/v1.11.8...v1.12.0) (2023-08-04)

### Bug Fixes

- excludes useAsTitle field from searchableFields in collection view ([#3105](https://github.com/payloadcms/payload/issues/3105)) ([8c4d251](https://github.com/payloadcms/payload/commit/8c4d2514b0f195e0059c6063346199785979c70c))
- relationship field filter long titles ([#3113](https://github.com/payloadcms/payload/issues/3113)) ([da27a8a](https://github.com/payloadcms/payload/commit/da27a8aadbb103c5f6fe0ccc62c032876851b88f))
- wrong links in verification and forgot password emails if serverURL not set ([#3010](https://github.com/payloadcms/payload/issues/3010)) ([6a189c6](https://github.com/payloadcms/payload/commit/6a189c6548b233aba64598af8804a56ec47e45f0))

### Features

- add support for sharp resize options ([#2844](https://github.com/payloadcms/payload/issues/2844)) ([144bb81](https://github.com/payloadcms/payload/commit/144bb81721814c19eb4957d4c8fcc845c73e2aa4))
- allows for upload relationship drawer to be opened ([#3108](https://github.com/payloadcms/payload/issues/3108)) ([ea73e68](https://github.com/payloadcms/payload/commit/ea73e689ac46f2a7ba3b6c34e7a190944b5d5868))
- option to pre-fill login credentials automatically ([#3021](https://github.com/payloadcms/payload/issues/3021)) ([c5756ed](https://github.com/payloadcms/payload/commit/c5756ed4a13b46bc73ae7b23309d6e9980fc81bf))
- programmatic control over array and block rows inside the form ([#3110](https://github.com/payloadcms/payload/issues/3110)) ([a78c463](https://github.com/payloadcms/payload/commit/a78c4631b4aabb5b57448ab21ef98749b1cf1935))
- set JWT token field name with saveToJWT ([#3126](https://github.com/payloadcms/payload/issues/3126)) ([356f174](https://github.com/payloadcms/payload/commit/356f174b9ff601facb0062d0b65db18803ef2aa2))

## [1.11.8](https://github.com/payloadcms/payload/compare/v1.11.7...v1.11.8) (2023-07-31)

## [1.11.7](https://github.com/payloadcms/payload/compare/v1.11.6...v1.11.7) (2023-07-27)

### Bug Fixes

- [#3062](https://github.com/payloadcms/payload/issues/3062) ([0280953](https://github.com/payloadcms/payload/commit/02809532b484d9018c6528cfbbbb43abfd55a540))
- array row deletion ([#3062](https://github.com/payloadcms/payload/issues/3062)) ([cf9795b](https://github.com/payloadcms/payload/commit/cf9795b8d8b53c48335ff4c32c6c51b3de4f7bc9))
- incorrect image rotation after being processed by sharp ([#3081](https://github.com/payloadcms/payload/issues/3081)) ([0a91950](https://github.com/payloadcms/payload/commit/0a91950f052ce40427801e6561a0f676354a2ca4))

### Features

- ability to add context to payload's request object ([#2796](https://github.com/payloadcms/payload/issues/2796)) ([67ba131](https://github.com/payloadcms/payload/commit/67ba131cc61f3d3b30ef9ef7fc150344ca82da2f))

## [1.11.6](https://github.com/payloadcms/payload/compare/v1.11.5...v1.11.6) (2023-07-25)

### Bug Fixes

- **collections:admin:** Enable adminThumbnail fn execution on all types ([2c74e93](https://github.com/payloadcms/payload/commit/2c74e9396a216a033e2bacdf189b7f28a0f97505))
- threads hasMaxRows into ArrayAction components within blocks and arrays ([#3066](https://github.com/payloadcms/payload/issues/3066)) ([d43c83d](https://github.com/payloadcms/payload/commit/d43c83dad1bab5b05f4fcbae7d41de369905797c))

## [1.11.5](https://github.com/payloadcms/payload/compare/v1.11.4...v1.11.5) (2023-07-25)

### Bug Fixes

- admin route not mounting on production serve ([#3071](https://github.com/payloadcms/payload/issues/3071)) ([e718668](https://github.com/payloadcms/payload/commit/e71866856fffefcfb61dd3d29135cccb66939a62))

## [1.11.4](https://github.com/payloadcms/payload/compare/v1.11.3...v1.11.4) (2023-07-25)

### Bug Fixes

- if arrayFieldType rows are undefined, page would crash ([#3049](https://github.com/payloadcms/payload/issues/3049)) ([08377cc](https://github.com/payloadcms/payload/commit/08377cc5a7ea9d02350177e2e1d69390ee97af78))

### Features

- bump mongoose and mongoose-paginate versions ([#3025](https://github.com/payloadcms/payload/issues/3025)) ([41d3eee](https://github.com/payloadcms/payload/commit/41d3eee35f3855798a5c3372f8ad7c742a7810f7))
- improve keyboard focus styles ([#3011](https://github.com/payloadcms/payload/issues/3011)) ([080e619](https://github.com/payloadcms/payload/commit/080e6195ef39ec858fbb115e8f554a8dfc436438))
- solidifies bundler adapter pattern ([#3044](https://github.com/payloadcms/payload/issues/3044)) ([641c765](https://github.com/payloadcms/payload/commit/641c765fb921e162c98f09218929348037dd0f88))

## [1.11.3](https://github.com/payloadcms/payload/compare/v1.11.2...v1.11.3) (2023-07-19)

### Bug Fixes

- adds backdrop blur to button ([#3006](https://github.com/payloadcms/payload/issues/3006)) ([4233426](https://github.com/payloadcms/payload/commit/42334263bbc6219be92c5728f1a4ac6c8d2d1306))
- rich text link element not validating on create ([#3014](https://github.com/payloadcms/payload/issues/3014)) ([60fca40](https://github.com/payloadcms/payload/commit/60fca40780d4ddd8e684a455de55c566ec91e223))

### Features

- auto-login in config capability ([#3009](https://github.com/payloadcms/payload/issues/3009)) ([733fc0b](https://github.com/payloadcms/payload/commit/733fc0b2d0cf0f2d58c8a28e84776f883774b0e0))
- returns queried user alongside refreshed token ([#2813](https://github.com/payloadcms/payload/issues/2813)) ([2fc03f1](https://github.com/payloadcms/payload/commit/2fc03f196e4e5fa0ad3369ec976c0b6889ebda88))
- support logger destination ([#2896](https://github.com/payloadcms/payload/issues/2896)) ([cd0bf68](https://github.com/payloadcms/payload/commit/cd0bf68a6150b1adbdb9ee318ac0a06c4476aa4d))

## [1.11.2](https://github.com/payloadcms/payload/compare/v1.11.1...v1.11.2) (2023-07-14)

### Features

- adds array, collapsible, tab and group error states ([4925f90](https://github.com/payloadcms/payload/commit/4925f90b5f5c8fb8092bf4e8d88d5e0c1846b094))

## [1.11.1](https://github.com/payloadcms/payload/compare/v1.11.0...v1.11.1) (2023-07-11)

### Bug Fixes

- [#2980](https://github.com/payloadcms/payload/issues/2980), locale=all was not iterating through arrays / blocks ([d6bfba7](https://github.com/payloadcms/payload/commit/d6bfba72a6b1a84bc5bb9dd14c7ce31d7afcbc1c))
- anchor Button component respect margins ([#2648](https://github.com/payloadcms/payload/issues/2648)) ([1877d22](https://github.com/payloadcms/payload/commit/1877d2247c89ca5c8e1f0e1f989154d54768fed8))

# [1.11.0](https://github.com/payloadcms/payload/compare/v1.10.5...v1.11.0) (2023-07-05)

### Bug Fixes

- ensures fields within blocks respect field level access control ([#2969](https://github.com/payloadcms/payload/issues/2969)) ([5b79067](https://github.com/payloadcms/payload/commit/5b79067cc14874abbd1e1a5b6e619d41571b187f))
- ensures rows always have id's ([#2968](https://github.com/payloadcms/payload/issues/2968)) ([04851d0](https://github.com/payloadcms/payload/commit/04851d0dc99e4a3df0a1ac642e9a4b9a3c06d8a1))
- GraphQL type for number field ([#2954](https://github.com/payloadcms/payload/issues/2954)) ([29d8bf0](https://github.com/payloadcms/payload/commit/29d8bf0927038d2305218e5a6b811e0c4039d617))
- nested richtext bug and test ([#2966](https://github.com/payloadcms/payload/issues/2966)) ([801f609](https://github.com/payloadcms/payload/commit/801f60939b1bb4e33fbabe1f9a3c4a04a47912db))
- properly threads custom react-select props through relationship field ([#2973](https://github.com/payloadcms/payload/issues/2973)) ([79393e8](https://github.com/payloadcms/payload/commit/79393e8cf0b79b31fa711536e0bc22b1a251468a))

### Features

- improve typing of ExtendableError and APIError ([#2864](https://github.com/payloadcms/payload/issues/2864)) ([7c47e4b](https://github.com/payloadcms/payload/commit/7c47e4b0d3c63f6f7800daaf424935d6067ffcc4))
- narrow endpoint.method type ([#1880](https://github.com/payloadcms/payload/issues/1880)) ([b734a1c](https://github.com/payloadcms/payload/commit/b734a1c422d200cad1085b7e92f8540df4238e32))

## [1.10.5](https://github.com/payloadcms/payload/compare/v1.10.4...v1.10.5) (2023-06-30)

### Bug Fixes

- fields in drawer cannot be edited ([#2949](https://github.com/payloadcms/payload/issues/2949)) ([0c2e41c](https://github.com/payloadcms/payload/commit/0c2e41c4bef9333c47a9b1db0de807696b3f3872)), closes [#2945](https://github.com/payloadcms/payload/issues/2945)
- improve versions test suite ([#2941](https://github.com/payloadcms/payload/issues/2941)) ([1d4df99](https://github.com/payloadcms/payload/commit/1d4df99ea78c5f682074ae824dcd8dea18b774e0))
- incorrect graphql type generation ([#2898](https://github.com/payloadcms/payload/issues/2898)) ([b36deb4](https://github.com/payloadcms/payload/commit/b36deb4640cad4f494a12ab74b4e4d9a918cd94b))

## [1.10.4](https://github.com/payloadcms/payload/compare/v1.10.3...v1.10.4) (2023-06-30)

### Features

- add locale to displayed API URL ([b22d157](https://github.com/payloadcms/payload/commit/b22d157bd2f1c1a857e2d42bdc5b893549e3db9e))

## [1.10.3](https://github.com/payloadcms/payload/compare/v1.10.2...v1.10.3) (2023-06-30)

### Bug Fixes

- [#2937](https://github.com/payloadcms/payload/issues/2937), depth not being respected in graphql rich text fields ([f84b432](https://github.com/payloadcms/payload/commit/f84b4323e2fce57e2e14b181e486ed72cc09ded5))
- shows updatedAt date when selecting a version to compare from dropdown ([3c9dab3](https://github.com/payloadcms/payload/commit/3c9dab3b9d5302d8bdf5792f0384cd5aeeb13839))

## [1.10.2](https://github.com/payloadcms/payload/compare/v1.10.1...v1.10.2) (2023-06-26)

### Bug Fixes

- adjusts swc loader to only exclude non ts/tsx files - [#2888](https://github.com/payloadcms/payload/issues/2888) ([#2907](https://github.com/payloadcms/payload/issues/2907)) ([a2d9ef3](https://github.com/payloadcms/payload/commit/a2d9ef3ca618934df58102a7e02e86dbe0ed63da))
- autosave on localized fields, adds test ([6893231](https://github.com/payloadcms/payload/commit/6893231f85f702189089a6d78d3f3af63aaa0d82))
- broken export of entityToJSONSchema ([#2894](https://github.com/payloadcms/payload/issues/2894)) ([837dccc](https://github.com/payloadcms/payload/commit/837dcccefeffe7bb6e674713b4184c4eb92db8dc))
- correctly scopes data variable within bulk update - [#2901](https://github.com/payloadcms/payload/issues/2901) ([#2904](https://github.com/payloadcms/payload/issues/2904)) ([f627277](https://github.com/payloadcms/payload/commit/f627277479e6a4a847e79f54c545712a7186abb9))
- safely check for tempFilePath when updating media document ([#2899](https://github.com/payloadcms/payload/issues/2899)) ([8206c0f](https://github.com/payloadcms/payload/commit/8206c0fe8be78a5e0f7c8e64996d73d135b1fcc2))

## [1.10.1](https://github.com/payloadcms/payload/compare/v1.10.0...v1.10.1) (2023-06-22)

### Bug Fixes

- conditional fields perf bug - [#2886](https://github.com/payloadcms/payload/issues/2886) ([#2890](https://github.com/payloadcms/payload/issues/2890)) ([b83d788](https://github.com/payloadcms/payload/commit/b83d788d3cfe12f87dcd63a9df20b939a6f4681e))
- cutoff tooltips in relationship field ([#2873](https://github.com/payloadcms/payload/issues/2873)) ([09c6cad](https://github.com/payloadcms/payload/commit/09c6cad3e8462dc3d8b1b6424aafd336c1d7828c))
- Relationship hasMany and filterOptions fails above 10 items ([#2891](https://github.com/payloadcms/payload/issues/2891)) ([8128de6](https://github.com/payloadcms/payload/commit/8128de64dff98fdbcf053faef9de3c3f9a733071))

# [1.10.0](https://github.com/payloadcms/payload/compare/v1.9.5...v1.10.0) (2023-06-20)

### Bug Fixes

- [#2831](https://github.com/payloadcms/payload/issues/2831), persists payloadAPI through local operations that accept req ([85d2467](https://github.com/payloadcms/payload/commit/85d2467d73582a372ee34e3ce93403847a1f0689))
- [#2842](https://github.com/payloadcms/payload/issues/2842), querying number custom ids with in ([116e9ff](https://github.com/payloadcms/payload/commit/116e9ffe81f44c4b40fa578b4a8fe4bb70fd110c))
- default sort with near operator ([#2862](https://github.com/payloadcms/payload/issues/2862)) ([99f3809](https://github.com/payloadcms/payload/commit/99f38098dd4a386437c469becc975ca86c54601f))
- deprecate min/max in exchange for minRows and maxRows for relationship field ([#2826](https://github.com/payloadcms/payload/issues/2826)) ([0d8d7f3](https://github.com/payloadcms/payload/commit/0d8d7f358d390184f6f888d77858b4a145e94214))
- drawer close on backspace ([#2869](https://github.com/payloadcms/payload/issues/2869)) ([a110ba2](https://github.com/payloadcms/payload/commit/a110ba2dc09cd0824a9b1eb8e011604388277bd8))
- drawer fields are read-only if opened from a hasMany relationship ([#2843](https://github.com/payloadcms/payload/issues/2843)) ([542b536](https://github.com/payloadcms/payload/commit/542b5362d3ec8741aff6b1672fab7d2250e7b854))
- fields in relationship drawer not usable [#2815](https://github.com/payloadcms/payload/issues/2815) ([#2870](https://github.com/payloadcms/payload/issues/2870)) ([8626dc6](https://github.com/payloadcms/payload/commit/8626dc6b1a926143e7ba505f3edd924432168675))
- mobile loading overlay width [#2866](https://github.com/payloadcms/payload/issues/2866) ([#2867](https://github.com/payloadcms/payload/issues/2867)) ([ba9d633](https://github.com/payloadcms/payload/commit/ba9d6336acc779cfec0db312c8e2da912ce58cd4))
- near query sorting by distance and pagination ([#2861](https://github.com/payloadcms/payload/issues/2861)) ([1611896](https://github.com/payloadcms/payload/commit/16118960aa6d63f7a429f168ff4305f336b1b1e6))
- relationship field query pagination ([#2871](https://github.com/payloadcms/payload/issues/2871)) ([ce84174](https://github.com/payloadcms/payload/commit/ce84174554d9d828cbaaaa9548e5defc0feb4e2b))
- slow like queries with lots of records ([4dd703a](https://github.com/payloadcms/payload/commit/4dd703a6bff0ab7d06af234baa975553bd62f176))

### Features

- automatically redirect a user back to their originally requested URL after login ([#2838](https://github.com/payloadcms/payload/issues/2838)) ([e910688](https://github.com/payloadcms/payload/commit/e9106882f721d43bcc05a1690bda7754b450404e))
- hasMany for number field ([#2517](https://github.com/payloadcms/payload/issues/2517)) ([8f086e3](https://github.com/payloadcms/payload/commit/8f086e315cb30be9d399fd3022c16952fb81cb2e)), closes [#2812](https://github.com/payloadcms/payload/issues/2812) [#2821](https://github.com/payloadcms/payload/issues/2821) [#2823](https://github.com/payloadcms/payload/issues/2823) [#2824](https://github.com/payloadcms/payload/issues/2824) [#2814](https://github.com/payloadcms/payload/issues/2814) [#2793](https://github.com/payloadcms/payload/issues/2793) [#2835](https://github.com/payloadcms/payload/issues/2835)
- optimizes conditional logic performance ([967f217](https://github.com/payloadcms/payload/commit/967f21734600de1fec8c1227a354ef5a417e54c5))

## [1.9.5](https://github.com/payloadcms/payload/compare/v1.9.4...v1.9.5) (2023-06-16)

## [1.9.4](https://github.com/payloadcms/payload/compare/v1.9.3...v1.9.4) (2023-06-16)

### Bug Fixes

- incorrectly return totalDocs=1 instead of the correct count when pagination=false ([2e73938](https://github.com/payloadcms/payload/commit/2e7393853447d2da41ddef79f73e9026719a674b))

## [1.9.3](https://github.com/payloadcms/payload/compare/v1.9.2...v1.9.3) (2023-06-16)

### Bug Fixes

- adds custom property to ui field in joi validation ([#2835](https://github.com/payloadcms/payload/issues/2835)) ([56d7745](https://github.com/payloadcms/payload/commit/56d7745139e31c5d42c5191477f409f12589a952))
- ensures relations to object ids can be queried on ([c3d6e1b](https://github.com/payloadcms/payload/commit/c3d6e1b490a69f0aadb00e54e46a8774732e6658))

## [1.9.2](https://github.com/payloadcms/payload/compare/v1.9.1...v1.9.2) (2023-06-14)

### Bug Fixes

- [#2821](https://github.com/payloadcms/payload/issues/2821) i18n ui field label ([#2823](https://github.com/payloadcms/payload/issues/2823)) ([63cd7fb](https://github.com/payloadcms/payload/commit/63cd7fbd0c91bbf5120e95fd33388a38e593b341))
- adds missing dark-mode styles for version differences view ([#2812](https://github.com/payloadcms/payload/issues/2812)) ([346a48f](https://github.com/payloadcms/payload/commit/346a48f871e09a3d5e25b7ff9e45689a104b0f9f))
- sanitize reset password result - [#2805](https://github.com/payloadcms/payload/issues/2805) ([#2808](https://github.com/payloadcms/payload/issues/2808)) ([46a5f41](https://github.com/payloadcms/payload/commit/46a5f417217313b049f4b412abb3319634f27262))
- user can be created without having to specify an email - [#2801](https://github.com/payloadcms/payload/issues/2801) ([abe3852](https://github.com/payloadcms/payload/commit/abe38520aaaefdfaea4c47130eea04a42a82627b))

## [1.9.1](https://github.com/payloadcms/payload/compare/v1.9.0...v1.9.1) (2023-06-09)

### Features

- adds option to customize filename on upload ([596eea1](https://github.com/payloadcms/payload/commit/596eea1f0a42628464e5269c496360b808c35f97))
- collection list view custom components: BeforeList, BeforeListTable, AfterListTable, AfterList ([#2792](https://github.com/payloadcms/payload/issues/2792)) ([38e962f](https://github.com/payloadcms/payload/commit/38e962f2cbcaf9eaa72276969289efdbf670c7c7))

# [1.9.0](https://github.com/payloadcms/payload/compare/v1.8.6...v1.9.0) (2023-06-07)

### Features

- custom type interfaces ([#2709](https://github.com/payloadcms/payload/issues/2709)) ([8458a98](https://github.com/payloadcms/payload/commit/8458a98eff0eedf1abfd9ec065a084955a9b8149))

## [1.8.6](https://github.com/payloadcms/payload/compare/v1.8.5...v1.8.6) (2023-06-07)

### Bug Fixes

- [#2711](https://github.com/payloadcms/payload/issues/2711) index sortable field global versions fields ([#2775](https://github.com/payloadcms/payload/issues/2775)) ([576af01](https://github.com/payloadcms/payload/commit/576af01b6f81d24621d522e8d8b9c496eafa6df0))
- [#2767](https://github.com/payloadcms/payload/issues/2767) bulk operations missing locales in admin requests ([e30871a](https://github.com/payloadcms/payload/commit/e30871a96ff25f12401a3cc3bc5e12c064eeff3f))
- [#2771](https://github.com/payloadcms/payload/issues/2771) relationship field not querying all collections ([#2774](https://github.com/payloadcms/payload/issues/2774)) ([8b767a1](https://github.com/payloadcms/payload/commit/8b767a166aa16659d8880cc68da546251725b20b))
- adjusts activation constraint of draggable nodes ([#2773](https://github.com/payloadcms/payload/issues/2773)) ([863be3d](https://github.com/payloadcms/payload/commit/863be3d852af6c6a76021695f895badf23e776ae))
- flattens relationships in the update operation for globals [#2766](https://github.com/payloadcms/payload/issues/2766) ([#2776](https://github.com/payloadcms/payload/issues/2776)) ([3677cf6](https://github.com/payloadcms/payload/commit/3677cf688d0e456c42068b4eab0086e64407d938))
- improperly typing optional arrays with required fields as required ([f1fc305](https://github.com/payloadcms/payload/commit/f1fc305ac443ecb247622bc89067b129e96146fc))
- read-only Auth fields ([#2781](https://github.com/payloadcms/payload/issues/2781)) ([3c72f33](https://github.com/payloadcms/payload/commit/3c72f3303c57e88256266c343225157e0b081bba))
- read-only Auth fields ([#2781](https://github.com/payloadcms/payload/issues/2781)) ([60f5522](https://github.com/payloadcms/payload/commit/60f5522e67acb353e6d5ce05f0012241c192d4b4))
- recursiveNestedPaths not merging existing fields when hoisting row/collapsible fields ([#2769](https://github.com/payloadcms/payload/issues/2769)) ([536d701](https://github.com/payloadcms/payload/commit/536d7017eebd5a8e14b2936c55a7fccc90d3f530))

## [1.8.5](https://github.com/payloadcms/payload/compare/v1.8.4...v1.8.5) (2023-06-03)

### Features

- allows objectid through relationship validation ([42afa6b](https://github.com/payloadcms/payload/commit/42afa6b48aa924fa0dfc9defadf08ddb029da6c1))

## [1.8.4](https://github.com/payloadcms/payload/compare/v1.8.3...v1.8.4) (2023-06-02)

### Features

- Add Bulgarian translation ([#2753](https://github.com/payloadcms/payload/issues/2753)) ([51108c0](https://github.com/payloadcms/payload/commit/51108c02ea346fd41c1b94ef7c339feec8383dd1))

### Bug Fixes

- group row hoisting ([#2683](https://github.com/payloadcms/payload/issues/2683)) ([1626e17](https://github.com/payloadcms/payload/commit/1626e173b7eced83c59e8eb4f70b0bb68fdb0e7a))
- graphql where types on rows and collapsible's ([#2758](https://github.com/payloadcms/payload/issues/2758)) ([f978299](https://github.com/payloadcms/payload/commit/f978299868bf352e147070afdf556bf1153bac56))
- RichText link custom fields ([#2756](https://github.com/payloadcms/payload/issues/2756)) ([23be263](https://github.com/payloadcms/payload/commit/23be263dd2e75dca448019b1c66d7f6dd3558b37))
- adds timestamps to global schemas ([#2738](https://github.com/payloadcms/payload/issues/2738)) ([0986282](https://github.com/payloadcms/payload/commit/0986282f13d8a3b5596c4a241b4da35e6fac6aa1))
- adjusts code field joi schema to allow editorOptions ([ed136fb](https://github.com/payloadcms/payload/commit/ed136fbc5146889cd30c641d4947da58b66dfb2f))
- fix locale popup overflow ([#2737](https://github.com/payloadcms/payload/issues/2737)) ([8ee9724](https://github.com/payloadcms/payload/commit/8ee9724277d419de78b27a8ffa22f3a599361251))
- fix tests by hard-coding the URL in the logger ([2697974](https://github.com/payloadcms/payload/commit/2697974694112440bf1737c4ce535ba77bf4b194))
- mongoose connection ([#2754](https://github.com/payloadcms/payload/issues/2754)) ([69b97bb](https://github.com/payloadcms/payload/commit/69b97bbc590c62fffbcd03a42f0e9737e3f7ca01))
- removes payload dependency inception ([#2717](https://github.com/payloadcms/payload/issues/2717)) ([6125b66](https://github.com/payloadcms/payload/commit/6125b66286e5315725ca0ae365c81a04c1c1a54c))
- searches on correct useAsTitle field in polymorphic list drawers [#2710](https://github.com/payloadcms/payload/issues/2710) ([9ec2a40](https://github.com/payloadcms/payload/commit/9ec2a40274ea9b3a32e43cb992df3897baf62e63))
- typing of sendMail function ([e3ff4c4](https://github.com/payloadcms/payload/commit/e3ff4c46cbecf731c9a3c688682bcb33012cb234))
- corrects relationship field schema from pr [#2696](https://github.com/payloadcms/payload/issues/2696) ([#2714](https://github.com/payloadcms/payload/issues/2714)) ([8285bac](https://github.com/payloadcms/payload/commit/8285bac2f5eb443b6af160b21726edf3f828a52f))

## [1.8.3](https://github.com/payloadcms/payload/compare/v1.8.3...v1.8.3) (2023-05-24)

### Bug Fixes

- [#2662](https://github.com/payloadcms/payload/issues/2662), draft=true querying by id ([3b78ab0](https://github.com/payloadcms/payload/commit/3b78ab04c7a68e39afa9936ac692169ed2c8fb74))
- [#2685](https://github.com/payloadcms/payload/issues/2685), graphql querying relationships with custom id ([9bb5470](https://github.com/payloadcms/payload/commit/9bb54703423b3f0fdb242a5e63f322d346323b06))
- adds credentials to doc access request ([#2705](https://github.com/payloadcms/payload/issues/2705)) ([c716954](https://github.com/payloadcms/payload/commit/c716954e89b0aef976cbcbef9ece981ec9bab233))
- prevents add new relationship modal from adding duplicative values to the parent doc [#2688](https://github.com/payloadcms/payload/issues/2688) ([a2a8ac9](https://github.com/payloadcms/payload/commit/a2a8ac9549bd67e6ab578772689684fd2bc64872))
- unable to clear relationships or open relationship drawer on mobile [#2691](https://github.com/payloadcms/payload/issues/2691) [#2692](https://github.com/payloadcms/payload/issues/2692) ([782f8ca](https://github.com/payloadcms/payload/commit/782f8ca047178cadb4214702854a0e0cb2d9eaab))

## [1.8.2](https://github.com/payloadcms/payload/compare/v1.8.1...v1.8.2) (2023-05-10)

### Bug Fixes

- react webpack alias ([1732bb8](https://github.com/payloadcms/payload/commit/1732bb877ca9688fc87cf44fbf63d05b6be23de2))

## [1.8.1](https://github.com/payloadcms/payload/compare/v1.8.0...v1.8.1) (2023-05-10)

### Bug Fixes

- add dotenv.config() to test/dev.ts ([#2646](https://github.com/payloadcms/payload/issues/2646)) ([7963e75](https://github.com/payloadcms/payload/commit/7963e7540f4899c16a49b47cf5145f46ea0c71cf))

### Features

- allow users to manipulate images without needing to resize them ([#2574](https://github.com/payloadcms/payload/issues/2574)) ([8531687](https://github.com/payloadcms/payload/commit/85316879cd97933ed34588b0cee72798964de281))
- export additional graphql types ([#2610](https://github.com/payloadcms/payload/issues/2610)) ([3f185cb](https://github.com/payloadcms/payload/commit/3f185cb18b9677654b92921267ffef408388d0d1))

# [1.8.0](https://github.com/payloadcms/payload/compare/v1.7.5...v1.8.0) (2023-05-09)

### Bug Fixes

- correct casing on graphql type ([219f50b](https://github.com/payloadcms/payload/commit/219f50b0bc7a520655a5ae4f1d8b08fd04c8a3dd))
- defaultValue missing from Upload field schema ([7b21eaf](https://github.com/payloadcms/payload/commit/7b21eaf12da64778568b45e56fa8d39e81f11c29))
- ensures nested querying works when querying across collections ([09974fa](https://github.com/payloadcms/payload/commit/09974fa68677586c727943cc234311f87bf6da75))
- query custom text id fields ([967f2ac](https://github.com/payloadcms/payload/commit/967f2ace0ea1a65570f69e85920f2f55626efde0))
- removes deprecated queryHiddenFIelds from local API docs ([5f30dbb](https://github.com/payloadcms/payload/commit/5f30dbb1a5b7c7ab6752c114710f92c159319d3d))
- removes queryHiddenFields from example Find operation ([fb4f822](https://github.com/payloadcms/payload/commit/fb4f822d34d0235a537f96515073e2662680412f))
- resolve process/browser package in webpack config ([02f27f3](https://github.com/payloadcms/payload/commit/02f27f3de6fdaf5dd0023298fc671a8ae9a1b758))
- Row groups in tabs vertical alignment ([#2593](https://github.com/payloadcms/payload/issues/2593)) ([54fac4a](https://github.com/payloadcms/payload/commit/54fac4a5d793b534e25600d2f9470c449f40df1d))
- softens columns and filters pill colors ([#2642](https://github.com/payloadcms/payload/issues/2642)) ([9072096](https://github.com/payloadcms/payload/commit/90720964953d392d85982052b3a4843a5450681e))
- webp upload formatting ([ccd6ca2](https://github.com/payloadcms/payload/commit/ccd6ca298e69faf04709535df3fcb18eb3d40f1b))

### Features

- add Arabic translations ([#2641](https://github.com/payloadcms/payload/issues/2641)) ([7d04cf1](https://github.com/payloadcms/payload/commit/7d04cf14fb0587f2208745bb77ed4fd17e99c8d5))
- allow full URL in staticURL ([#2562](https://github.com/payloadcms/payload/issues/2562)) ([a9b5dff](https://github.com/payloadcms/payload/commit/a9b5dffa00623eb48302d51b88c3449920c10f46))

## [1.7.5](https://github.com/payloadcms/payload/compare/v1.7.4...v1.7.5) (2023-05-04)

### Bug Fixes

- make incrementName match multiple digits ([#2609](https://github.com/payloadcms/payload/issues/2609)) ([8dbf0a2](https://github.com/payloadcms/payload/commit/8dbf0a2bd88db1b361ce16bb730613de489f2ed2))

### Features

- collection admin.enableRichTextLink property ([#2560](https://github.com/payloadcms/payload/issues/2560)) ([9678992](https://github.com/payloadcms/payload/commit/967899229f458d06a3931d086bcc49299dc310b7))
- custom admin buttons ([#2618](https://github.com/payloadcms/payload/issues/2618)) ([1d58007](https://github.com/payloadcms/payload/commit/1d58007606fa7e34007f2a56a3ca653d2cd3404d))

## [1.7.4](https://github.com/payloadcms/payload/compare/v1.7.3...v1.7.4) (2023-05-02)

### Bug Fixes

- properly import SwcMinifyWebpackPlugin ([#2600](https://github.com/payloadcms/payload/issues/2600)) ([802deac](https://github.com/payloadcms/payload/commit/802deaca03f8506fa4a7adb8fc008205c2c4f013))

## [1.7.3](https://github.com/payloadcms/payload/compare/v1.7.2...v1.7.3) (2023-05-01)

### Bug Fixes

- [#2592](https://github.com/payloadcms/payload/issues/2592), allows usage of hidden fields within access query constraints ([#2599](https://github.com/payloadcms/payload/issues/2599)) ([a0bb13a](https://github.com/payloadcms/payload/commit/a0bb13a4123b51d770b364ddaee3dde1c5a3da53))
- addds workaround for slate isBlock function issue ([#2596](https://github.com/payloadcms/payload/issues/2596)) ([8f6f13d](https://github.com/payloadcms/payload/commit/8f6f13dc93f49f5ba5384a9168ced5baec85e1fb))
- bulk operations result type ([#2588](https://github.com/payloadcms/payload/issues/2588)) ([8382faa](https://github.com/payloadcms/payload/commit/8382faa0afc8118f4fb873c657a52c48abb2a6ad))
- query on id throws 500 ([#2587](https://github.com/payloadcms/payload/issues/2587)) ([0ba22c3](https://github.com/payloadcms/payload/commit/0ba22c3aafca67be78814357edc668ed11ec4a97))
- timestamp queries ([#2583](https://github.com/payloadcms/payload/issues/2583)) ([9c5107e](https://github.com/payloadcms/payload/commit/9c5107e86d70e36ac181c9d3ad51edacf9fc529a))

### Features

- Add new translation for romanian language ([#2556](https://github.com/payloadcms/payload/issues/2556)) ([fbf3a2a](https://github.com/payloadcms/payload/commit/fbf3a2a1b4633e704e467d9aec05f3ae0b900bae))
- add persian translations ([#2553](https://github.com/payloadcms/payload/issues/2553)) ([c80f68a](https://github.com/payloadcms/payload/commit/c80f68af943c730996c9cdad87cf84d4d06a5777))
- adjust stack trace for api error ([#2598](https://github.com/payloadcms/payload/issues/2598)) ([870838e](https://github.com/payloadcms/payload/commit/870838e7563b6767c53f4dc0288119087e3f9486))
- allow customizing the link fields ([#2559](https://github.com/payloadcms/payload/issues/2559)) ([bf65228](https://github.com/payloadcms/payload/commit/bf6522898db353e75db11525ea5a1b58243333d8))
- supports collection compound indexes ([#2529](https://github.com/payloadcms/payload/issues/2529)) ([85b3d57](https://github.com/payloadcms/payload/commit/85b3d579d3054aad2de793957cf6454332361327))

## [1.7.2](https://github.com/payloadcms/payload/compare/v1.7.1...v1.7.2) (2023-04-25)

### Bug Fixes

- [#2521](https://github.com/payloadcms/payload/issues/2521), graphql AND not working with drafts ([e67ca20](https://github.com/payloadcms/payload/commit/e67ca2010831c14938d3f639fcb5374ca62747ba))
- document drawer access control [#2545](https://github.com/payloadcms/payload/issues/2545) ([439caf8](https://github.com/payloadcms/payload/commit/439caf815fc99538f14b3a59835dcf49185759dc))
- prevent floating point number in image sizes ([#1935](https://github.com/payloadcms/payload/issues/1935)) ([7fcde11](https://github.com/payloadcms/payload/commit/7fcde11fa0b232537de606e44c0af68b122daed2))
- prevent sharp toFormat settings fallthrough by using clone ([#2547](https://github.com/payloadcms/payload/issues/2547)) ([90dab3c](https://github.com/payloadcms/payload/commit/90dab3c445d4bdbab0eff286a2b66861d04f2a93))
- query localized fields without localization configured ([12edb1c](https://github.com/payloadcms/payload/commit/12edb1cc4b2675d9b0948fb7f3439f61c6e2015d))
- read-only styles ([823d022](https://github.com/payloadcms/payload/commit/823d0228c949fe58a7e0f11f95354b240c3ea876))

### Features

- add rich-text blockquote element, change quote node type to blockquote ([ed230a4](https://github.com/payloadcms/payload/commit/ed230a42e0315dc2492b4a26e3bf8b5334e89380))
- add user to field conditional logic ([274edc7](https://github.com/payloadcms/payload/commit/274edc74a70202e8c771c5111507b585c3f69377))
- exposes id in conditional logic ([c117b32](https://github.com/payloadcms/payload/commit/c117b321474b8318c3a0ddf544e49568e461f0d8))
- **imageresizer:** add trim options ([#2073](https://github.com/payloadcms/payload/issues/2073)) ([0406548](https://github.com/payloadcms/payload/commit/0406548fe6127e091db9926ee42e59f9158eff5a))

## [1.7.1](https://github.com/payloadcms/payload/compare/v1.7.0...v1.7.1) (2023-04-18)

### Bug Fixes

- adds 'use client' for next 13 compatibility ([5e02985](https://github.com/payloadcms/payload/commit/5e029852060d6475eccada35ffbcdd0178d5e690))
- graphql variables not being passed properly ([72be80a](https://github.com/payloadcms/payload/commit/72be80abc4082013e052aef1152a5de749a6f3c4))

### Features

- configuration extension points ([023719d](https://github.com/payloadcms/payload/commit/023719d77554a70493d779ba94bf55058d4caf98))

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
const express = require('express')
const payload = require('payload')

const app = express()

payload.init({
  secret: 'SECRET_KEY',
  mongoURL: 'mongodb://localhost/payload',
  express: app,
})

app.listen(3000, async () => {
  console.log('Express is now listening for incoming connections on port 3000.')
})
```

Your `payload.init` call will need to be converted into the following:

```js
const express = require('express')
const payload = require('payload')

const app = express()

const start = async () => {
  await payload.init({
    secret: 'SECRET_KEY',
    mongoURL: 'mongodb://localhost/payload',
    express: app,
  })

  app.listen(3000, async () => {
    console.log('Express is now listening for incoming connections on port 3000.')
  })
}

start()
```

Notice that all we've done is wrapped the `payload.init` and `app.listen` calls with a `start` function that is asynchronous.

#### ✋ All Local API methods are no longer typed as generics, and instead will infer types for you automatically

Before this release, the Local API methods were configured as generics. For example, here is an example of the `findByID` method prior to this release:

```ts
const post = await payload.findByID<Post>({
  collection: 'posts',
  id: 'id-of-post-here',
})
```

Now, you don't need to pass your types and Payload will automatically infer them for you, as well as significantly improve typing throughout the local API. Here's an example:

```ts
const post = await payload.findByID({
  collection: 'posts', // this is now auto-typed
  id: 'id-of-post-here',
})

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
const payload = require('payload')

require('dotenv').config()

const { PAYLOAD_SECRET, MONGODB_URI } = process.env

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
  })

  // For each collection
  await Promise.all(
    payload.config.collections.map(async ({ slug, versions }) => {
      // If drafts are enabled
      if (versions?.drafts) {
        const { docs } = await payload.find({
          collection: slug,
          limit: 0,
          depth: 0,
          locale: 'all',
        })

        const VersionsModel = payload.versions[slug]
        const existingCollectionDocIds: Array<string> = []
        await Promise.all(
          docs.map(async (doc) => {
            existingCollectionDocIds.push(doc.id)
            // Find at least one version for the doc
            const versionDocs = await VersionsModel.find(
              {
                parent: doc.id,
                updatedAt: { $gte: doc.updatedAt },
              },
              null,
              { limit: 1 },
            ).lean()

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
                })
              } catch (e) {
                console.error(
                  `Unable to create version corresponding with collection ${slug} document ID ${doc.id}`,
                  e?.errors || e,
                )
              }

              console.log(`Created version corresponding with ${slug} document ID ${doc.id}`)
            }
          }),
        )

        const versionsWithoutParentDocs = await VersionsModel.deleteMany({
          parent: { $nin: existingCollectionDocIds },
        })

        if (versionsWithoutParentDocs.deletedCount > 0) {
          console.log(
            `Removing ${versionsWithoutParentDocs.deletedCount} versions for ${slug} collection - parent documents no longer exist`,
          )
        }
      }
    }),
  )

  console.log('Done!')
  process.exit(0)
}

ensureAtLeastOneVersion()
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
      slug: 'case-studies',
      labels: {
        // Before Payload used `labels.singular` to generate types/graphQL schema
        singular: 'Project',
        plural: 'Projects',
      },
    }

    // After
    const ExampleCollection: CollectionConfig = {
      // Now Payload uses `slug` to generate types/graphQL schema
      slug: 'case-studies',
      labels: {
        singular: 'Project',
        plural: 'Projects',
      },
      // To override the usage of slug in graphQL schema generation
      graphQL: {
        singularName: 'Project',
        pluralName: 'Projects',
      },
      // To override the usage of slug in type file generation
      typescript: {
        interface: 'Project',
      },
    }
    ```

  - **Globals:** are affected if you have a `label` defined that differs from your global slug.

    ```typescript
    // ExampleGlobal.ts

    // Before
    const ExampleGlobal: GlobalConfig = {
      slug: 'footer',
      // Before Payload used `label` to generate types/graphQL schema
      label: 'Page Footer',
    }

    // After
    const ExampleGlobal: GlobalConfig = {
      // Now Payload uses `slug` to generate types/graphQL schema
      slug: 'footer',
      label: 'Page Footer',
      // To override the usage of slug in graphQL schema generation
      graphQL: {
        name: 'PageFooter',
      },
      // To override the usage of slug in type file generation
      typescript: {
        interface: 'PageFooter',
      },
    }
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
import { SanitizedConfig } from 'payload/config'

const plugin = (config: SanitizedConfig): SanitizedConfig => {
  return {
    ...config,
  }
}
```

It can now be written like this:

```ts
import { Config } from 'payload/config'

const plugin = (config: Config): Config => {
  return {
    ...config,
  }
}
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
  slug: 'pages',
  access: {
    // No `read` access control was set
  },
}
```

To:

```js
const Page = {
  slug: 'pages',
  access: {
    // Now we explicitly allow public read access
    // to this collection's documents
    read: () => true,
  },
}
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
