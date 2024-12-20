import * as migration_20241220_194958_initial from './20241220_194958_initial'

export const migrations = [
  {
    up: migration_20241220_194958_initial.up,
    down: migration_20241220_194958_initial.down,
    name: '20241220_194958_initial',
  },
]
