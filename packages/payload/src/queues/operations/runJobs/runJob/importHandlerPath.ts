import { pathToFileURL } from 'url'

export async function importHandlerPath<T>(path: string): Promise<T> {
  let runner: T
  const [runnerPath, runnerImportName] = path.split('#')

  let runnerModule
  try {
    runnerModule = await eval(`import('${pathToFileURL(runnerPath).href}')`)
  } catch (e) {
    throw new Error(
      `Error importing job queue handler module. If you're running jobs within Next.js, the handlers need to be defined explicitly and cannot be import paths. Path: ${path}. Import Error: \n${e.message}`,
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
