import type { PostgresAdapterArgs, PostgresOperatorHandler } from '@payloadcms/db-postgres'
import type { VercelPostgresAdapterArgs } from '@payloadcms/db-vercel-postgres'
import type {
  DrizzleOperandTransformHandler,
  DrizzleOperatorHandler,
  DrizzleOperatorHandlerContext,
  DrizzleResolvedOperator,
  RequireDrizzleKit,
} from '@payloadcms/drizzle'
import type { up as upgradePostgresSnapshot } from 'drizzle-kit/payload/postgres'
import type { up as upgradeSQLiteSnapshot } from 'drizzle-kit/payload/sqlite'

import {
  postgresAdapter,
  postgresUnaccent as postgresUnaccentFromDbPostgres,
} from '@payloadcms/db-postgres'
import {
  postgresUnaccent as postgresUnaccentFromDbVercelPostgres,
  vercelPostgresAdapter,
} from '@payloadcms/db-vercel-postgres'
import { describe, expect, test } from 'tstyche'

describe('postgres operator handlers - type tests', () => {
  test('postgresAdapter accepts query.operatorHandlers in its Args', () => {
    expect(postgresAdapter).type.toBeCallableWith({
      pool: { connectionString: 'postgres://localhost/test' },
      query: { operatorHandlers: [postgresUnaccentFromDbPostgres()] },
    })
  })

  test('vercelPostgresAdapter accepts query.operatorHandlers in its Args', () => {
    expect(vercelPostgresAdapter).type.toBeCallableWith({
      pool: { connectionString: 'postgres://localhost/test' },
      query: { operatorHandlers: [postgresUnaccentFromDbVercelPostgres()] },
    })
  })

  test('PostgresAdapterArgs and VercelPostgresAdapterArgs both expose a query.operatorHandlers option', () => {
    expect<NonNullable<PostgresAdapterArgs['query']>['operatorHandlers']>().type.toBe<
      PostgresOperatorHandler[] | undefined
    >()
    expect<NonNullable<VercelPostgresAdapterArgs['query']>['operatorHandlers']>().type.toBe<
      PostgresOperatorHandler[] | undefined
    >()
  })

  test('both packages export a callable postgresUnaccent() returning a PostgresOperatorHandler', () => {
    expect(postgresUnaccentFromDbPostgres()).type.toBeAssignableTo<PostgresOperatorHandler>()
    expect(postgresUnaccentFromDbVercelPostgres()).type.toBeAssignableTo<PostgresOperatorHandler>()
  })

  test("a transformOperands callback's context is typed as DrizzleOperatorHandlerContext, with resolvedOperator narrowed to the exact union", () => {
    const handler: DrizzleOperandTransformHandler = {
      name: 'spot-check',
      operators: ['contains'],
      transformOperands: (context) => {
        expect(context).type.toBe<DrizzleOperatorHandlerContext>()
        expect<typeof context.resolvedOperator>().type.not.toBe<string>()
        expect<typeof context.resolvedOperator>().type.toBe<DrizzleResolvedOperator>()

        return { column: context.column, value: context.value }
      },
    }

    expect(handler).type.toBeAssignableTo<DrizzleOperandTransformHandler>()
  })

  test('a handler cannot declare both build and transformOperands', () => {
    type ConflictingHandler = {
      build: (context: DrizzleOperatorHandlerContext) => unknown
      name: string
      operators: DrizzleResolvedOperator[]
      transformOperands: (context: DrizzleOperatorHandlerContext) => {
        column: unknown
        value: unknown
      }
    }

    expect<DrizzleOperatorHandler>().type.not.toBeAssignableFrom<ConflictingHandler>()

    expect(postgresAdapter).type.not.toBeCallableWith({
      pool: { connectionString: 'postgres://localhost/test' },
      query: {
        operatorHandlers: [
          {
            name: 'conflicting',
            operators: ['contains'],
            build: (context: DrizzleOperatorHandlerContext) => context.column,
            transformOperands: (context: DrizzleOperatorHandlerContext) => ({
              column: context.column,
              value: context.value,
            }),
          },
        ],
      },
    })
  })

  test("a handler's operators array rejects an unknown operator name", () => {
    type UnknownOperatorHandler = {
      name: string
      operators: ['not_a_real_operator']
      transformOperands: (
        context: DrizzleOperatorHandlerContext,
      ) => Pick<DrizzleOperatorHandlerContext, 'column' | 'value'>
    }

    expect<DrizzleOperatorHandler>().type.not.toBeAssignableFrom<UnknownOperatorHandler>()
  })

  test("a handler's operators array accepts every resolved operator, including not_equals", () => {
    type FullySupportedHandler = {
      name: string
      operators: ['contains', 'like', 'not_equals', 'not_like']
      transformOperands: (
        context: DrizzleOperatorHandlerContext,
      ) => Pick<DrizzleOperatorHandlerContext, 'column' | 'value'>
    }

    expect<DrizzleOperatorHandler>().type.toBeAssignableFrom<FullySupportedHandler>()
  })
})

describe('Drizzle snapshot contracts', () => {
  type Snapshot = Awaited<ReturnType<ReturnType<RequireDrizzleKit>['generateDrizzleJson']>>

  test('should expose snapshot metadata and keep unmodelled fields unknown', () => {
    expect<Snapshot['version']>().type.toBe<string>()
    expect<Snapshot['id']>().type.toBe<string>()
    expect<Snapshot['dialect']>().type.toBe<'postgres' | 'postgresql' | 'sqlite'>()
    expect<Snapshot['unmodelledField']>().type.toBe<unknown>()
    expect<Snapshot>().type.not.toBeAssignableFrom<{ version: string }>()
  })

  test('should accept legacy PostgreSQL table-map snapshots', () => {
    const legacy = {
      id: '00000000-0000-0000-0000-000000000001',
      dialect: 'postgresql' as const,
      prevId: '00000000-0000-0000-0000-000000000000',
      tables: {},
      version: '7',
    }

    expect(legacy).type.toBeAssignableTo<Snapshot>()
  })

  test('should accept SQLite upgrade results and reject PostgreSQL result envelopes as snapshots', () => {
    type SQLiteUpgradeResult = ReturnType<typeof upgradeSQLiteSnapshot>
    type PostgresUpgradeResult = ReturnType<typeof upgradePostgresSnapshot>

    expect<SQLiteUpgradeResult>().type.toBeAssignableTo<Snapshot>()
    expect<PostgresUpgradeResult['snapshot']>().type.toBeAssignableTo<Snapshot>()
    expect<PostgresUpgradeResult>().type.not.toBeAssignableTo<Snapshot>()
  })
})
