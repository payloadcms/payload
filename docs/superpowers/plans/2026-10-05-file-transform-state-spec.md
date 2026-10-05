# File Transform State — source snapshot

Source: https://docs.google.com/document/d/1xHewFTv-JG0zDuTTUZ9BE-fatF6NH9DDVoa9WGjquYc/edit?tab=t.mjtte4xqo24o#heading=h.ce623t2w0mjz

Read on October 5, 2026. Plain-text snapshot of the File transform state tab; formatting, date/person chips, and document-wide comments are not reproduced. The live document is authoritative if it changes.

Payload File Transform State Design Specification
Written with AI
Depends on File Transformers and File Versioning.
Updated: Author:
Context
File Transformers establishes the generic upload and request-time pipeline. File Versioning establishes the retained original and managed-file lifecycle. This design follows both and adds the durable, typed editorial state that defines a file's default representation.

Dynamic request parameters are intentionally ephemeral. Persisted crop, clip, encoding, and similar choices are different: they are document state, must follow versions and locales, and must not be tied to Sharp or any other provider.
Summary
Every upload collection receives one reserved, nullable \_transforms field implemented as a Payload JSON field (type: 'json'). Core always defines a first-class transform vocabulary for images, video, paged documents, and format-independent operations. Configured file transformers may add custom definitions with JSON Schema and optional semantic validation.
The upload document has three authorities: top-level upload fields describe the logical representation served by default; original describes the untouched retained source; \_transforms contains only non-derivable editorial and processing intent. Top-level fields remain part of the normal upload document and API rather than moving under a new \_file or \_storage object. When Payload stores a derived result, its metadata describes those stored bytes; when the result is dynamic, only stable or known metadata is populated and variable values may be null or omitted.

For persisted execution and replay, every per-file transformer callback receives the full mutable doc and immutable originalDoc snapshot. MIME values, custom fields, original, and validated \_transforms remain available through those documents rather than duplicated as separate arguments. Later transformers observe changes made to doc by earlier stages, while originalDoc never changes. A resolved or expected default MIME remains top-level metadata; \_transforms does not persist a duplicate MIME selector.
Built-in transform definitions
Payload always includes the following definitions in the \_transforms schema and generated types:
crop: select a spatial rectangle in integer pixels measured against the original source.
focalPoint: select a preferred x/y point as normalized percentages from 0 through 100.
resize: set target width, height, fit behavior, and enlargement policy for visual media.
rotate: rotate visual media by a documented angle and coordinate convention.
flip: mirror visual media horizontally or vertically.
clip: select a temporal interval using startMs inclusive and endMs exclusive.
pageRange: select a 1-based inclusive page interval using startPage and endPage.
posterFrame: select a video frame by source timestamp.
metadataPolicy: preserve or strip embedded metadata independently of extracted \_metadata.
encoding: store MIME-specific encoding or optimization settings that cannot be derived from the resolved representation. It does not store target MIME.
Configured transformers may contribute additional globally unique definitions for other file types or specialized operations. Built-in keys are reserved and cannot be replaced by transformer configuration.
Goals
Preserve reversible, per-file transform choices alongside the original source.
Let core and transformer packages add typed transform keys without adding file-type-specific database columns.
Keep common transform data portable between transformer implementations.
Validate the complete stored value through REST, GraphQL, Local API, Admin UI, hooks, and internal processing.
Version, restore, duplicate, replace, and localize transform state with the owning file bundle.
Generate useful TypeScript and JSDoc output from configured transform definitions.
Keep request parameters ephemeral unless a client explicitly saves corresponding transform intent, while allowing saved intent to resolve dynamically without a Payload-managed derived file.
Non-goals
A persisted registry of generated variants or cached dynamic outputs.
A transform execution log, source fingerprint, warning envelope, or job-status field.
A provider-keyed shape such as \_transforms.sharp or \_transforms.mux.
A per-document schemaVersion.
A full compositing or overlay model.
Relationship to existing DAM designs
File Transformers is the first dependency. It supplies the base transformer lifecycle, MIME matching, FileSource upload input, request handling, and declaration-order pipeline without requiring persisted state.
File Versioning is the second dependency. It supplies the retained original and private managed-file lifecycle. This specification lands after it, makes \_transforms ordinary versioned document data, and adds state-specific planning and source access to the transformer contract.

