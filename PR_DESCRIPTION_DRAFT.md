## 📌 Summary
Fixes #17833

Fixes an issue in `@payloadcms/plugin-multi-tenant` where single-tenant auto-selection overrode the server's intentional "no tenant selected" state on every page mount for users with `userHasAccessToAllTenants`.

---

## 🔍 Root Cause Analysis
When an installation had exactly one tenant, `TenantSelectionProvider` unconditionally auto-selected the first tenant and wrote the `payload-tenant` cookie, ignoring whether the user had global access (`userHasAccessToAllTenants`) and desired an unselected platform-wide view. On the client, the sync effect and `setTenant` also forced re-selection of the single tenant even when clearing the selection or when `initialValue` was undefined.

---

## 🛠️ Solution
- In `TenantSelectionProvider` (server component), checked `userHasAccessToAllTenants(user)` before falling back to auto-selecting the single tenant, ensuring users with global access retain `initialValue = undefined` when no tenant cookie is set.
- In `TenantSelectionProviderClient`, only auto-select the single tenant and set the cookie if `initialValue` is defined, and allow `setTenant({ id: undefined })` to clear tenant selection regardless of tenant count.
- Added unit tests in `packages/plugin-multi-tenant/src/providers/TenantSelectionProvider/tenantSelection.unit.test.ts`.
