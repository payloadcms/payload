// Uses custom one instead of geometry() from drizzle-orm/pg-core because it's broken on pushDevSchema
// Why?
// It tries to give us a prompt "you're about to change.. from geometry(Point) to geometry(point)"
import { customType } from 'drizzle-orm/pg-core'
import { parseEWKB } from 'drizzle-orm/pg-core/columns/postgis_extension/utils'

type Point = [number, number]

export const geometryColumn = (name: string) =>
  customType<{ data: Point; driverData: string }>({
    dataType() {
      return `geometry(Point)`
    },
    fromDriver(value: string) {
      return parseEWKB(value)
    },
    toDriver(value: Point) {
      return `SRID=4326;point(${value[0]} ${value[1]})`
    },
  })(name)
