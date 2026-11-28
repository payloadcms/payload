import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DefaultTypedEditorState } from '../../nodeTypes.js'

import { convertLexicalToHTMLAsync } from './lexicalToHtml/async/index.js'
import { convertLexicalToHTML } from './lexicalToHtml/sync/index.js'
import { RichText } from './lexicalToJSX/Component/index.js'

/**
 * Simulates an upload that was populated with a `select`/`populate` projection
 * that omits `mimeType` (e.g. `populate: { media: { url: true, filename: true } }`).
 */
const uploadWithoutMimeType = {
  id: 'upload-1',
  filename: 'photo.jpg',
  url: '/media/photo.jpg',
}

describe('upload converters', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('when the populated upload has no mimeType', () => {
    it('should render a link with the JSX converter', () => {
      const html = renderToStaticMarkup(
        createElement(RichText, {
          data: createEditorState({ value: uploadWithoutMimeType }),
          disableContainer: true,
        }),
      )

      expect(html).toBe('<a href="/media/photo.jpg" rel="noopener noreferrer">photo.jpg</a>')
    })

    it('should render a link with the sync HTML converter', () => {
      const html = convertLexicalToHTML({
        data: createEditorState({ value: uploadWithoutMimeType }),
        disableContainer: true,
      })

      expect(html).toBe('<a href="/media/photo.jpg" rel="noopener noreferrer">photo.jpg</a>')
    })

    it('should render a link with the async HTML converter', async () => {
      const html = await convertLexicalToHTMLAsync({
        data: createEditorState({ value: uploadWithoutMimeType }),
        disableContainer: true,
      })

      expect(html).toBe('<a href="/media/photo.jpg" rel="noopener noreferrer">photo.jpg</a>')
    })
  })

  describe('when the upload value is null', () => {
    it('should render nothing with the JSX converter', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const html = renderToStaticMarkup(
        createElement(RichText, {
          data: createEditorState({ value: null }),
          disableContainer: true,
        }),
      )

      expect(html).toBe('')
      expect(consoleError).not.toHaveBeenCalled()
    })

    it('should render nothing with the sync HTML converter', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const html = convertLexicalToHTML({
        data: createEditorState({ value: null }),
        disableContainer: true,
      })

      expect(html).toBe('')
      expect(consoleError).not.toHaveBeenCalled()
    })
  })
})

function createEditorState({ value }: { value: unknown }): DefaultTypedEditorState {
  return {
    root: {
      type: 'root',
      children: [
        {
          id: 'node-1',
          type: 'upload',
          fields: {},
          format: '',
          relationTo: 'media',
          value,
          version: 3,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  } as unknown as DefaultTypedEditorState
}
