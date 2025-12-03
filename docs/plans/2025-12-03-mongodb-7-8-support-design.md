# MongoDB 7/8 Support Design

## Overview

Update `@payloadcms/db-mongodb` to support MongoDB Server versions 7.x and 8.x while maintaining backward compatibility with MongoDB 4.4+.

## Motivation

Users are running MongoDB 7 and 8 in production and need the Payload MongoDB adapter to work with these versions. The current adapter uses Mongoose 6.x which only officially supports MongoDB up to 5.x.

## Approach

Upgrade from Mongoose 6.x to Mongoose 8.x, which officially supports MongoDB 4.4–7.x (and 8.x via driver backward compatibility).

---

## Dependency Updates

**File:** `packages/db-mongodb/package.json`

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| `mongoose` | `6.13.8` | `^8.8.0` | Core upgrade for MongoDB 7/8 support |
| `mongoose-paginate-v2` | `1.7.22` | `^1.8.0` | v1.8.0 has explicit Mongoose 8 support |
| `mongoose-aggregate-paginate-v2` | `1.0.6` | `^1.1.4` | Latest version, actively maintained |
| `mongodb` (devDep) | `4.17.2` | `^6.12.0` | Mongoose 8 uses mongodb driver 6.x |
| `@types/mongoose-aggregate-paginate-v2` | `1.0.9` | `^1.0.12` | Updated type definitions |

---

## Code Changes

### 1. `src/index.ts` (Line 171)

**Current:**
```typescript
mongoose.set('strictQuery', false)
```

**Change:** Review whether to keep or remove. Mongoose 8 defaults `strictQuery` to `false`, so this line is now redundant but can be kept for explicitness.

### 2. `src/connect.ts` (Lines 54-59)

**Current:**
```typescript
const client = this.connection.getClient()

if (!client.options.replicaSet) {
  this.transactionOptions = false
  this.beginTransaction = undefined
}
```

**Change:** Verify `connection.getClient()` and `client.options.replicaSet` still work with the new MongoDB driver. These are standard driver APIs and should remain unchanged.

### 3. `src/models/buildSchema.ts` (Lines 222-227)

**Current:**
```typescript
// @ts-expect-error
schema.path(`${field.name}.${localeCode}`).discriminator(blockItem.slug, blockSchema)
```

**Change:** Update or verify `@ts-expect-error` comments for discriminator types. Mongoose 8 has improved TypeScript support, so these may no longer be needed or may need adjustment.

### 4. `src/models/buildGlobalModel.ts`

**Change:** Verify discriminator pattern works with Mongoose 8. The API is unchanged, but TypeScript types may need updates.

### 5. `src/transactions/beginTransaction.ts`

**Change:** Verify `TransactionOptions` type import from mongoose and `client.startSession()` API unchanged.

### 6. Type Imports (Various Files)

Verify these imports still exist in Mongoose 8:
- `ConnectOptions` from mongoose
- `MongooseQueryOptions` from mongoose
- `ClientSession` from mongodb
- `PaginateOptions` from mongoose-paginate-v2

---

## MongoDB Version Support Matrix

After this upgrade:

| MongoDB Version | Support Status |
|-----------------|----------------|
| 4.2 and earlier | Not supported (EOL) |
| 4.4 | Supported |
| 5.x | Supported |
| 6.x | Supported |
| 7.x | Supported (new) |
| 8.x | Supported (new) |

**Note:** MongoDB 4.4 reached end-of-life in February 2024. Dropping support for versions below 4.4 is acceptable.

---

## Risk Assessment

### Low Risk
- **Mongoose API stability**: Core APIs (`find`, `findOne`, `create`, `updateOne`) unchanged
- **Session handling**: Transaction APIs stable across versions
- **Plugin API**: Plugin system backward compatible

### Medium Risk
- **mongoose-paginate-v2**: v1.8.0 explicitly supports Mongoose 8
- **TypeScript types**: May need `@ts-expect-error` updates for discriminators
- **strictQuery default**: Behavior change (now defaults to `false`)

### Mitigation
- **mongoose-aggregate-paginate-v2**: If issues arise, usage is isolated to `queryDrafts.ts` and could be replaced with native aggregation + manual pagination
- **Comprehensive testing**: Run full test suite against MongoDB 7.x and 8.x

---

## Breaking Changes (User-Facing)

This upgrade introduces breaking changes for Payload users. This section documents what users need to know.

### Node.js Version Requirement

