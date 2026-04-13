import * as p from '@clack/prompts'
import slugify from '@sindresorhus/slugify'

import type { CliArgs, DbDetails, DbType, ProjectTemplate } from '../types.js'

type DbChoice = {
  dbConnectionPrefix?: `${string}/`
  dbConnectionSuffix?: string
  title: string
  value: DbType
}

export const dbChoiceRecord: Record<DbType, DbChoice> = {
  'd1-sqlite': {
    title: 'Cloudflare D1 SQlite',
    value: 'd1-sqlite',
  },
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

export async function selectDb(
  args: CliArgs,
  projectName: string,
  template?: ProjectTemplate,
): Promise<DbDetails> {
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
  } else if (template?.dbType) {
    // If the template has a pre-defined database type, use that
    dbType = template.dbType
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
    // D1 Sqlite does not use a connection string so skip this prompt for this database
  } else if (dbType !== 'd1-sqlite') {
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
