import * as migration_20250102_042603_initial from './20250102_042603_initial'

export const migrations = [
  {
    up: migration_20250102_042603_initial.up,
    down: migration_20250102_042603_initial.down,
    name: '20250102_042603_initial',
  },
]
