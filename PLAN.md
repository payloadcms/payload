# Paul's quest on draft: true

This is based on conversations and examples we've had recently. Did some deeper thinking and I want to highlight these principles:

1. We want Payload's code to continue to look beautiful.
2. We want to remove ambiguity from `draft: true | false` .
3. Give more control to the developers on which exact version is being edited.
4. Sensible and *safe* defaults.

And yes some of the changes are inspired by the previous proposal presented by German and Nate.

## From `draft` to `version`

It removes the first layer of ambiguity, *which version of my document am I interacting with?*

```
// Before
draft?: boolean

// After
version?: 'latest' | 'published' | 'draft'
```

We make the decision going forward of the following:

| *Omitted* | Published for `Find` and `Update` . Drafts for `Create` |
|---|---|
| `'published'` | `Find`, `Create` or `Update` the published document only. |
| `'latest'` | `Find` or `Update` the latest draft, falls back to the publish document. |
| `'draft'` | `Find`, `Create` or `Update` the latest draft only. |

Note that `'latest'` doesn't exist on `Create` .

For updates, `version` selects the starting copy; `_status` requests its new publication state. Yes it's not super clear but that's why we build [`publish` and `unpublish`](https://staging.figma.com/spec/pA1AyiAXKuEabcetircrIq?node-id=1-8) as direct methods that better wrap the core APIs here.

## New API

`version` **defines the starting copy to manipulate, or the "target" document.** So here's the new API by operation:

### Find

Reading published content only by default seems sensible and safe.

| Purpose | Before | After |
|---|---|---|
| Default read | `find()` - main document, which can be unpublished | `find()` - published content only |
| Explicit published read | Required filtering - `find({ where: { _status: { equals: 'published' } } })` | `find({ version: 'published' })` |
| Preview current work | `find({ draft: true })` | `find({ version: 'latest' })` |
| Read active drafts only | Requires filtering - `find({ draft: true, where: { _status: { equals: 'draft' } } })` | `find({ version: 'draft' })` |



### Create

By default creation will make a draft. Version wins over data.

| Purpose | Before | After |
|---|---|---|
| Default creation | `create({ data })` | Same call, **creates a draft**. |
| Explicit draft creation | `create({ data, draft: true })` | `create({ data, version: 'draft' })` |
| Explicit published creation | `create({ data: { ...data, _status: 'published' } })` | `create({ data, version: 'published' })` |
| Publish through `_status` | `create({ data: { ...data, _status: 'published' } })` | Same call |



### Update

When neither `version` nor `data._status` is supplied, updates edit the published document, the same copy `Find` returns by default. There are inherent overrides based on data.

| Purpose | Before | After |
|---|---|---|
| Default update | `update({ id, data })` | Same call, **edits the published document by default**. |
| Save a draft | `update({ id, data, draft: true })` | `update({ id, data, version: 'draft' })` |
| Edit published content while preserving a pending draft | No direct copy selector, `draft: false` does not guarantee this | `update({ id, data, version: 'published' })` |
| Edit the active draft, otherwise published | No equivalent `draft` boolean | `update({ id, data, version: 'latest' })` |
| Publish the current draft | `update({ id, data: { _status: 'published' } })` | Same call |
| Unpublish | `update({ id, data: { _status: 'draft' }, unpublishAllLocales: true })` | `update({ id, version: 'published', locale: 'all', data: { _status: 'draft' } })` |

These tables aren't the clearest presentation form for engineers so below is code.

## Follow the code

```
// Find
find()                        // Published content only
find({ version: 'published' }) // Published content only
find({ version: 'latest' })    // Active draft if present, otherwise published
find({ version: 'draft' })     // Active drafts only

// Create
create({ data })                       // Create a draft
create({ data, version: 'draft' })     // Create a draft
create({ data, version: 'published' }) // Create published content
create({ version: 'published', data: { _status: 'draft' } })

// Update
update({ id, data })                       // Edit published doc
update({ id, data, version: 'draft' })     // Save a draft
update({ id, data, version: 'published' }) // Edit published doc, preserve the draft
update({ id, data, version: 'latest' })    // Edit the draft if present, otherwise published
```



Ambiguous Examples:

```ts
update({ id, version: 'draft', data: { _status: 'published' } }) // publishes latest draft?
update({ id, version: 'published', data: { _status: 'draft' } }) // unpublishes current live?
update({ id, data: { _status: 'published' }) // does this publish a draft?
update({ id, version: 'draft', data }) // What happens when no draft exists?
update({ id, version: 'latest', data }) // if latest fell back to main, does it update to draft (basically an unpublish) or create a new draft?
update({ id, version: 'published', data }) // If never-published draft is in main does that get updated or is this a noop?
update({ id, data: { _status: 'draft' }) // asked above, does this just save a draft or is it supposed to unpublish?

```

Here:

```
update({ id, version: 'draft', data: { _status: 'published' } })
// Targets the draft and publishes it

update({ id, version: 'published', data: { _status: 'draft' } })
// Target the published version and unpublish it
// Preserve any draft

update({ id, data: { _status: 'published' } })
// Publish the latest draft, replacing published content if it exists

update({ id, version: 'draft', data })
// Update the active draft
// If none exists, create a draft from published content and apply data

update({ id, version: 'latest', data })
// Update the active draft if present
// Otherwise update published content directly

update({ id, version: 'published', data })
// Update the current published copy and preserve any draft

update({ id, data: { _status: 'draft' } })
// Update to the latest draft, does not unpublish as it targets a 'draft' by default
```

## Localisation

An important part of this change is our opportunity to remove `publishAllLocales` and `unpublishAllLocales` in favour of a consistently supported `locale` property.

```
// Before
update({ id, data: { _status: 'published' }, publishAllLocales: true })
update({ id, data: { _status: 'draft' }, unpublishAllLocales: true })

// After
update({ id, data: { _status: 'published' }, locale: 'all' }) // Publish all
update({ id, version: 'published', data: { _status: 'draft' }, locale: 'all' }) // Unpublish all


// Target one locale using the same structure.
update({ id, data: { _status: 'published' }, locale: 'en' }) // Publish english
update({ id, version: 'published', data: { _status: 'draft' }, locale: 'en' }) // Unpublish english
```

### Find

```
// Read published English content.
find({ locale: 'en' })

// Read published content across all locales.
find({ locale: 'all' })

// Read the active draft where present, otherwise published,
// resolving that choice separately for each locale.
find({ locale: 'all', version: 'latest' })

// Read active French drafts only.
find({ locale: 'fr', version: 'draft' })
```

### Create

```
// Create an English draft.
create({
  locale: 'en',
  data: { title: 'Hello' },
})

const localizedData = {
  title: {
    en: 'Hello',
    fr: 'Bonjour',
  },
}

// Create drafts across locales.
create({
  locale: 'all',
  data: localizedData,
})

// Create published content across locales.
create({
  locale: 'all',
  version: 'published',
  data: localizedData,
})

// The same publication request through _status.
create({
  locale: 'all',
  data: { ...localizedData, _status: 'published' },
})
```

### Update

```
// Update published English content.
update({
  id,
  locale: 'en',
  data: { title: 'Proposed title' },
})

// Update published content across locales.
update({
  id,
  locale: 'all',
  data: {
    title: {
      en: 'Proposed title',
      fr: 'Titre proposé',
    },
  },
})


// Correct published English content while preserving its draft.
update({
  id,
  locale: 'en',
  version: 'published',
  data: { title: 'Corrected title' },
})
```

## Conclusion

Ultimately we cannot predict how everyone will understand these APIs. `draft` is confusing enough to us though so it does have to change and now is a very good time to pull off this bandaid. I think the proposal above is only half the battle, to really remove ambiguity I'd go for explicit operations as per below.

## Post 4.0 beta

### New methods added to further remove ambiguity

`publish` `unpublish`  - Based on exploration with other APIs, we keep core behaviour and defaults supported we will be able to encourage users to use these methods for sure updates.

I don't want to think about the props of my call, let me just `publish({ id })`.

### Content branching

Doesn't impact that feature at all, the same operations (even `publish`) would function independently as content branching only relies on `branch` as a property.

## Alternatives considered

### Why not `intent`, `action`

These are additional operations within our methods, they set a precedence of the direction Payload's API could go in that doesn't ultimately result in cleaner code. You'd then be able to argue `action` should also have `trash` and at that point I think we're looking at a different kind of mess.
