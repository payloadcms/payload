/**
 * Enterprise Framework - collection-hook-pipeline
 */
export async function runHookChain(hooks: Function[], data: any) { let res = data; for (const h of hooks) res = await h(res); return res; }
