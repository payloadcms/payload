import fs from 'fs'
import fse from 'fs-extra'
import * as os from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import type { DbDetails } from '../types.js'

import { configureDockerCompose, updateDockerCompose } from './configure-docker-compose.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const templatesDir = path.resolve(dirname, '../../../../templates')

const readTemplateCompose = (templateName: string) =>
  fs.readFileSync(path.join(templatesDir, templateName, 'docker-compose.yml'), 'utf8')

type Compose = {
  services: Record<string, Record<string, unknown>>
  volumes?: Record<string, null>
}

const update = (dbDetails: DbDetails, templateName = 'blank') => {
  const output = updateDockerCompose({ dbDetails, template: readTemplateCompose(templateName) })
  return { compose: parse(output) as Compose, output }
}

describe('updateDockerCompose', () => {
  it('keeps the payload service of the template', () => {
    const template = parse(readTemplateCompose('website')) as Compose
    const { compose } = update({ type: 'sqlite', dbUri: 'file:./my-app.db' }, 'website')

    const { depends_on: _, ...templatePayload } = template.services.payload!
    expect(compose.services.payload).toStrictEqual(templatePayload)
  })

  it('adds a mongo service for a local MongoDB', () => {
    const { compose } = update({ type: 'mongodb', dbUri: 'mongodb://127.0.0.1/my-app' })

    expect(Object.keys(compose.services)).toStrictEqual(['payload', 'mongo'])
    expect(compose.services.mongo?.ports).toStrictEqual(['27017:27017'])
    expect(compose.services.payload?.depends_on).toStrictEqual(['mongo'])
    expect(compose.services.payload?.environment).toStrictEqual({
      DATABASE_URL: 'mongodb://mongo:27017/my-app',
    })
    expect(Object.keys(compose.volumes ?? {})).toStrictEqual(['node_modules', 'data'])
  })

  it('replaces the mongo service with a postgres service for a local Postgres', () => {
    const { compose } = update({
      type: 'postgres',
      dbUri: 'postgres://postgres:<password>@127.0.0.1:54320/my-app?sslmode=disable',
    })

    expect(Object.keys(compose.services)).toStrictEqual(['payload', 'postgres'])
    expect(compose.services.postgres?.ports).toStrictEqual(['54320:5432'])
    expect(compose.services.postgres?.environment).toMatchObject({
      POSTGRES_DB: 'my-app',
      POSTGRES_USER: 'postgres',
    })
    expect(compose.services.payload?.depends_on).toStrictEqual(['postgres'])
    expect(compose.services.payload?.environment).toStrictEqual({
      DATABASE_URL: 'postgres://postgres:<password>@postgres:5432/my-app?sslmode=disable',
    })
    expect(Object.keys(compose.volumes ?? {})).toStrictEqual(['node_modules', 'pgdata'])
  })

  it('uses POSTGRES_URL for Vercel Postgres', () => {
    const { compose } = update({
      type: 'vercel-postgres',
      dbUri: 'postgres://postgres@localhost:5432/my-app',
    })

    expect(compose.services.postgres).toBeDefined()
    expect(compose.services.payload?.environment).toStrictEqual({
      POSTGRES_URL: 'postgres://postgres@postgres:5432/my-app',
    })
  })

  it('replaces the postgres service of a Postgres template with a mongo service', () => {
    const { compose } = update(
      { type: 'mongodb', dbUri: 'mongodb://127.0.0.1/my-app' },
      'with-postgres',
    )

    expect(Object.keys(compose.services)).toStrictEqual(['payload', 'mongo'])
    expect(compose.services.payload?.depends_on).toStrictEqual(['mongo'])
    expect(Object.keys(compose.volumes ?? {})).toStrictEqual(['node_modules', 'data'])
  })

  it('has no database service for SQLite', () => {
    const { compose } = update({ type: 'sqlite', dbUri: 'file:./my-app.db' })

    expect(Object.keys(compose.services)).toStrictEqual(['payload'])
    expect(compose.services.payload?.depends_on).toBeUndefined()
    expect(compose.services.payload?.environment).toBeUndefined()
    expect(Object.keys(compose.volumes ?? {})).toStrictEqual(['node_modules'])
  })

  it('has no database service for a remote database', () => {
    const { compose } = update({
      type: 'mongodb',
      dbUri: 'mongodb+srv://user:pass@cluster0.example.net/my-app',
    })

    expect(Object.keys(compose.services)).toStrictEqual(['payload'])
    expect(compose.services.payload?.environment).toBeUndefined()
  })

  it('removes comments about switching databases', () => {
    const { output } = update({ type: 'postgres', dbUri: 'postgres://127.0.0.1:5432/my-app' })

    expect(output).not.toContain('Uncomment')
    expect(output).not.toContain('# - ')
    expect(output).not.toContain('# pgdata')
    expect(output).not.toMatch(/^\s+$/m)
  })

  it('keeps long commands on one line', () => {
    const template = readTemplateCompose('blank')
    const { output } = update({ type: 'sqlite', dbUri: 'file:./my-app.db' })

    expect(output).toContain(template.match(/^ {4}command: .*$/m)?.[0])
  })
})

describe('configureDockerCompose', () => {
  let projectDir: string
  let composePath: string

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'cpa-docker-compose-'))
    composePath = path.join(projectDir, 'docker-compose.yml')
  })

  afterEach(() => {
    fse.removeSync(projectDir)
  })

  it('updates the docker-compose.yml of the template', async () => {
    fse.writeFileSync(composePath, readTemplateCompose('website'))

    await configureDockerCompose({
      dbDetails: { type: 'sqlite', dbUri: 'file:./my-app.db' },
      projectDir,
    })

    expect(fse.readFileSync(composePath, 'utf8')).not.toContain('mongo')
  })

  it('removes docker-compose.yml for Cloudflare D1', async () => {
    fse.writeFileSync(composePath, readTemplateCompose('blank'))

    await configureDockerCompose({ dbDetails: { type: 'd1-sqlite' }, projectDir })

    expect(fse.existsSync(composePath)).toBe(false)
  })

  it('does nothing when the template has no docker-compose.yml', async () => {
    await configureDockerCompose({
      dbDetails: { type: 'postgres', dbUri: 'postgres://127.0.0.1:5432/my-app' },
      projectDir,
    })

    expect(fse.existsSync(composePath)).toBe(false)
  })
})
