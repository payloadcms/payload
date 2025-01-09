import * as p from '@clack/prompts'
import slugify from '@sindresorhus/slugify'

import type { CliArgs, DbDetails, DbType } from '../types.js'

type DbChoice = {
  dbConnectionPrefix: `${string}/`
  dbConnectionSuffix?: string
  title: string
  value: DbType
}

export const dbChoiceRecord: Record<DbType, DbChoice> = {
  mongodb: {
    dbConnectionPrefix: 'mongodb://127.0.0.1/',
    title: 'MongoDB',
    value: 'mongodb',
  },
  postgres: {
    dbConnectionPrefix: 'postgres://postgres:<password>@127.0.0.1:5432/',
    title: 'PostgreSQL',
    value: 'postgres',
  },
  sqlite: {
    dbConnectionPrefix: 'file:./',
    dbConnectionSuffix: '.db',
    title: 'SQLite',
    value: 'sqlite',
  },
  'vercel-postgres': {
    dbConnectionPrefix: 'postgres://postgres:<password>@127.0.0.1:5432/',
    title: 'Vercel Postgres',
    value: 'vercel-postgres',
  },
}

export async function selectDb(args: CliArgs, projectName: string): Promise<DbDetails> {
  let dbType: DbType | symbol | undefined = undefined
  if (args['--db']) {
    if (!Object.values(dbChoiceRecord).some((dbChoice) => dbChoice.value === args['--db'])) {
      throw new Error(
        `Invalid database type given. Valid types are: ${Object.values(dbChoiceRecord)
          .map((dbChoice) => dbChoice.value)
          .join(', ')}`,
      )
    }
    dbType = args['--db'] as DbType
  } else {
    dbType = await p.select<{ label: string; value: DbType }[], DbType>({
      initialValue: 'mongodb',
      message: `Select a database`,
      options: Object.values(dbChoiceRecord).map((dbChoice) => ({
        label: dbChoice.title,
        value: dbChoice.value,
      })),
    })
    if (p.isCancel(dbType)) {
      process.exit(0)
    }
  }

  const dbChoice = dbChoiceRecord[dbType]

  let dbUri: string | symbol | undefined = undefined
  const initialDbUri = `${dbChoice.dbConnectionPrefix}${
    projectName === '.' ? `payload-${getRandomDigitSuffix()}` : slugify(projectName)
  }${dbChoice.dbConnectionSuffix || ''}`

  if (args['--db-accept-recommended']) {
    dbUri = initialDbUri
  } else if (args['--db-connection-string']) {
    dbUri = args['--db-connection-string']
  } else {
    dbUri = await p.text({
      initialValue: initialDbUri,
      message: `Enter ${dbChoice.title.split(' ')[0]} connection string`, // strip beta from title
    })
    if (p.isCancel(dbUri)) {
      process.exit(0)
    }
  }

  return {
    type: dbChoice.value,
    dbUri,
  }
}

function getRandomDigitSuffix(): string {
  return (Math.random() * Math.pow(10, 6)).toFixed(0)
}
