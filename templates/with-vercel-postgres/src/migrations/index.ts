import * as migration_20250725_134227_initial from './20250725_134227_initial'

export const migrations = [
  {
    up: migration_20250725_134227_initial.up,
    down: migration_20250725_134227_initial.down,
    name: '20250725_134227_initial',
  },
]
