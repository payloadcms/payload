import slugify from '@sindresorhus/slugify'
import prompts from 'prompts'

import type { CliArgs, DbDetails, DbType } from '../types.js'

type DbChoice = {
  dbConnectionPrefix: `${string}/`
  title: string
  value: DbType
}

const dbChoiceRecord: Record<DbType, DbChoice> = {
  mongodb: {
    dbConnectionPrefix: 'mongodb://127.0.0.1/',
    title: 'MongoDB',
    value: 'mongodb',
  },
  postgres: {
    dbConnectionPrefix: 'postgres://127.0.0.1:5432/',
    title: 'PostgreSQL (beta)',
    value: 'postgres',
  },
}

export async function selectDb(args: CliArgs, projectName: string): Promise<DbDetails> {
  let dbType: DbType | undefined = undefined
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
    const dbTypeRes = await prompts(
      {
        name: 'value',
        type: 'select',
        choices: Object.values(dbChoiceRecord).map((dbChoice) => {
          return {
            title: dbChoice.title,
            value: dbChoice.value,
          }
        }),
        message: 'Select a database',
        validate: (value: string) => !!value.length,
      },
      {
        onCancel: () => {
          process.exit(0)
        },
      },
    )
    dbType = dbTypeRes.value
  }

  const dbChoice = dbChoiceRecord[dbType]

  let dbUri: string | undefined = undefined
  const initialDbUri = `${dbChoice.dbConnectionPrefix}${
    projectName === '.' ? `payload-${getRandomDigitSuffix()}` : slugify(projectName)
  }`

  if (args['--db-accept-recommended']) {
    dbUri = initialDbUri
  } else if (args['--db-connection-string']) {
    dbUri = args['--db-connection-string']
  } else {
    const dbUriRes = await prompts(
      {
        name: 'value',
        type: 'text',
        initial: initialDbUri,
        message: `Enter ${dbChoice.title.split(' ')[0]} connection string`, // strip beta from title
        validate: (value: string) => !!value.length,
      },
      {
        onCancel: () => {
          process.exit(0)
        },
      },
    )
    dbUri = dbUriRes.value
  }

  return {
    type: dbChoice.value,
    dbUri,
  }
}

function getRandomDigitSuffix(): string {
  return (Math.random() * Math.pow(10, 6)).toFixed(0)
}
