import * as migration_20260113_212735_initial from './20260113_212735_initial'

export const migrations = [
  {
    up: migration_20260113_212735_initial.up,
    down: migration_20260113_212735_initial.down,
    name: '20260113_212735_initial',
  },
]
