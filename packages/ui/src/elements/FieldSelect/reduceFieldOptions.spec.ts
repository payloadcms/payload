import type { ClientField } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import type { FieldOption } from './reduceFieldOptions.js'

// Mock the JSX label builder: irrelevant to permission logic and avoids needing a React runtime here.
vi.mock('../../utilities/combineFieldLabel.js', () => ({
  combineFieldLabel: () => null,
}))

import { reduceFieldOptions } from './reduceFieldOptions.js'

const text = (name: string): ClientField => ({ name, type: 'text' }) as ClientField

const namesOf = (options: FieldOption[]): (string | undefined)[] =>
  options.map((option) => ('name' in option.value.field ? option.value.field.name : undefined))

// A denied field omits the operation key at runtime, which `SanitizedFieldPermissions` can't express — cast at the boundary.
type Permissions = Parameters<typeof reduceFieldOptions>[0]['permissions']
const optionsFor = (fields: ClientField[], permissions: unknown): FieldOption[] =>
  reduceFieldOptions({ fields, permissions: permissions as Permissions })

// Granted sets the operation to `true`; denied omits the key, mirroring `populateFieldPermissions`.
const granted = { create: true, read: true, update: true }
const readOnly = { create: true, read: true }

describe('reduceFieldOptions', () => {
  it('excludes a restricted field inside a named tab while keeping its clean siblings', () => {
    const fields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [{ name: 'namedTab', fields: [text('okInTab'), text('restrictedInTab')] }],
      } as ClientField,
    ]

    const permissions = {
      namedTab: {
        ...granted,
        fields: {
          okInTab: granted,
          restrictedInTab: readOnly,
        },
      },
    }

    const options = optionsFor(fields, permissions)
    const names = namesOf(options)

    expect(names).toContain('okInTab')
    expect(names).not.toContain('restrictedInTab')
  })

  it('excludes a restricted field inside a nested named tab', () => {
    const fields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [
          {
            name: 'outerTab',
            fields: [
              {
                type: 'tabs',
                tabs: [{ name: 'innerTab', fields: [text('deepOk'), text('deepRestricted')] }],
              },
            ],
          },
        ],
      } as ClientField,
    ]

    const permissions = {
      outerTab: {
        ...granted,
        fields: {
          innerTab: {
            ...granted,
            fields: {
              deepOk: granted,
              deepRestricted: readOnly,
            },
          },
        },
      },
    }

    const options = optionsFor(fields, permissions)
    const names = namesOf(options)

    expect(names).toContain('deepOk')
    expect(names).not.toContain('deepRestricted')
  })

  it('only affects the named tab that contains the restricted field', () => {
    const fields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [
          { name: 'cleanTab', fields: [text('cleanField')] },
          { name: 'restrictedHostTab', fields: [text('restrictedField')] },
        ],
      } as ClientField,
    ]

    const permissions = {
      cleanTab: { ...granted, fields: { cleanField: granted } },
      restrictedHostTab: { ...granted, fields: { restrictedField: readOnly } },
    }

    const options = optionsFor(fields, permissions)
    const names = namesOf(options)

    expect(names).toContain('cleanField')
    expect(names).not.toContain('restrictedField')
  })

  it('includes every named-tab field when permissions are fully granted', () => {
    const fields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [{ name: 'namedTab', fields: [text('a'), text('b')] }],
      } as ClientField,
    ]

    const options = optionsFor(fields, true)
    const names = namesOf(options)

    expect(names).toEqual(expect.arrayContaining(['a', 'b']))
  })

  it('applies parent permissions to an unnamed tab and excludes its restricted fields', () => {
    const fields: ClientField[] = [
      {
        type: 'tabs',
        tabs: [{ label: 'Unnamed', fields: [text('okAtRoot'), text('restrictedAtRoot')] }],
      } as ClientField,
    ]

    // Unnamed tabs share the parent's permission map, so subfields resolve at the parent level.
    const permissions = {
      okAtRoot: granted,
      restrictedAtRoot: readOnly,
    }

    const options = optionsFor(fields, permissions)
    const names = namesOf(options)

    expect(names).toContain('okAtRoot')
    expect(names).not.toContain('restrictedAtRoot')
  })
})