Metadata API uses the same broad storage pattern—a hidden JSON field injected into upload collections—but ownership differs. \_metadata is extractor-produced and protected from client writes; \_transforms records editorial intent and is writable by authorized clients after validation.
File Localization must treat \_transforms as part of the same locale-specific file bundle as top-level logical file metadata, original, \_metadata, configured sizes, and Payload-managed physical references.

Transform state document shape
The upload document has four field categories:
Custom collection fields remain at the top level and behave exactly like ordinary Payload fields.
Top-level upload fields are the logical main representation served by default. filename and URL identify that representation. mimeType, filesize, width, height, and similar fields describe the resolved result when known; values that vary by request or are unavailable before provider execution may be null or omitted. These fields do not prove that Payload stores a separate main object.
original is the retained, untouched input. Its filename, MIME type, file size, dimensions, and storage reference remain stable so persisted transforms can be changed or replayed without compounding prior edits. Core exposes it separately from the current pipeline accumulator.
\_transforms is nullable declarative intent. It stores only values that cannot be reconstructed reliably from the resolved default representation. It does not store a transformer slug, execution trace, or stored-versus-dynamic mode.
Field ownership and write semantics
Custom collection fields remain ordinary document data and follow their configured access, validation, hooks, and Admin UI behavior.
Top-level filename, url, mimeType, filesize, width, height, and similar file metadata are controlled by core, with configured transformers participating through the pipeline. Clients palread them; filename changes through the explicit rename operation rather than arbitrary field writes.
original is core-managed and client read-only because it identifies the retained source of truth.
\_transforms is the reserved file field that authorized clients may write after structural and semantic validation.
No \_file, \_storage, stored/dynamic mode, provider identity, or transformer identity is added to the document.
File Versioning stores physical ownership in a private managed-file manifest alongside each current upload state and retained version. That internal manifest is not part of the public upload document or \_transforms value.
The injected \_transforms field is a real Payload JSON field with type: 'json'. admin.hidden: true keeps the generic JSON editor out of the Admin UI, while authorized REST, GraphQL, Local API, hooks, and transformer code may read or write it through the same structural and semantic validation. The field does not use Payload's field-level hidden option.
A transformed image therefore looks conceptually like:
{
filename: 'photo.jpg',
mimeType: 'image/jpeg',
filesize: 420000,
width: 960,
height: 1080,
original: {
filename: 'photo.png',
mimeType: 'image/png',
filesize: 6400000,
width: 4000,
height: 3000,
},
\_transforms: {
crop: { x: 0, y: 0, width: 960, height: 1080 },
encoding: { quality: 75, progressive: true },
},
}
The base type contributed by core is:
\_transforms: null | {
crop?: CropTransform
focalPoint?: FocalPointTransform
resize?: ResizeTransform
rotate?: RotateTransform
flip?: FlipTransform
clip?: ClipTransform
pageRange?: PageRangeTransform
posterFrame?: PosterFrameTransform
metadataPolicy?: MetadataPolicyTransform
encoding?: EncodingTransform
// Configured custom definitions are added as named optional properties.
}
An empty object is normalized to null. Transform keys are optional because a file uses only the operations relevant to it. \_transforms is injected even when no transformer is configured, so SQL projects perform the database migration once. Transformer additions change validation and generated types only when they add custom definitions.
Generated types enumerate each configured custom key. They do not add a string index signature. This makes unknown keys type errors and matches additionalProperties: false at runtime.
Example: image
\_transforms: {
crop: { x: 0, y: 0, width: 960, height: 1080 },
focalPoint: { x: 50, y: 40 },
encoding: { quality: 75, progressive: true },
}
The top-level filename and URL identify the JPEG representation served by default; MIME type, file size, width, and height describe it when known. The JPEG may be generated and stored during the edit or resolved dynamically. original describes the untouched source. crop.width and crop.height are source-space crop coordinates, not output dimensions.

