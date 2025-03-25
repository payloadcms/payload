// @ts-strict-ignore
import { pathToFileURL } from 'url'

export async function importHandlerPath<T>(path: string): Promise<T> {
  let runner: T
  const [runnerPath, runnerImportName] = path.split('#')

  let runnerModule
  try {
    // We need to check for `require` for compatibility with outdated frameworks that do not
    // properly support ESM, like Jest. This is not done to support projects without "type": "module" set
    runnerModule =
      typeof require === 'function'
        ? await eval(`require('${runnerPath.replaceAll('\\', '/')}')`)
        : await eval(`import('${pathToFileURL(runnerPath).href}')`)
  } catch (e) {
    throw new Error(
      `Error importing job queue handler module for path ${path}. This is an advanced feature that may require a sophisticated build pipeline, especially when using it in production or within Next.js, e.g. by calling opening the /api/payload-jobs/run endpoint. You will have to transpile the handler files separately and ensure they are available in the same location when the job is run. If you're using an endpoint to execute your jobs, it's recommended to define your handlers as functions directly in your Payload Config, or use import paths handlers outside of Next.js. Import Error: \n${e.message}`,
    )
  }

  // If the path has indicated an #exportName, try to get it
  if (runnerImportName && runnerModule[runnerImportName]) {
    runner = runnerModule[runnerImportName]
  }

  // If there is a default export, use it
  if (!runner && runnerModule.default) {
    runner = runnerModule.default
  }

  // Finally, use whatever was imported
  if (!runner) {
    runner = runnerModule
  }

  return runner
}
