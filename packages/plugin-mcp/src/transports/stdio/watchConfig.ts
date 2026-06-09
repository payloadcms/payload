import { watch } from 'node:fs'
import path from 'node:path'

// Watch the config file and its directory, calling onChange (debounced) on any edit.
export const watchConfig = ({
  configPath,
  onChange,
}: {
  configPath: string
  onChange: () => void
}): void => {
  let timer: NodeJS.Timeout | undefined

  const trigger = (): void => {
    clearTimeout(timer)
    timer = setTimeout(onChange, 300)
  }

  for (const target of [configPath, path.dirname(configPath)]) {
    try {
      watch(target, trigger).on('error', () => {})
    } catch {
      // Ignore targets that can't be watched on this platform.
    }
  }
}
