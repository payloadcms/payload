import type {
  CollectionTool,
  CollectionToolInput,
  GlobalTool,
  GlobalToolInput,
  Prompt,
  Tool,
  ToolInputSchema,
} from './types.js'

/**
 * Helper functions that allow us to type the input argument based on the input schema, if a tool
 * like zod / valibot is used.
 */

export const defineTool = <TSchema extends ToolInputSchema | undefined = undefined>(
  args: Tool<TSchema>,
): Tool => args as unknown as Tool

export const defineCollectionTool = <TSchema extends CollectionToolInput | undefined = undefined>(
  args: CollectionTool<TSchema>,
): CollectionTool => args as unknown as CollectionTool

export const defineGlobalTool = <TSchema extends GlobalToolInput | undefined = undefined>(
  args: GlobalTool<TSchema>,
): GlobalTool => args as unknown as GlobalTool

export const definePrompt = <TSchema extends ToolInputSchema>(args: Prompt<TSchema>): Prompt =>
  args as unknown as Prompt
