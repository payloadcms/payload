# PYLD-3081 Versions Access Control Design

## Problem

Collection version operations currently enforce `access.readVersions` independently from
`access.read`. When a collection defines a query-based `read` rule but does not define
`readVersions`, an authenticated user can query version rows without the collection's document
constraint. Because version rows store document fields beneath `version`, the original collection
query cannot be applied without translating its paths.

## Desired behavior

- Preserve an explicitly configured `access.readVersions` function exactly as provided.
- When `access.readVersions` is omitted, derive it from the collection's sanitized `access.read`
  function.
- Pass boolean results from the inherited `read` function through unchanged.
- Translate inherited query results to the version-row structure.
- Apply the behavior consistently to every consumer of sanitized `readVersions`, including version
  operations and permission calculation.
- Keep globals and explicitly configured version access outside the scope of this change.

## Design

`addDefaultsToCollectionConfig` will first resolve the collection's `read` function, retaining the
configured function or using `defaultAccess`. It will then retain an explicit `readVersions`
function or install an asynchronous wrapper around the resolved `read` function.

The wrapper will call `read` with the access arguments it receives. It will use
`hasWhereAccessResult` to distinguish a `Where` result from a boolean. Boolean results will be
returned directly. A `Where` result will be passed through `appendVersionToQueryKey` before being
returned.

Conceptually, the fallback is:

```ts
const read = access?.read ?? defaultAccess

const readVersions =
  access?.readVersions ??
  (async (args) => {
    const result = await read(args)

    return hasWhereAccessResult(result) ? appendVersionToQueryKey(result) : result
  })
```

The existing version operations will remain unchanged. They already execute the sanitized
`readVersions` function, so centralizing the fallback in configuration sanitization also covers
Local API, REST, GraphQL, `findVersions`, `countVersions`, `findVersionByID`, and permission
calculation without duplicating access logic.

## Query translation

The existing `appendVersionToQueryKey` utility provides the required translation:

- Collection fields are prefixed with `version.`. For example, `owner` becomes `version.owner`.
- Dotted collection paths retain their path beneath `version`.
- `and` and `or` branches are translated recursively, including their uppercase variants.
- The collection document's `id` constraint becomes a constraint on the version row's `parent`.
- Query operators and values are left unchanged.

Only queries inherited from `read` are translated. Queries returned by an explicit `readVersions`
function already target the version table and will not be modified.

## Errors and compatibility

Errors thrown by the inherited `read` function will propagate through the fallback in the same way
as errors from an explicit `readVersions` function. Existing `overrideAccess` behavior is unchanged
because operations do not execute `readVersions` when access is overridden.

This is a secure-default change for collections that have versions, define `read`, and omit
`readVersions`. Explicit `readVersions` functions remain the compatibility escape hatch when
version history requires different access semantics.

## Testing

Unit tests for collection defaults will verify that:

- An explicit `readVersions` function is preserved by reference and behavior.
- An inherited `read` result of `true` or `false` is returned unchanged.
- An inherited query is translated, including logical branches and the `id`-to-`parent` mapping.

Integration coverage will configure a versioned collection with query-based `read` access and no
`readVersions` function. Matching and non-matching documents will verify that `findVersions`,
`countVersions`, and `findVersionByID` cannot expose disallowed version data. A collection with an
explicit `readVersions` function will verify that custom version access remains authoritative.

Documentation for collection `readVersions` access will explain the new fallback and retain the
warning that explicit `readVersions` queries target the version-row structure directly.

## Alternatives considered

Adding fallback logic separately to each version operation would make the behavior visible at each
call site, but it would duplicate security-sensitive logic and could omit permission calculation or
future version consumers.

Adding version-query translation options to generic access execution would centralize the transform,
but it would broaden a collection-specific default into shared authentication infrastructure. The
configuration-level wrapper is smaller and makes every existing consumer use the same result.