| Before (Mongoose 6) | After (Mongoose 8) |
|---------------------|-------------------|
| Node.js >= 14 | Node.js >= 16.20.1 |

**Impact:** Users running Node.js 14 or 15 must upgrade to Node.js 16.20.1 or later.

Payload 2.x currently specifies `"node": ">=14"` in its engine requirements. This upgrade effectively raises that minimum to 16.20.1 for users of the MongoDB adapter.

### MongoDB Version Requirement

| Before (Mongoose 6) | After (Mongoose 8) |
|---------------------|-------------------|
| MongoDB 3.6+ | MongoDB 4.4+ |

**Impact:** Users running MongoDB 4.2 or earlier must upgrade to MongoDB 4.4 or later.

**Mitigation:** MongoDB 4.2 reached end-of-life in April 2023, and MongoDB 4.4 reached end-of-life in February 2024. Users on these versions should already be planning upgrades for security reasons.

### TypeScript Type Changes

The adapter exposes Mongoose types directly to users in its configuration interface:

```typescript
// packages/db-mongodb/src/index.ts
export interface Args {
  connectOptions?: ConnectOptions & { useFacet?: boolean }
  schemaOptions?: SchemaOptions
  collation?: Omit<CollationOptions, 'locale'>
  // ...
}
```

**Impact:** Users passing custom `connectOptions` or `schemaOptions` may encounter TypeScript errors if Mongoose 8's type definitions differ from Mongoose 6.

**Mitigation:** Most users use default options. Advanced users with custom configurations should review the [Mongoose 8 Migration Guide](https://mongoosejs.com/docs/migrating_to_8.html) for type changes.

### Behavioral Changes

| Aspect | Change | User Impact |
|--------|--------|-------------|
| `strictQuery` | Default changed to `false` in Mongoose 8 | **None** - Payload explicitly sets this to `false` |
| Query behavior | Unchanged | None |
| Transaction handling | Unchanged | None |

### Release Considerations

Since this is the 2.x branch, consider one of these approaches:

1. **Major version bump** - Release as part of `@payloadcms/db-mongodb@2.0.0` with documented breaking changes
2. **Documentation update** - If releasing as minor/patch, prominently document the new Node.js and MongoDB requirements
3. **Defer to 3.x** - Hold this change for Payload 3.x if a major release is planned

### Migration Checklist for Users

Users upgrading to this version should:

- [ ] Verify Node.js version is >= 16.20.1
- [ ] Verify MongoDB server version is >= 4.4
- [ ] Review any custom `connectOptions` or `schemaOptions` for type compatibility
- [ ] Run test suite against their application
- [ ] Test transactions if using replica sets

---

## Testing Strategy

1. **Unit Tests**
   - Run `pnpm test:unit` in db-mongodb package
   - Verify `getLocalizedSortProperty.spec.ts` passes

2. **Integration Tests**
   - Run `pnpm test:int` with MongoDB adapter
   - Test CRUD operations, queries, and transactions

3. **Version Compatibility Tests**
   - Test against MongoDB 4.4 (backward compat)
   - Test against MongoDB 7.x (new support)
   - Test against MongoDB 8.x (new support)
   - Can use `mongodb-memory-server` or real MongoDB instances

---

## Files Modified

| File | Change Type |
|------|-------------|
| `packages/db-mongodb/package.json` | Dependency updates |
| `packages/db-mongodb/src/index.ts` | Review strictQuery setting |
| `packages/db-mongodb/src/connect.ts` | Verify (likely no changes) |
| `packages/db-mongodb/src/models/buildSchema.ts` | Type fixes if needed |
| `packages/db-mongodb/src/models/buildGlobalModel.ts` | Type fixes if needed |
| `packages/db-mongodb/src/transactions/beginTransaction.ts` | Verify types |

---

## Success Criteria

- [ ] All existing tests pass
- [ ] TypeScript compiles without new errors
- [ ] Works with MongoDB 4.4, 5.x, 6.x (backward compat)
- [ ] Works with MongoDB 7.x and 8.x (new support)
- [ ] No runtime errors in connection, queries, or transactions
- [ ] Pagination works correctly with updated plugins

---

## References

- [Mongoose 8 Migration Guide](https://mongoosejs.com/docs/migrating_to_8.html)
- [mongoose-paginate-v2 v1.8.0 Release](https://github.com/aravindnc/mongoose-paginate-v2/releases/tag/v1.8.0)
- [MongoDB Server Version Support](https://www.mongodb.com/docs/manual/release-notes/)
