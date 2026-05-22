import { describe, expect, it } from 'vitest'

import { evaluateAssertions } from './evaluate.js'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Minimal Payload config wrapper. Inlines source inside buildConfig({ ... }). */
function wrap(body: string): string {
  return `
    import { buildConfig } from 'payload'
    export default buildConfig({
      db: postgresAdapter({ url: 'postgres://localhost/test' }),
      secret: 'test',
      ${body}
    })
  `
}

/** Wraps source that already contains a complete buildConfig call. */
function raw(source: string): string {
  return source
}

// ─── configOption ────────────────────────────────────────────────────────────

describe('configOption', () => {
  it('passes when the path exists (existence-only)', () => {
    const src = wrap(`csrf: ['https://app.mysite.com'],`)
    expect(evaluateAssertions(src, [{ kind: 'configOption', path: 'csrf' }])).toEqual([])
  })

  it('passes when scalar value matches', () => {
    const src = wrap(`serverURL: 'https://my-api.com',`)
    expect(
      evaluateAssertions(src, [
        { kind: 'configOption', path: 'serverURL', value: 'https://my-api.com' },
      ]),
    ).toEqual([])
  })

  it('fails when top-level key is missing', () => {
    const src = wrap(`secret: 'test',`)
    const errors = evaluateAssertions(src, [{ kind: 'configOption', path: 'csrf' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/csrf/)
  })

  it('fails when value mismatches', () => {
    const src = wrap(`serverURL: 'https://wrong.com',`)
    const errors = evaluateAssertions(src, [
      { kind: 'configOption', path: 'serverURL', value: 'https://my-api.com' },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/serverURL/)
    expect(errors[0]).toMatch(/https:\/\/my-api\.com/)
  })

  it('resolves identifier references', () => {
    const src = raw(`
      import { buildConfig } from 'payload'
      const csrf = ['https://frontend.example.com']
      export default buildConfig({
        csrf,
        secret: 'test',
      })
    `)
    // csrf key exists even though its value is an identifier ref
    expect(evaluateAssertions(src, [{ kind: 'configOption', path: 'csrf' }])).toEqual([])
  })

  it('handles 2-level dotted paths', () => {
    const src = wrap(`admin: { importMap: { baseDir: './src' } },`)
    expect(evaluateAssertions(src, [{ kind: 'configOption', path: 'admin.importMap' }])).toEqual([])
  })

  it('handles 3-level dotted paths', () => {
    const src = wrap(`admin: { importMap: { baseDir: './src' } },`)
    expect(
      evaluateAssertions(src, [
        { kind: 'configOption', path: 'admin.importMap.baseDir', value: './src' },
      ]),
    ).toEqual([])
  })

  it('fails on missing nested segment', () => {
    const src = wrap(`admin: { components: {} },`)
    const errors = evaluateAssertions(src, [
      { kind: 'configOption', path: 'admin.importMap.baseDir' },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/admin\.importMap\.baseDir/)
  })

  it('walks into jobs.* paths', () => {
    const source = `
      import { buildConfig } from 'payload'
      export default buildConfig({
        collections: [],
        jobs: { tasks: [], autoRun: [{ cron: '* * * * *', queue: 'default' }] },
      })
    `
    expect(evaluateAssertions(source, [{ kind: 'configOption', path: 'jobs.autoRun' }])).toEqual([])
  })

  it('walks into db.* paths', () => {
    const source = `
      import { buildConfig } from 'payload'
      import { postgresAdapter } from '@payloadcms/db-postgres'
      export default buildConfig({
        collections: [],
        db: postgresAdapter({ pool: { connectionString: '' }, migrationDir: './migrations' }),
      })
    `
    // configOption can address db as a top-level key; the value is a CallExpression, so existence check should pass
    expect(evaluateAssertions(source, [{ kind: 'configOption', path: 'db' }])).toEqual([])
  })
})

// ─── collectionOption ────────────────────────────────────────────────────────

describe('collectionOption', () => {
  it('passes when the option exists (existence-only)', () => {
    const src = wrap(`
      collections: [{ slug: 'posts', versions: { drafts: true }, fields: [] }],
    `)
    expect(
      evaluateAssertions(src, [{ kind: 'collectionOption', slug: 'posts', path: 'versions' }]),
    ).toEqual([])
  })

  it('passes when nested value matches', () => {
    const src = wrap(`
      collections: [{ slug: 'posts', versions: { drafts: true }, fields: [] }],
    `)
    expect(
      evaluateAssertions(src, [
        { kind: 'collectionOption', slug: 'posts', path: 'versions.drafts', value: true },
      ]),
    ).toEqual([])
  })

  it('fails when collection is missing', () => {
    const src = wrap(`collections: [],`)
    const errors = evaluateAssertions(src, [
      { kind: 'collectionOption', slug: 'posts', path: 'versions' },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/posts/)
  })

  it('fails when option key is missing on the collection', () => {
    const src = wrap(`
      collections: [{ slug: 'posts', fields: [{ name: 'title', type: 'text' }] }],
    `)
    const errors = evaluateAssertions(src, [
      { kind: 'collectionOption', slug: 'posts', path: 'versions' },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/versions/)
  })

  it('fails when nested value mismatches', () => {
    const src = wrap(`
      collections: [{ slug: 'users', auth: { tokenExpiration: 86400 }, fields: [] }],
    `)
    const errors = evaluateAssertions(src, [
      { kind: 'collectionOption', slug: 'users', path: 'auth.tokenExpiration', value: 3600 },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/3600/)
  })

  it('resolves identifier references for collection options', () => {
    const src = raw(`
      import { buildConfig } from 'payload'
      const postsCollection = {
        slug: 'posts',
        versions: { drafts: true },
        fields: [],
      }
      export default buildConfig({
        collections: [postsCollection],
        secret: 'test',
      })
    `)
    expect(
      evaluateAssertions(src, [
        { kind: 'collectionOption', slug: 'posts', path: 'versions.drafts', value: true },
      ]),
    ).toEqual([])
  })

  it('handles 3-level dotted paths on auth.cookies.sameSite', () => {
    const src = wrap(`
      collections: [{
        slug: 'users',
        auth: { cookies: { sameSite: 'None', secure: true } },
        fields: [],
      }],
    `)
    expect(
      evaluateAssertions(src, [
        { kind: 'collectionOption', slug: 'users', path: 'auth.cookies.sameSite', value: 'None' },
        { kind: 'collectionOption', slug: 'users', path: 'auth.cookies.secure', value: true },
      ]),
    ).toEqual([])
  })
})

// ─── dbAdapterOption ─────────────────────────────────────────────────────────

describe('dbAdapterOption', () => {
  it('passes for a known adapter option', () => {
    const src = raw(`
      import { buildConfig } from 'payload'
      import { postgresAdapter } from '@payloadcms/db-postgres'
      export default buildConfig({
        db: postgresAdapter({ migrationDir: './migrations' }),
        secret: 'test',
        collections: [],
      })
    `)
    expect(evaluateAssertions(src, [{ kind: 'dbAdapterOption', path: 'migrationDir' }])).toEqual([])
  })

  it('passes with explicit adapter match', () => {
    const src = raw(`
      import { buildConfig } from 'payload'
      import { postgresAdapter } from '@payloadcms/db-postgres'
      export default buildConfig({
        db: postgresAdapter({ migrationDir: './migrations' }),
        secret: 'test',
        collections: [],
      })
    `)
    expect(
      evaluateAssertions(src, [
        { kind: 'dbAdapterOption', adapter: 'postgres', path: 'migrationDir' },
      ]),
    ).toEqual([])
  })

  it('fails when adapter name does not match', () => {
    const src = raw(`
      import { buildConfig } from 'payload'
      import { postgresAdapter } from '@payloadcms/db-postgres'
      export default buildConfig({
        db: postgresAdapter({ migrationDir: './migrations' }),
        secret: 'test',
        collections: [],
      })
    `)
    const errors = evaluateAssertions(src, [
      { kind: 'dbAdapterOption', adapter: 'sqlite', path: 'migrationDir' },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/sqlite/)
    expect(errors[0]).toMatch(/postgres/)
  })

  it('fails when db config is absent', () => {
    const src = raw(`
      import { buildConfig } from 'payload'
      export default buildConfig({
        secret: 'test',
        collections: [],
      })
    `)
    const errors = evaluateAssertions(src, [{ kind: 'dbAdapterOption', path: 'migrationDir' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/db adapter/)
  })

  it('fails when the option key is missing', () => {
    const src = raw(`
      import { buildConfig } from 'payload'
      import { postgresAdapter } from '@payloadcms/db-postgres'
      export default buildConfig({
        db: postgresAdapter({ url: 'postgres://localhost/test' }),
        secret: 'test',
        collections: [],
      })
    `)
    const errors = evaluateAssertions(src, [{ kind: 'dbAdapterOption', path: 'migrationDir' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/migrationDir/)
  })
})

// ─── jobsTask ────────────────────────────────────────────────────────────────

describe('jobsTask', () => {
  it('finds a task by slug', () => {
    const src = wrap(`
      jobs: {
        tasks: [
          { slug: 'send-email', handler: async () => ({ output: {} }) },
        ],
      },
    `)
    expect(evaluateAssertions(src, [{ kind: 'jobsTask', slug: 'send-email' }])).toEqual([])
  })

  it('fails when task slug is missing', () => {
    const src = wrap(`
      jobs: {
        tasks: [
          { slug: 'process-upload', handler: async () => ({ output: {} }) },
        ],
      },
    `)
    const errors = evaluateAssertions(src, [{ kind: 'jobsTask', slug: 'send-email' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/send-email/)
  })

  it('fails when jobs config is entirely absent', () => {
    const src = wrap(`collections: [],`)
    const errors = evaluateAssertions(src, [{ kind: 'jobsTask', slug: 'send-email' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/jobs config/)
  })
})

// ─── jobsWorkflow ────────────────────────────────────────────────────────────

describe('jobsWorkflow', () => {
  it('finds a workflow by slug', () => {
    const src = wrap(`
      jobs: {
        tasks: [],
        workflows: [
          { slug: 'publish-post', handler: async () => ({ output: {} }) },
        ],
      },
    `)
    expect(evaluateAssertions(src, [{ kind: 'jobsWorkflow', slug: 'publish-post' }])).toEqual([])
  })

  it('fails when workflow slug is missing', () => {
    const src = wrap(`
      jobs: {
        tasks: [],
        workflows: [],
      },
    `)
    const errors = evaluateAssertions(src, [{ kind: 'jobsWorkflow', slug: 'publish-post' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/publish-post/)
  })

  it('fails when jobs config is entirely absent', () => {
    const src = wrap(`collections: [],`)
    const errors = evaluateAssertions(src, [{ kind: 'jobsWorkflow', slug: 'publish-post' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/jobs config/)
  })
})

// ─── boolean shorthand ───────────────────────────────────────────────────────

describe('boolean shorthand', () => {
  it('object literal satisfies value: true for collectionOption', () => {
    // loginWithUsername: { allowEmailLogin: true } should satisfy value: true
    const src = wrap(`
      collections: [{
        slug: 'users',
        auth: { loginWithUsername: { allowEmailLogin: true } },
        fields: [],
      }],
    `)
    expect(
      evaluateAssertions(src, [
        { kind: 'collectionOption', slug: 'users', path: 'auth.loginWithUsername', value: true },
      ]),
    ).toEqual([])
  })

  it('true literal also satisfies value: true', () => {
    const src = wrap(`
      collections: [{
        slug: 'users',
        auth: { loginWithUsername: true },
        fields: [],
      }],
    `)
    expect(
      evaluateAssertions(src, [
        { kind: 'collectionOption', slug: 'users', path: 'auth.loginWithUsername', value: true },
      ]),
    ).toEqual([])
  })

  it('value: false requires strict false literal', () => {
    const src = wrap(`
      collections: [{
        slug: 'users',
        auth: { cookies: { secure: false } },
        fields: [],
      }],
    `)
    expect(
      evaluateAssertions(src, [
        { kind: 'collectionOption', slug: 'users', path: 'auth.cookies.secure', value: false },
      ]),
    ).toEqual([])
  })

  it('object literal does NOT satisfy value: false', () => {
    const src = wrap(`
      collections: [{
        slug: 'users',
        auth: { loginWithUsername: { allowEmailLogin: true } },
        fields: [],
      }],
    `)
    // An object does not equal false
    const errors = evaluateAssertions(src, [
      { kind: 'collectionOption', slug: 'users', path: 'auth.loginWithUsername', value: false },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/false/)
  })
})

// ─── regression: existing kinds still work ───────────────────────────────────

describe('existing kinds still work', () => {
  it('collectionExists', () => {
    const src = wrap(`
      collections: [{ slug: 'posts', fields: [{ name: 'title', type: 'text' }] }],
    `)
    expect(evaluateAssertions(src, [{ kind: 'collectionExists', slug: 'posts' }])).toEqual([])
    const errors = evaluateAssertions(src, [{ kind: 'collectionExists', slug: 'missing' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/missing/)
  })

  it('fieldExists', () => {
    const src = wrap(`
      collections: [{ slug: 'posts', fields: [{ name: 'title', type: 'text' }] }],
    `)
    expect(
      evaluateAssertions(src, [{ kind: 'fieldExists', slug: 'posts', field: 'title' }]),
    ).toEqual([])
    const errors = evaluateAssertions(src, [{ kind: 'fieldExists', slug: 'posts', field: 'nope' }])
    expect(errors).toHaveLength(1)
  })

  it('fieldOption', () => {
    const src = wrap(`
      collections: [{
        slug: 'posts',
        fields: [{ name: 'status', type: 'select', required: true }],
      }],
    `)
    expect(
      evaluateAssertions(src, [
        { kind: 'fieldOption', slug: 'posts', field: 'status', option: 'required', value: true },
      ]),
    ).toEqual([])
  })

  it('fieldHook', () => {
    const src = wrap(`
      collections: [{
        slug: 'posts',
        fields: [{
          name: 'slug',
          type: 'text',
          hooks: { beforeChange: [() => {}] },
        }],
      }],
    `)
    expect(
      evaluateAssertions(src, [
        { kind: 'fieldHook', slug: 'posts', field: 'slug', hook: 'beforeChange' },
      ]),
    ).toEqual([])
  })

  it('collectionHook', () => {
    const src = wrap(`
      collections: [{
        slug: 'posts',
        hooks: { afterChange: [() => {}] },
        fields: [],
      }],
    `)
    expect(
      evaluateAssertions(src, [{ kind: 'collectionHook', slug: 'posts', hook: 'afterChange' }]),
    ).toEqual([])
  })

  it('collectionHook supports beforeLogin (auth hook)', () => {
    const src = raw(`
      import { buildConfig } from 'payload'
      export default buildConfig({
        collections: [
          { slug: 'users', auth: true, fields: [], hooks: { beforeLogin: [async () => {}] } },
        ],
      })
    `)
    expect(
      evaluateAssertions(src, [{ kind: 'collectionHook', slug: 'users', hook: 'beforeLogin' }]),
    ).toEqual([])
  })

  it('collectionHook supports afterLogin (auth hook)', () => {
    const src = raw(`
      import { buildConfig } from 'payload'
      export default buildConfig({
        collections: [
          { slug: 'users', auth: true, fields: [], hooks: { afterLogin: [async () => {}] } },
        ],
      })
    `)
    expect(
      evaluateAssertions(src, [{ kind: 'collectionHook', slug: 'users', hook: 'afterLogin' }]),
    ).toEqual([])
  })

  it('collectionHook supports afterError (collection-level)', () => {
    const source = `
      import { buildConfig } from 'payload'
      export default buildConfig({
        collections: [
          { slug: 'posts', fields: [], hooks: { afterError: [async () => {}] } },
        ],
      })
    `
    expect(
      evaluateAssertions(source, [{ kind: 'collectionHook', slug: 'posts', hook: 'afterError' }]),
    ).toEqual([])
  })

  it('collectionAccess', () => {
    const src = wrap(`
      collections: [{
        slug: 'posts',
        access: { read: () => true },
        fields: [],
      }],
    `)
    expect(
      evaluateAssertions(src, [{ kind: 'collectionAccess', slug: 'posts', operation: 'read' }]),
    ).toEqual([])
  })

  it('collectionAccess: readVersions (version-enabled collection)', () => {
    const src = wrap(`
      collections: [{
        slug: 'posts',
        versions: { drafts: true },
        access: { readVersions: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')) },
        fields: [],
      }],
    `)
    expect(
      evaluateAssertions(src, [
        { kind: 'collectionAccess', slug: 'posts', operation: 'readVersions' },
      ]),
    ).toEqual([])
  })

  it('collectionAccess: unlock (auth-enabled collection)', () => {
    const src = wrap(`
      collections: [{
        slug: 'users',
        auth: true,
        access: { unlock: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')) },
        fields: [],
      }],
    `)
    expect(
      evaluateAssertions(src, [{ kind: 'collectionAccess', slug: 'users', operation: 'unlock' }]),
    ).toEqual([])
  })

  it('collectionAccess fails when readVersions is missing', () => {
    const src = wrap(`
      collections: [{
        slug: 'posts',
        versions: { drafts: true },
        access: { read: () => true },
        fields: [],
      }],
    `)
    const errors = evaluateAssertions(src, [
      { kind: 'collectionAccess', slug: 'posts', operation: 'readVersions' },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/readVersions/)
  })

  it('blockField', () => {
    const src = wrap(`
      collections: [{
        slug: 'pages',
        fields: [{
          name: 'layout',
          type: 'blocks',
          blocks: [
            { slug: 'hero', fields: [{ name: 'heading', type: 'text' }] },
          ],
        }],
      }],
    `)
    expect(
      evaluateAssertions(src, [
        {
          kind: 'blockField',
          slug: 'pages',
          field: 'layout',
          blockSlug: 'hero',
          subfield: 'heading',
        },
      ]),
    ).toEqual([])
  })
})
