import * as migration_20251106_203708_initial from './20251106_203708_initial'

export const migrations = [
  {
    up: migration_20251106_203708_initial.up,
    down: migration_20251106_203708_initial.down,
    name: '20251106_203708_initial',
  },
]
