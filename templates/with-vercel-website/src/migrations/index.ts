import * as migration_20250108_025753_initial from './20250108_025753_initial'

export const migrations = [
  {
    up: migration_20250108_025753_initial.up,
    down: migration_20250108_025753_initial.down,
    name: '20250108_025753_initial',
  },
]
