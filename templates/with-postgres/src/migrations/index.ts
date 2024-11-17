import * as migration_20241117_173403_initial from './20241117_173403_initial'

export const migrations = [
  {
    up: migration_20241117_173403_initial.up,
    down: migration_20241117_173403_initial.down,
    name: '20241117_173403_initial',
  },
]
