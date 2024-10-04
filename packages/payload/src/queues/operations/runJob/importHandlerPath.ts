import { pathToFileURL } from 'url'

export async function importHandlerPath<T>(path: string): Promise<T> {
  let runner: T
  const [runnerPath, runnerImportName] = path.split('#')

  const runnerModule =
    typeof require === 'function'
      ? await eval(`require('${runnerPath.replaceAll('\\', '/')}')`)
      : await eval(`import('${pathToFileURL(runnerPath).href}')`)

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