Example: video
\_transforms: {
crop: { x: 120, y: 0, width: 1680, height: 1080 },
clip: { startMs: 1250, endMs: 10250 },
encoding: { videoCodec: 'h264', audioCodec: 'aac', videoBitrate: 6000000 },
}
clip uses an inclusive start and exclusive end measured against the original timeline. A video transformer executes the built-in crop, clip, and encoding values without changing their stored shapes; the known or resolved default container MIME is represented at the top level.
Example: PDF
\_transforms: {
pageRange: { startPage: 1, endPage: 12 },
metadataPolicy: { mode: 'strip' },
encoding: { profile: 'screen', downsampleImagesToDpi: 150, linearize: true },
}
pageRange uses 1-based inclusive page numbers measured against the original PDF. metadataPolicy is distinct from extracted \_metadata, and PDF-specific optimization settings remain under encoding.
Example: binary file
filename: 'archive.iso'
mimeType: 'application/x-iso9660-image'
\_transforms: null
The field is present for an ISO upload, but null is valid because no built-in operation needs to apply. A transformer for another binary format may add its own definition without changing the \_transforms container.
Figma considerations
Figma Cloud needs the untouched original, persisted editorial intent, and virtual metadata for configured sizes. It does not require a stored derivative, \_output, a stored/dynamic mode, provider identity, a source fingerprint, or Payload-managed cache state.
Expected document shape
{
filename: string
url: string
mimeType: string | null
filesize: number | null
width: number | null
height: number | null
original: {
filename: string
url: string
mimeType: string
filesize: number
width: number
height: number
}
\_transforms: null | {
crop?: { x: number, y: number, width: number, height: number }
focalPoint?: { x: number, y: number }
}
sizes: Record<string, {
filename: string
url: string
mimeType: string | null
filesize: number | null
width: number | null
height: number | null
}>
}
Only the original is a required stored file. The top-level URL and each sizes entry are logical Payload endpoints; their metadata is populated when stable and otherwise remains null. Crop coordinates use original-source pixels, while focalPoint uses percentages from 0 through 100. Format and quality may come from collection configuration or request parameters, so Figma Cloud does not need persisted encoding state for this flow.
Expected user flow
The user uploads a file.
Payload's storage adapter stores the untouched original in S3.
Payload saves the original descriptor, the stable logical file URLs, \_transforms as null or validated initial intent, and virtual metadata for configured sizes. The request-time Figma transformer does not create or return an upload-time derivative.
The user edits the crop or focal point. Payload validates and saves the new \_transforms value; no transformed file is written to S3.
A client requests the normal Payload file URL or a configured size URL.
Payload resolves the full document, enforces read access, and runs each eligible request transformer in configured order with doc and the immutable originalDoc snapshot.
The Figma transformer reads the saved intent and requested size, then returns the authorized provider response or signed redirect.
The provider fetches the original from S3, applies the transformation, and returns the image. The response may contain an ETag and a downstream CDN may cache it; Payload does not persist or coordinate that cache.
Crop and focal-point definitions
crop
x: the horizontal coordinate of the crop's upper-left corner in the original source.
y: the vertical coordinate of the crop's upper-left corner in the original source.
width: the positive width of the selected rectangle.
height: the positive height of the selected rectangle.
Crop values use non-negative integer pixels measured against the original file's natural dimensions. width and height must be greater than zero; x + width and y + height must remain inside known source bounds. The crop is interpreted before resize and encoding.
The Admin UI may calculate percentages while editing, but it converts to natural-source pixels when saving and converts back when reopening the editor. The stored crop has no unit property.
focalPoint
x: the horizontal position as a percentage from 0 through 100.
y: the vertical position as a percentage from 0 through 100.
focalPoint remains normalized because it represents a preferred relative point across responsive outputs rather than an exact source rectangle.
The design replaces the top-level focalX and focalY fields with \_transforms.focalPoint. This is an intentional breaking API change. Migration guidance must map existing focal values into the canonical definition; Payload must not maintain two writable sources of truth.
Transformer extension API
Extend the File Transformers contract only where persisted state requires it:
type TransformValidate<TValue = unknown> = (
value: TValue,
context: Pick<
CanTransformArgs,
'collectionSlug' | 'doc' | 'originalDoc' | 'req'

> & {

    transforms: Readonly<JSONObject>

},
) => true | string | Promise<true | string>

