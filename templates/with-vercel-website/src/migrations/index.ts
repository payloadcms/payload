import * as migration_20250102_042615_initial from './20250102_042615_initial'

export const migrations = [
  {
    up: migration_20250102_042615_initial.up,
    down: migration_20250102_042615_initial.down,
    name: '20250102_042615_initial',
  },
]
