import { describe, expect, it } from 'vitest'

import { serializeLexical } from './serializeLexical.js'

const submissionData = [
  { field: 'Name', value: 'Alice' },
  { field: 'Email', value: 'alice@example.com' },
]

const tableData = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '{{*:table}}',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
}

describe('serializeLexical table variable', () => {
  it('does not wrap the generated table in a paragraph', async () => {
    const html = await serializeLexical(tableData, submissionData)

    expect(html).not.toContain('<p><table')
    expect(html).toBe(
      '<table><tr><td>Name</td><td>Alice</td></tr><tr><td>Email</td><td>alice@example.com</td></tr></table>',
    )
  })

  it('still wraps ordinary paragraph text in a paragraph', async () => {
    const data = {
      root: {
        ...tableData.root,
        children: [
          {
            ...tableData.root.children[0],
            children: [
              {
                ...tableData.root.children[0].children[0],
                text: 'Hello {{Name}}',
              },
            ],
          },
        ],
      },
    }

    const html = await serializeLexical(data, submissionData)

    expect(html).toBe('<p>Hello Alice</p>')
  })
})
