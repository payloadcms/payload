import * as migration_20250411_173015_initial from './20250411_173015_initial'

export const migrations = [
  {
    up: migration_20250411_173015_initial.up,
    down: migration_20250411_173015_initial.down,
    name: '20250411_173015_initial',
  },
]
