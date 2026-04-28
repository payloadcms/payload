import { build, type BuildFailure } from 'esbuild'

export type CheckConditionBundleabilityResult = { ok: false; reasons: string[] } | { ok: true }

export type CheckConditionBundleabilityArgs = {
  entryPoint: string
}

export async function checkConditionBundleability(
  args: CheckConditionBundleabilityArgs,
): Promise<CheckConditionBundleabilityResult> {
  try {
    await build({
      bundle: true,
      entryPoints: [args.entryPoint],
      external: [],
      format: 'esm',
      logLevel: 'silent',
      platform: 'browser',
      write: false,
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, reasons: extractReasons(err) }
  }
}

function extractReasons(err: unknown): string[] {
  if (isBuildFailure(err)) {
    return err.errors.map((e) => e.text)
  }
  return [err instanceof Error ? err.message : String(err)]
}

function isBuildFailure(err: unknown): err is BuildFailure {
  return (
    Boolean(err) &&
    typeof err === 'object' &&
    'errors' in (err as object) &&
    Array.isArray((err as { errors?: unknown }).errors)
  )
}
