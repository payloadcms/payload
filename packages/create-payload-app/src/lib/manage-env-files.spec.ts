import { jest } from '@jest/globals'
import fs from 'fs'
import fse from 'fs-extra'
import * as os from 'node:os'
import path from 'path'

import type { CliArgs } from '../types.js'

import { manageEnvFiles } from './manage-env-files.js'

describe('createProject', () => {
  let projectDir: string
  let envFilePath = ''
  let envExampleFilePath = ''

  beforeAll(() => {
    // eslint-disable-next-line no-console
    console.log = jest.fn()
  })

  beforeEach(() => {
    const tempDirectory = fs.realpathSync(os.tmpdir())
    projectDir = `${tempDirectory}/${Math.random().toString(36).substring(7)}`

    envFilePath = path.join(projectDir, '.env')
    envExampleFilePath = path.join(projectDir, '.env.example')

    if (fse.existsSync(envFilePath)) {
      fse.removeSync(envFilePath)
    }

    fse.ensureDirSync(projectDir)
  })

  afterEach(() => {
    if (fse.existsSync(projectDir)) {
      fse.rmSync(projectDir, { recursive: true })
    }
  })

  it('generates .env using defaults (not from .env.example)', async () => {
    // ensure no .env.example exists so that the default values are used
    // the `manageEnvFiles` function will look for .env.example in the file system
    if (fse.existsSync(envExampleFilePath)) {
      fse.removeSync(envExampleFilePath)
    }

    await manageEnvFiles({
      cliArgs: {
        '--debug': true,
      } as CliArgs,
      databaseUri: '', // omitting this will ensure the default vars are used
      payloadSecret: '', // omitting this will ensure the default vars are used
      projectDir,
      template: undefined,
    })

    expect(fse.existsSync(envFilePath)).toBe(true)

    const updatedEnvContent = fse.readFileSync(envFilePath, 'utf-8')

    expect(updatedEnvContent).toBe(
      `# Added by Payload\nPAYLOAD_SECRET=YOUR_SECRET_HERE\nDATABASE_URI=your-connection-string-here`,
    )
  })

  it('generates .env from .env.example', async () => {
    // create or override the .env.example file with a connection string that will NOT be overridden
    fse.ensureFileSync(envExampleFilePath)
    fse.writeFileSync(
      envExampleFilePath,
      `DATABASE_URI=example-connection-string\nCUSTOM_VAR=custom-value\n`,
    )

    await manageEnvFiles({
      cliArgs: {
        '--debug': true,
      } as CliArgs,
      databaseUri: '', // omitting this will ensure the `.env.example` vars are used
      payloadSecret: '', // omitting this will ensure the `.env.example` vars are used
      projectDir,
      template: undefined,
    })

    expect(fse.existsSync(envFilePath)).toBe(true)

    const updatedEnvContent = fse.readFileSync(envFilePath, 'utf-8')

    expect(updatedEnvContent).toBe(
      `DATABASE_URI=example-connection-string\nCUSTOM_VAR=custom-value\nPAYLOAD_SECRET=YOUR_SECRET_HERE\n# Added by Payload`,
    )
  })

  it('updates existing .env without overriding vars', async () => {
    // create an existing .env file with some custom variables that should NOT be overridden
    fse.ensureFileSync(envFilePath)
    fse.writeFileSync(
      envFilePath,
      `CUSTOM_VAR=custom-value\nDATABASE_URI=example-connection-string\n`,
    )

    // create an .env.example file to ensure that its contents DO NOT override existing .env vars
    fse.ensureFileSync(envExampleFilePath)
    fse.writeFileSync(
      envExampleFilePath,
      `CUSTOM_VAR=custom-value-2\nDATABASE_URI=example-connection-string-2\n`,
    )

    await manageEnvFiles({
      cliArgs: {
        '--debug': true,
      } as CliArgs,
      databaseUri: '', // omitting this will ensure the `.env` vars are kept
      payloadSecret: '', // omitting this will ensure the `.env` vars are kept
      projectDir,
      template: undefined,
    })

    expect(fse.existsSync(envFilePath)).toBe(true)

    const updatedEnvContent = fse.readFileSync(envFilePath, 'utf-8')

    expect(updatedEnvContent).toBe(
      `# Added by Payload\nPAYLOAD_SECRET=YOUR_SECRET_HERE\nDATABASE_URI=example-connection-string\nCUSTOM_VAR=custom-value`,
    )
  })

  it('sanitizes .env based on selected database type', async () => {
    await manageEnvFiles({
      cliArgs: {
        '--debug': true,
      } as CliArgs,
      databaseType: 'mongodb', // this mimics the CLI selection and will be used as the DATABASE_URI
      databaseUri: 'mongodb://localhost:27017/test', // this mimics the CLI selection and will be used as the DATABASE_URI
      payloadSecret: 'test-secret', // this mimics the CLI selection and will be used as the PAYLOAD_SECRET
      projectDir,
      template: undefined,
    })

    const updatedEnvContent = fse.readFileSync(envFilePath, 'utf-8')

    expect(updatedEnvContent).toBe(
      `# Added by Payload\nPAYLOAD_SECRET=test-secret\nDATABASE_URI=mongodb://localhost:27017/test`,
    )

    // delete the generated .env file and do it again, but this time, omit the databaseUri to ensure the default is generated
    fse.removeSync(envFilePath)

    await manageEnvFiles({
      cliArgs: {
        '--debug': true,
      } as CliArgs,
      databaseType: 'mongodb', // this mimics the CLI selection and will be used as the DATABASE_URI
      databaseUri: '', // omit this to ensure the default is generated based on the selected database type
      payloadSecret: 'test-secret',
      projectDir,
      template: undefined,
    })

    const updatedEnvContentWithDefault = fse.readFileSync(envFilePath, 'utf-8')
    expect(updatedEnvContentWithDefault).toBe(
      `# Added by Payload\nPAYLOAD_SECRET=test-secret\nDATABASE_URI=mongodb://127.0.0.1/your-database-name`,
    )
  })
})