type TransformDefinition<TValue = unknown> = {
key: string
schema: JSONSchema
validate?: TransformValidate<TValue>
}

The state extension changes only these existing contract shapes:
UploadTransformer adds transformDefinitions?: TransformDefinition[].
CanTransformArgs adds purpose: 'persisted-default' | 'request-override' for state-aware request planning.
A successful object CanTransformResult adds handledTransformKeys?: string[].
TransformFileArgs adds originalSource: FileSource for persisted replay.
HandleTransformRequestArgs adds getOriginalFile: () => Promise<Response>.
The base operation values remain 'upload' and 'request'.
File Transformers remains usable without these additions.
Definition meanings
key is the stable top-level property name stored under \_transforms. Core reserves every built-in key listed above. A custom definition must use a globally unique slug-like key when no built-in semantic fits.
schema is the complete JSON Schema for one key's value. Object schemas should reject additional properties. The definition and every property must include descriptions; type generation carries those descriptions into JSDoc and the same text becomes the basis for public documentation.
validate is a TransformValidate function for semantic checks that JSON Schema cannot express cleanly, such as crop bounds, timeline bounds, collection rules, cross-field conflicts, or result MIME compatibility. It receives the definition value first, full current doc, immutable originalDoc, collectionSlug, req, and the complete proposed \_transforms object.
transformDefinitions declares custom storable vocabulary; it does not schedule work. This design extends CanTransformArgs with purpose: 'persisted-default' | 'request-override' for state-aware request planning. During persisted-default planning, handledTransformKeys identifies the saved keys executed by a stage. Core requires complete, non-duplicated coverage when a dynamic default or regeneration needs those keys. Upload planning remains operation: 'upload' and does not use purpose.
Schema assembly and type generation
Core injects the reserved field into every upload collection with this contract:
{
name: '\_transforms',
type: 'json',
admin: { hidden: true },
jsonSchema: {
uri: 'payload://upload-transforms',
fileMatch: ['payload://upload-transforms'],
schema: assembledTransformSchema,
},
}
At configuration initialization, Payload assembles jsonSchema.schema from the core definitions and every configured transform definition:
The root accepts an object or null.
properties contains every built-in and configured custom definition.
additionalProperties is false for explicit writes, so misspelled or unregistered keys fail validation.
Each property carries its JSON Schema and description for generated types, JSDoc, MCP validation, and Admin JSON-editor guidance.
Generated TypeScript contains the built-in keys and each configured custom key as named optional properties. It must not contain a catch-all string index signature.
The assembled JSON Schema owns structural rules: object shapes, scalar types, enums, required members, and static limits. TransformValidate owns semantic rules that depend on the document or on other values, including source bounds, timeline duration, page count, cross-field constraints, source MIME compatibility, and provider-specific limits.
Because \_transforms is a JSON field, GraphQL continues to expose it as JSON. REST and Local API writes pass through the assembled schema and semantic validation. SQL adapters store one nullable JSON/JSONB column rather than adding a column for every definition.
MIME applicability and routing
The design distinguishes source MIME, current accumulator MIME, and persisted default MIME:
original.mimeType is the authoritative MIME of the retained untouched source and is available to every persisted executor.
The current accumulator MIME comes from FileSource.mimeType, replacement File.type, or replacement Response Content-Type.
The top-level mimeType is the stable known or expected MIME of the persisted default representation served by the top-level URL.
A configured size records its own stable MIME when known. It must not inherit a stale top-level or source MIME after format conversion.
\_transforms stores neither an input MIME selector nor a requested or actual output MIME.
A transformer that changes format must return matching MIME metadata. Later stages validate against the updated accumulator MIME. After persisted-default work succeeds, Payload writes the stable final MIME to the relevant top-level or size metadata. Request-override MIME negotiation remains request-local and does not update the document.
Validation and write behavior
\_transforms is a reserved base-upload field. A user-defined field with the same name fails configuration initialization with migration guidance.
Unlike \_metadata, authorized REST, GraphQL, Local API, and Admin UI clients may write \_transforms because it represents editorial intent. Normal collection create and update access still applies.
Omitting the \_transforms field on an update preserves the exact stored object and does not revalidate removed custom definitions.
Supplying \_transforms: null clears all transform state.
Supplying an object replaces the complete \_transforms value; it is not a deep merge. Omitting one key from that replacement removes that key. Payload validates the full replacement before file processing.
Explicit replacements reject unknown keys, malformed values, non-finite numbers, impossible bounds, and definition-specific semantic errors. An empty replacement object normalizes to null.
Internal transformer and Admin UI writes pass through the same schema and semantic validators as public API writes.
Execution model
When Payload regenerates stored output from reversible editorial state, original is the normal starting source. This is a transformer-level choice rather than a core invariant: each stage receives the current accumulator and separately accessible original and may choose the source appropriate to its operation.

