import type { FieldHookArgs } from '../../config/types.js'

export const beforeDuplicate = async (args: FieldHookArgs) =>
  await args.field.hooks.beforeDuplicate.reduce(async (priorHook, currentHook) => {
    await priorHook
    return await currentHook(args)
  }, Promise.resolve())
