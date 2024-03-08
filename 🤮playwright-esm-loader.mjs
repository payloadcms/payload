import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const endsWith = ['scss', 'svg', 'png']

export async function resolve(specifier, context, next) {
  // Continue as usual if the format is not scss, svg, or png.
  if (!specifier || !endsWith.some((e) => specifier.endsWith(e))) {
    return await next(specifier, context, next)
  }

  // If the format is scss, svg, or png, load the file as scss
  const nextResult = await next(specifier, context, next)
  return {
    format: 'scss',
    shortCircuit: true,
    url: nextResult.url,
  }
}

export async function load(url, context, next) {
  // Continue as usual if the format is not scss, svg, or png.
  if (!context?.format || !endsWith.some((e) => context.format === e)) {
    return next(url, context, next)
  }

  // If the format is scss, svg, or png, load the file as JSON
  const rawSource = '' + (await fs.readFile(fileURLToPath(url)))

  return {
    format: 'json',
    shortCircuit: true,
    source: JSON.stringify(rawSource),
  }
}
