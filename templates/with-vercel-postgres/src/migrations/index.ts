import * as migration_20251106_231353_initial from './20251106_231353_initial'

export const migrations = [
  {
    up: migration_20251106_231353_initial.up,
    down: migration_20251106_231353_initial.down,
    name: '20251106_231353_initial',
  },
]
