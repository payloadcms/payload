import type { MaybePromise } from 'payload'

import type {
  CollectionTool,
  CollectionToolHandlerArgs,
  GlobalTool,
  GlobalToolHandlerArgs,
  MCPToolResponse,
  Prompt,
  PromptHandlerArgs,
  Tool,
  ToolHandlerArgs,
  ToolInputSchema,
} from './types.js'

/**
 * Identity helpers that exist solely so TypeScript infers `TSchema` from `input` (or
 * `argsSchema` for prompts) and then types the handler's `input` against it.
 *
 * The `NoInfer<>` wrapper on the handler's args is what makes this work in a single
 * call: it tells TS not to use the handler signature when inferring `TSchema`, so
 * inference is driven solely by the schema field.
 */

export const defineTool = <TSchema extends ToolInputSchema | undefined = undefined>(
  tool: {
    handler: (args: ToolHandlerArgs<NoInfer<TSchema>>) => MaybePromise<MCPToolResponse>
  } & Omit<Tool<TSchema>, 'handler'>,
): Tool => tool as unknown as Tool

export const defineCollectionTool = <TSchema extends ToolInputSchema | undefined = undefined>(
  tool: {
    handler: (args: CollectionToolHandlerArgs<NoInfer<TSchema>>) => MaybePromise<MCPToolResponse>
  } & Omit<CollectionTool<TSchema>, 'handler'>,
): CollectionTool => tool as unknown as CollectionTool

export const defineGlobalTool = <TSchema extends ToolInputSchema | undefined = undefined>(
  tool: {
    handler: (args: GlobalToolHandlerArgs<NoInfer<TSchema>>) => MaybePromise<MCPToolResponse>
  } & Omit<GlobalTool<TSchema>, 'handler'>,
): GlobalTool => tool as unknown as GlobalTool

export const definePrompt = <TSchema extends ToolInputSchema = ToolInputSchema>(
  prompt: {
    handler: (args: PromptHandlerArgs<NoInfer<TSchema>>) => ReturnType<Prompt<TSchema>['handler']>
  } & Omit<Prompt<TSchema>, 'handler'>,
): Prompt => prompt as unknown as Prompt
