import * as migration_20261101_160000_vigor_product_stones_and_sizes from './20261101_160000_vigor_product_stones_and_sizes'

export const migrations = [
  {
    up: migration_20261101_160000_vigor_product_stones_and_sizes.up,
    down: migration_20261101_160000_vigor_product_stones_and_sizes.down,
    name: '20261101_160000_vigor_product_stones_and_sizes',
  },
]
