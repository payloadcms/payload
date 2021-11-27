import { PayloadRequest } from '../express/types';
import { Operation } from '../types';
import { HookName, FieldAffectingData, FieldHook } from './config/types';

type Arguments = {
  data: Record<string, unknown>
  field: FieldAffectingData
  hook: HookName
  req: PayloadRequest
  operation: Operation
  fullOriginalDoc: Record<string, unknown>
  fullData: Record<string, unknown>
  flattenLocales: boolean
  isRevision: boolean
}

type ExecuteHookArguments = {
  currentHook: FieldHook
  value: unknown
} & Arguments;

const executeHook = async ({
  currentHook,
  fullOriginalDoc,
  fullData,
  operation,
  req,
  value,
}: ExecuteHookArguments) => {
  let hookedValue = await currentHook({
    value,
    originalDoc: fullOriginalDoc,
    data: fullData,
    operation,
    req,
  });

  if (typeof hookedValue === 'undefined') {
    hookedValue = value;
  }

  return hookedValue;
};

const hookPromise = async (args: Arguments): Promise<void> => {
  const {
    field,
    hook,
    req,
    flattenLocales,
    data,
  } = args;

  if (field.hooks && field.hooks[hook]) {
    await field.hooks[hook].reduce(async (priorHook, currentHook) => {
      await priorHook;

      const shouldRunHookOnAllLocales = hook === 'afterRead'
        && field.localized
        && (req.locale === 'all' || !flattenLocales)
        && typeof data[field.name] === 'object';

      if (shouldRunHookOnAllLocales) {
        const hookPromises = Object.entries(data[field.name]).map(([locale, value]) => (async () => {
          const hookedValue = await executeHook({
            ...args,
            currentHook,
            value,
          });

          if (hookedValue !== undefined) {
            data[field.name][locale] = hookedValue;
          }
        })());

        await Promise.all(hookPromises);
      } else {
        const hookedValue = await executeHook({
          ...args,
          value: data[field.name],
          currentHook,
        });

        if (hookedValue !== undefined) {
          data[field.name] = hookedValue;
        }
      }
    }, Promise.resolve());
  }
};

export default hookPromise;
