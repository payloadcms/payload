# Authorized hierarchy contents

`getHierarchyContents` reads one branch of a single-assignment hierarchy (`allowHasMany: false`). Folder presets and custom container collections use the same operation. Nested-document collections use their own single-collection branch reader.

The caller supplies an authenticated `PayloadRequest`, the container collection, an optional parent ID, and an optional source collection. The operation discovers permitted source mappings from sanitized hierarchy configuration. It authorizes the parent and applies each collection's Admin base filter before reading related content through `payload.find` with `overrideAccess: false`.

Each source owns its pagination (`page`, `hasNextPage`, `totalDocs`, `totalPages`). The container source comes first. Results are not a globally sorted union. Limit defaults to 10 and accepts 1–40; page accepts 1–10000. At root, the operation returns unassigned documents. Searches apply to each source's configured title field.

Field and document read access, locale, drafts, hooks and lock metadata use the ordinary read pipeline. The projection contains IDs, titles, supported timestamps and the lock status returned by Payload. Sources whose membership field has a read rule are conservatively omitted, including rules that currently return true: a filtered query would otherwise reveal membership before field processing strips it. This restriction must be resolved before claiming general support for guarded membership fields.

`allowedCollections` is an optional advisory hint read from the authorized parent result. An empty array means unrestricted; an absent property means unavailable or not applicable, including root. It is not permission to create or move a document. Every mutation must apply normal authorization and collection restrictions again. Lock metadata is also advisory and can change after the read.

The `hierarchy-contents` Admin server function additionally checks `canAccessAdmin` and delegates to this operation. Framework adapters receive it through the shared server-function registry. There is no feature-specific REST endpoint or raw database query. The client callback checks local abort signals before and after dispatch; it does not guarantee cancellation of server work already running.

Container source documents also select their configured collection-specific field.
Each returned document retains its own allowed types when readable; an unreadable
field stays absent rather than becoming an unrestricted empty array.
