import * as migration_20251215_201732_initial from './20251215_201732_initial'

export const migrations = [
  {
    up: migration_20251215_201732_initial.up,
    down: migration_20251215_201732_initial.down,
    name: '20251215_201732_initial',
  },
]
