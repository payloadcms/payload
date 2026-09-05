import { randomUUID } from 'node:crypto'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import type { CollectionConfig } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { File } from './types.js'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { checkFileRestrictions } from './checkFileRestrictions.js'

const svg11Doctype =
  '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

const collection = {
  fields: [],
  slug: 'media',
  upload: { mimeTypes: ['image/*'] },
} as unknown as CollectionConfig

const imageAndTextCollection = {
  fields: [],
  slug: 'media',
  upload: { mimeTypes: ['image/*', 'text/plain'] },
} as unknown as CollectionConfig

const textOnlyCollection = {
  fields: [],
  slug: 'media',
  upload: { mimeTypes: ['text/plain'] },
} as unknown as CollectionConfig

const req = {
  payload: {
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
    },
  },
} as unknown as PayloadRequest

const createFile = ({
  content,
  mimetype = 'image/svg+xml',
  name = 'image.svg',
  tempFilePath,
}: {
  content: string
  mimetype?: string
  name?: string
  tempFilePath?: string
}): File => {
  const data = Buffer.from(content)

  return {
    data: tempFilePath ? Buffer.alloc(0) : data,
    mimetype,
    name,
    size: data.length,
    tempFilePath,
  }
}

describe('checkFileRestrictions SVG validation', () => {
  const createdTempFiles: string[] = []

  afterEach(async () => {
    for (const tempFile of createdTempFiles) {
      await fs.unlink(tempFile)
    }
    createdTempFiles.length = 0
    vi.clearAllMocks()
  })

  it('should accept a valid SVG with an external SVG 1.1 DOCTYPE', async () => {
    const content = `<?xml version="1.0" encoding="UTF-8"?>
${svg11Doctype}
<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
  <rect width="10" height="10" />
</svg>`

    await expect(
      checkFileRestrictions({ collection, file: createFile({ content }), req }),
    ).resolves.toBeUndefined()
  })

  it('should accept a valid SVG when the external identifier contains a greater-than sign', async () => {
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg SYSTEM "https://www.w3.org/Graphics/SVG/svg>11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
  <rect width="10" height="10" />
</svg>`

    await expect(
      checkFileRestrictions({ collection, file: createFile({ content }), req }),
    ).resolves.toBeUndefined()
  })

  it('should accept a valid SVG with an external SVG 1.1 DOCTYPE from a temp file', async () => {
    const content = `<?xml version="1.0" encoding="UTF-8"?>
${svg11Doctype}
<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
  <rect width="10" height="10" />
</svg>`
    const tempFilePath = path.join(os.tmpdir(), `payload-svg-${randomUUID()}.svg`)
    await fs.writeFile(tempFilePath, content)
    createdTempFiles.push(tempFilePath)

    await expect(
      checkFileRestrictions({
        collection,
        file: createFile({ content, tempFilePath }),
        req,
      }),
    ).resolves.toBeUndefined()
  })

  it.each([
    {
      content: `<?xml version="1.0"?>
<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<svg xmlns="http://www.w3.org/2000/svg"><text>&xxe;</text></svg>`,
      name: 'an internal entity subset',
    },
    {
      content: `<?xml version="1.0"?>
${svg11Doctype}
<svg xmlns="http://www.w3.org/2000/svg"><script>alert('xss')</script></svg>`,
      name: 'a script after an external SVG DOCTYPE',
    },
    {
      content: `<?xml version="1.0"?>
${svg11Doctype}
<svg xmlns="http://www.w3.org/2000/svg" onload="alert('xss')"></svg>`,
      name: 'an event handler after an external SVG DOCTYPE',
    },
    {
      content: `<?xml version="1.0"?>
<!DOCTYPE html>
<svg xmlns="http://www.w3.org/2000/svg"></svg>`,
      name: 'an HTML DOCTYPE with an SVG root',
    },
    {
      content: `<?xml version="1.0"?>
<!DOCTYPE SVG>
<svg xmlns="http://www.w3.org/2000/svg"></svg>`,
      name: 'a case-mismatched SVG DOCTYPE root',
    },
    {
      content: `<?xml version="1.0"?>
<!DOCTYPE svg SYSTEM "><svg xmlns="http://www.w3.org/2000/svg"></svg>`,
      name: 'an unterminated external identifier',
    },
    {
      content: `${svg11Doctype}
<html><body>not an SVG</body></html>`,
      name: 'an SVG DOCTYPE with an HTML root',
    },
    {
      content: '<!DOCTYPE html><html><body>not an SVG</body></html>',
      name: 'an HTML document using an SVG extension',
    },
    {
      content: `<?xml version="1.0"?>
<!DOCTYPE note SYSTEM "note.dtd">
<note xmlns="http://www.w3.org/2000/svg">not an SVG</note>`,
      name: 'a non-SVG XML document using an SVG extension',
    },
    {
      content: '<svg xmlns="urn:not-svg"><g xmlns="http://www.w3.org/2000/svg"></g></svg>',
      name: 'an SVG namespace declared only on a descendant',
    },
    {
      content: '<svg xmlns="urn:not-svg"><!-- xmlns="http://www.w3.org/2000/svg" --></svg>',
      name: 'an SVG namespace declared only in a comment',
    },
    {
      content:
        '<svg data-description=\'xmlns="http://www.w3.org/2000/svg"\' xmlns="urn:not-svg"></svg>',
      name: 'an SVG namespace present only inside another root attribute',
    },
    {
      content:
        '<!--ftypavif--><svg xmlns="http://www.w3.org/2000/svg"><script>alert(\'xss\')</script></svg>',
      name: 'a scripted SVG colliding with an AVIF signature',
    },
    {
      content: `<?xml version="1.0"?>
${svg11Doctype}
<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg">
  <s:script>alert('xss')</s:script>
</svg>`,
      name: 'a namespace-prefixed script element',
    },
    {
      content: `<?xml version="1.0"?>
${svg11Doctype}
<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg">
  <s:foreignObject><div xmlns="http://www.w3.org/1999/xhtml">HTML</div></s:foreignObject>
</svg>`,
      name: 'a namespace-prefixed foreignObject element',
    },
    {
      content: `<?xml version="1.0"?>
${svg11Doctype}
<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg">
  <s:iframe src="https://example.com"></s:iframe>
</svg>`,
      name: 'a namespace-prefixed iframe element',
    },
    {
      content: `<?xml version="1.0"?>
${svg11Doctype}
<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg">
  <s:object data="https://example.com"></s:object>
</svg>`,
      name: 'a namespace-prefixed object element',
    },
    {
      content: `<?xml version="1.0"?>
${svg11Doctype}
<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg">
  <s:embed src="https://example.com"></s:embed>
</svg>`,
      name: 'a namespace-prefixed embed element',
    },
  ])('should reject $name', async ({ content }) => {
    await expect(
      checkFileRestrictions({ collection, file: createFile({ content }), req }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('should reject a detected XML SVG containing a script from a temp file', async () => {
    const content = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg"><script>alert('xss')</script></svg>`
    const tempFilePath = path.join(os.tmpdir(), `payload-svg-${randomUUID()}.svg`)
    await fs.writeFile(tempFilePath, content)
    createdTempFiles.push(tempFilePath)

    await expect(
      checkFileRestrictions({
        collection,
        file: createFile({ content, tempFilePath }),
        req,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('should reject a scripted SVG colliding with an AVIF signature from a temp file', async () => {
    const content =
      '<!--ftypavif--><svg xmlns="http://www.w3.org/2000/svg"><script>alert(\'xss\')</script></svg>'
    const tempFilePath = path.join(os.tmpdir(), `payload-svg-${randomUUID()}.svg`)
    await fs.writeFile(tempFilePath, content)
    createdTempFiles.push(tempFilePath)

    await expect(
      checkFileRestrictions({
        collection,
        file: createFile({ content, tempFilePath }),
        req,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('should reject a claimed SVG with a text extension when file detection has no result', async () => {
    const content = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(\'xss\')</script></svg>'

    await expect(
      checkFileRestrictions({
        collection: imageAndTextCollection,
        file: createFile({ content, name: 'image.txt' }),
        req,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('should reject a claimed SVG with a text extension from a temp file', async () => {
    const content = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(\'xss\')</script></svg>'
    const tempFilePath = path.join(os.tmpdir(), `payload-svg-${randomUUID()}.txt`)
    await fs.writeFile(tempFilePath, content)
    createdTempFiles.push(tempFilePath)

    await expect(
      checkFileRestrictions({
        collection: imageAndTextCollection,
        file: createFile({ content, name: 'image.txt', tempFilePath }),
        req,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('should reject a parameterized SVG MIME claim containing a script', async () => {
    const content = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(\'xss\')</script></svg>'

    await expect(
      checkFileRestrictions({
        collection: imageAndTextCollection,
        file: createFile({
          content,
          mimetype: 'Image/SVG+XML; charset=UTF-8',
          name: 'image.txt',
        }),
        req,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('should reject a parameterized SVG MIME claim containing a script from a temp file', async () => {
    const content = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(\'xss\')</script></svg>'
    const tempFilePath = path.join(os.tmpdir(), `payload-svg-${randomUUID()}.txt`)
    await fs.writeFile(tempFilePath, content)
    createdTempFiles.push(tempFilePath)

    await expect(
      checkFileRestrictions({
        collection: imageAndTextCollection,
        file: createFile({
          content,
          mimetype: 'Image/SVG+XML; charset=UTF-8',
          name: 'image.txt',
          tempFilePath,
        }),
        req,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('should reject valid SVG content disguised as text when SVG MIME types are not allowed', async () => {
    const content = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" /></svg>'

    await expect(
      checkFileRestrictions({
        collection: textOnlyCollection,
        file: createFile({ content, name: 'image.txt' }),
        req,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('should reject valid SVG content disguised as a temp text file when SVG MIME types are not allowed', async () => {
    const content = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" /></svg>'
    const tempFilePath = path.join(os.tmpdir(), `payload-svg-${randomUUID()}.txt`)
    await fs.writeFile(tempFilePath, content)
    createdTempFiles.push(tempFilePath)

    await expect(
      checkFileRestrictions({
        collection: textOnlyCollection,
        file: createFile({ content, name: 'image.txt', tempFilePath }),
        req,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })
})
