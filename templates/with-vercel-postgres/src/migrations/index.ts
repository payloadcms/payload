import * as migration_20241117_173358_initial from './20241117_173358_initial'

export const migrations = [
  {
    up: migration_20241117_173358_initial.up,
    down: migration_20241117_173358_initial.down,
    name: '20241117_173358_initial',
  },
]
