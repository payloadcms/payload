import type { CollectionTool, GlobalTool, Prompt, Tool, ToolInputSchema } from './types.js'

/**
 * Two-stage builder: pass the schema/metadata first, then chain `.handler(fn)`. Splitting the
 * call lets TypeScript resolve `TSchema` from `input` (call 1) before contextually typing the
 * handler (call 2). A single-call API hit a TS limitation where property order in the literal
 * decided whether `TSchema` was inferred or pinned to its default.
 *
 *     defineCollectionTool({ description, input })
 *       .handler(({ input }) => …)   // ← input is fully typed here regardless of order
 *
 * Config and handler signatures are derived from `Tool` / `CollectionTool` / `GlobalTool` /
 * `Prompt` via `Omit` + indexed access so there's no duplication with `types.ts`.
 */

export const defineTool = <
  TSchema extends ToolInputSchema | undefined = ToolInputSchema | undefined,
>(
  args: Omit<Tool<TSchema>, 'handler'>,
): { handler: (fn: Tool<TSchema>['handler']) => Tool } => ({
  handler: (fn) => ({ ...args, handler: fn }) as unknown as Tool,
})

export const defineCollectionTool = <
  TSchema extends ToolInputSchema | undefined = ToolInputSchema | undefined,
>(
  args: Omit<CollectionTool<TSchema>, 'handler'>,
): { handler: (fn: CollectionTool<TSchema>['handler']) => CollectionTool } => ({
  handler: (fn) => ({ ...args, handler: fn }) as unknown as CollectionTool,
})

export const defineGlobalTool = <
  TSchema extends ToolInputSchema | undefined = ToolInputSchema | undefined,
>(
  args: Omit<GlobalTool<TSchema>, 'handler'>,
): { handler: (fn: GlobalTool<TSchema>['handler']) => GlobalTool } => ({
  handler: (fn) => ({ ...args, handler: fn }) as unknown as GlobalTool,
})

export const definePrompt = <TSchema extends ToolInputSchema = ToolInputSchema>(
  args: Omit<Prompt<TSchema>, 'handler'>,
): { handler: (fn: Prompt<TSchema>['handler']) => Prompt } => ({
  handler: (fn) => ({ ...args, handler: fn }) as unknown as Prompt,
})
