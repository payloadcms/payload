import type { Slugify } from 'payload/shared';
import { type ServerFunction, type SlugifyServerFunctionArgs } from 'payload';
/**
 * This server function is directly related to the {@link https://payloadcms.com/docs/fields/text#slug-field | Slug Field}.
 * This is a server function that is used to invoke the user's custom slugify function from the client.
 * This pattern is required, as there is no other way for us to pass their function across the client-server boundary.
 *   - Not through props
 *   - Not from a server function defined within a server component (see below)
 * When a server function contains non-serializable data within its closure, it gets passed through the boundary (and breaks).
 * The only way to pass server functions to the client (that contain non-serializable data) is if it is globally defined.
 * But we also cannot define this function alongside the server component, as we will not have access to their custom slugify function.
 * See `ServerFunctionsProvider` for more details.
 */
export declare const slugifyHandler: ServerFunction<SlugifyServerFunctionArgs, Promise<ReturnType<Slugify>>>;
//# sourceMappingURL=slugify.d.ts.map