\_transforms is a declarative object, not an ordered command list. JSON property order has no execution meaning.
Request resolution has two phases. The persisted-default phase runs first. The request-override phase runs second. Configured transformer order applies within each phase.
During planning, every saved key that must execute is claimed by exactly one compatible stage. An unclaimed or duplicate key fails before source retrieval, storage work, or an external call. A stored result can be reused without an executor only when the private managed-file manifest proves that the object is valid and no replay is required.
A transformer owns the deterministic order of the transform keys it executes and must document that order. Shared definitions include their coordinate or timeline reference and any required ordering; crop is relative to original and precedes resize and encoding.
Upload-time and persisted replay arguments receive the full current doc, immutable originalDoc, current FileSource accumulator, retained original FileSource, and only the options produced for that transformer. A transformer may update doc and return a replacement File with continue. Later stages receive the updated doc, replacement file, and updated MIME.
Request-time parameters compose after the persisted default and are never copied into \_transforms unless an authorized client performs a separate document update. Later request stages see the current working doc, response accumulator, and authoritative response MIME.
The top-level representation remains what the normal file URL serves. It may be a stored Payload object or a request-time result. The original remains available through its original entry and a separate internal original-source getter.
Payload validates and commits the final working doc atomically after upload-time or replay work succeeds. originalDoc is never mutated or committed. If a transformer generates Payload-managed bytes, their references participate in the same File Versioning commit and compensation plan. For dynamic requests, doc changes are pipeline-local and are not persisted. A failure discards the working doc and leaves prior document state and managed files in place.

