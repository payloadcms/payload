import prompts from 'prompts'
import slugify from '@sindresorhus/slugify'
import type { CliArgs, DbDetails, DbType } from '../types'

type DbChoice = {
  value: DbType
  title: string
  dbConnectionPrefix: `${string}/`
}

const dbChoiceRecord: Record<DbType, DbChoice> = {
  mongodb: {
    value: 'mongodb',
    title: 'MongoDB',
    dbConnectionPrefix: 'mongodb://127.0.0.1/',
  },
  postgres: {
    value: 'postgres',
    title: 'PostgreSQL (beta)',
    dbConnectionPrefix: 'postgres://127.0.0.1:5432/',
  },
}

export async function selectDb(
  args: CliArgs,
  projectName: string,
): Promise<DbDetails> {
  let dbType: DbType | undefined = undefined
  if (args['--db']) {
    if (
      !Object.values(dbChoiceRecord).some(
        dbChoice => dbChoice.value === args['--db'],
      )
    ) {
      throw new Error(
        `Invalid database type given. Valid types are: ${Object.values(
          dbChoiceRecord,
        )
          .map(dbChoice => dbChoice.value)
          .join(', ')}`,
      )
    }
    dbType = args['--db'] as DbType
  } else {
    const dbTypeRes = await prompts(
      {
        type: 'select',
        name: 'value',
        message: 'Select a database',
        choices: Object.values(dbChoiceRecord).map(dbChoice => {
          return {
            title: dbChoice.title,
            value: dbChoice.value,
          }
        }),
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

  const dbChoice = dbChoiceRecord[dbType as DbType]

  const dbUriRes = await prompts(
    {
      type: 'text',
      name: 'value',
      message: `Enter ${dbChoice.title} connection string`,
      initial: `${dbChoice.dbConnectionPrefix}${
        projectName === '.'
          ? `payload-${getRandomDigitSuffix()}`
          : slugify(projectName)
      }`,
      validate: (value: string) => !!value.length,
    },
    {
      onCancel: () => {
        process.exit(0)
      },
    },
  )

  return {
    type: dbChoice.value,
    dbUri: dbUriRes.value,
  }
}

function getRandomDigitSuffix(): string {
  return (Math.random() * Math.pow(10, 6)).toFixed(0)
}