Encoding options and compression
\_transforms.encoding contains only non-derivable, MIME-specific encoding or optimization settings. It does not store the requested or actual MIME type, filename, URL, file size, dimensions, or resolved output metadata.
The top-level mimeType is the known or expected MIME type of the default representation. If a transformer changes format, that target is transient execution input; after the default is resolved, Payload stores the stable result MIME at the top level when one exists. Per-request negotiated MIME does not require a misleading fixed value.
Image/JPEG encoding may include quality and progressive encoding.
Video encoding may include video codec, audio codec, bitrate, frame rate, profile, and container-specific limits.
PDF encoding may include a profile, image downsampling policy, linearization, metadata stripping, or hidden-object cleanup.
The same word—compression—does not have one portable representation across these branches. A JPEG quality value of 75 is not equivalent to a video bitrate or a PDF cleanup profile, so encoding remains an object whose allowed properties depend on the result MIME and transformer.
The assembled JSON Schema exposes the built-in option shapes. The resolved or expected default MIME selects the applicable branch, and TransformValidate rejects settings incompatible with that result or provider. If no non-derivable encoding settings are saved, encoding is omitted.
Why overlay is omitted
Overlay would mean compositing another asset or timed layer—such as a watermark, logo, subtitles, or graphics—onto visual output. A useful model needs a source relationship, version behavior, coordinate space, timing, opacity, z-order, access checks, and deterministic ordering. That is materially larger than the transform-state model specified here.
Overlay is not a built-in definition in this design. A custom transformer may define a compositing value only when it also specifies those relationship, ordering, access, and lifecycle semantics.
Rollout order
File Transformers lands first and preserves existing crop and focal-point behavior. It does not require original or \_transforms.
File Versioning lands second and adds the retained original and managed-file lifecycle. It preserves the existing crop and focal-point fields.
File Transform State lands third. It injects \_transforms, adds the state-specific transformer contract extensions, migrates focalX and focalY on the first transform-state write, and moves editor state to \_transforms.
Lifecycle
New uploads start with \_transforms: null unless the create operation includes validated transform state.
A metadata-only or ordinary document update preserves \_transforms.
Replacing the original file clears \_transforms by default because coordinates and timelines belong to the prior source. A replacement request may provide a new validated value explicitly.
The replacement value is complete, not a patch. Compatibility code maps legacy focalX and focalY into \_transforms.focalPoint before the first transform-state write, then removes them as writable sources of truth.
Changing transform state creates normal document versions when versions are enabled. Versions may share the same original while retaining different \_transforms and logical defaults; only Payload-managed derived objects directly referenced by a saved document are retained as physical version artifacts.
Restoring a version restores its retained original and saved \_transforms, then runs or resolves the current compatible transformer pipeline. Historical restoration is semantic rather than byte-exact: encodings, provider URLs, or configured sizes may differ when transformer code, configuration, or provider behavior has changed. A missing compatible executor fails clearly before the current state changes.

Duplicating an upload copies the transform value with the rest of document data while File Versioning creates an independent physical file set.
When upload.localized is true, \_transforms belongs to the locale-specific file bundle and never falls back independently from its original and main file.
Deleting or pruning versions uses Payload-managed physical file references—not \_transforms, logical URLs, provider URLs, or CDN cache state—to decide which stored objects remain reachable.

Removing or changing definitions
There is no schemaVersion inside each document value. Built-in definitions are part of the stable core schema and cannot be removed through configuration. Custom definitions follow the same configuration-migration model as Payload fields and plugin-owned configuration.
Removing a transformer removes its definition from new generated types and explicit-write validation, but an existing stored value remains readable and survives updates that omit \_transforms.
An explicit replacement removes an obsolete key by omitting it. Every unknown key that remains in the replacement is rejected. Reprocessing a removed key fails before storage work with a clear missing-definition error.
A transformer package that makes a breaking schema change must provide migration guidance or temporarily accept both old and new shapes while a project migrates documents.
Projects should clean or migrate stored keys before permanently removing the only transformer that can execute them.
Error handling
Invalid definition keys, malformed schemas, or duplicate keys fail configuration initialization.
Invalid client values return a normal field-validation error that identifies \_transforms.<key> and the failed rule.
A value that is structurally valid but unsupported for the original source MIME or resolved result MIME, as applicable, fails before storage changes or an external service call.
A saved key with no applicable executor may remain readable and may serve a stored main file when the private managed-file manifest proves that the object is reusable. If the default is dynamic or regeneration is required, the request or restore fails and identifies the unhandled key.

Unexpected transformer failures follow the existing pipeline error boundary and do not commit partial document or storage state.
Testing requirements
Write these tests before the File Transform State implementation changes.
Prove that omitted \_transforms preserves the stored object, null clears it, an object replaces it, and omission from that object removes one key.
Prove that configured custom keys appear as named optional properties without a catch-all string index signature.
Prove that persisted-default stages run before request-override stages and that unclaimed or duplicate key coverage fails before source or storage work.
Prove that original, accumulator, top-level default, and configured-size MIME values remain correct after format conversion.
Prove that private managed-file manifests distinguish stored Payload objects from logical URLs and provider-managed derivatives.
Inject nullable \_transforms into upload collections with and without configured transformers; assert type: 'json', the assembled jsonSchema, additionalProperties: false, SQL migration behavior, and MongoDB schema snapshots.
Generate every built-in key plus configured custom keys and JSDoc descriptions while GraphQL continues to expose JSON.
Reject reserved-name collisions, duplicate definition keys, malformed schemas, unknown explicit keys, and invalid semantic values.
Confirm every per-file transformer callback receives full doc and immutable originalDoc; verify later stages observe doc changes while originalDoc stays identical. Confirm MIME values, \_transforms, custom fields, transformer mimeTypes, and canTransform route persisted execution without duplicate scalar arguments.
Crop, expand, move, and remove an image crop from the retained original without pixel drift.
Register a video transformer that executes the built-in crop, clip, and encoding definitions, then validate and replay a cropped and clipped video shape.
Validate image, video, and PDF encoding-option branches against the resolved or top-level result MIME, and reject a universal compression scalar.
Confirm request-time query parameters do not mutate \_transforms, and confirm a no-query request can still select multiple transformers in order when persisted state defines the default representation.
Exercise create, update, replace, duplicate, locale switch, draft, publish, version restore, and version pruning.
Remove a configured definition and confirm old values remain readable, unrelated updates preserve them, explicit writes reject them, and regeneration fails before storage changes.
Fail transform execution after output creation and confirm compensation leaves the prior file and \_transforms unchanged.
Crop units
crop stores non-negative integer pixels in the original source's natural coordinate space and omits a unit property. This identifies the exact source rectangle, lets the editor reopen without cumulative percentage rounding, and matches the File Versioning design.
For example, a rectangle at x 10%, y 15%, width 50%, and height 40% on a 4000 by 3000 original is stored as { x: 400, y: 450, width: 2000, height: 1200 }.
The Admin UI may use normalized percentages while editing, but it converts to natural-source pixels when saving. The persisted format uses one coordinate model and does not accept mixed units.
Alternatives considered
Fixed crop group plus file-type-specific fields
This gives immediate first-class columns but requires core to predict every transform and leaves irrelevant fields on most file types. It also creates repeated schema migrations as video, PDF, audio, and custom editors grow.
Unvalidated JSON
This is flexible but gives weak type generation, unclear documentation, and no reliable protection from malformed or unsupported values.
Transformer-slug namespaces
Storing \_transforms.sharp.crop or \_transforms.videoProvider.clip ties editorial intent to an implementation. Switching transformers would require document rewrites even when the semantic operation is identical.
Transform capability array
A free-form capability array such as ['crop', 'compression'] is too coarse to describe MIME branches, accepted schemas, limits, or provider constraints and can drift from executable behavior. Transform definitions describe storable values, while mimeTypes, canTransform, transformFile, and handleRequest remain the runtime contract.
Top-level ordered operation array
An array makes arbitrary pipelines easy but permits repeated, order-dependent combinations that the current editors do not need and makes partial updates harder. Ordered operations can live inside a specific definition when the use case genuinely requires them.
Universal compression value
Rejected because image quality, video bitrate and codec policy, and PDF optimization are different schemas with different limits and effects.
Success criteria
An editor can reopen the retained original with the exact saved crop and change or remove it.
A video transformer can execute the built-in clip value without changing core database columns or the \_transforms container.
Generated types explain every built-in and configured custom key and value.
The same persisted generic operation can be executed by a different compatible transformer without rewriting document data.
original.mimeType is the stored MIME of the retained source, top-level mimeType is the known default-result MIME when stable, and \_transforms contains neither a duplicate MIME nor transformer identity.
Versions and locales restore the correct original and transform state, then resolve a valid current output through the configured pipeline; exact historical bytes are not guaranteed.
Unsupported or invalid state fails before destructive storage work.
