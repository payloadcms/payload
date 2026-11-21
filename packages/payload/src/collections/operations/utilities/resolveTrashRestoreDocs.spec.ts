import { describe, expect, it } from 'vitest'

import { resolveTrashRestoreDocs } from './resolveTrashRestoreDocs.js'

describe('resolveTrashRestoreDocs', () => {
  const mainDoc = {
    id: '1',
    _status: 'published',
    title: 'published-v1',
  }

  const latestVersionDoc = {
    id: '1',
    _status: 'draft',
    title: 'draft-v2',
  }

  it('should keep the published main document when a pending draft exists', () => {
    const result = resolveTrashRestoreDocs({
      data: { deletedAt: new Date().toISOString() },
      latestVersionDoc,
      mainDoc,
    })

    expect(result.docWithLocales).toBe(mainDoc)
    expect(result.versionDocWithLocales).toBe(latestVersionDoc)
  })

  it('should use the latest version when restoring as draft', () => {
    const result = resolveTrashRestoreDocs({
      data: { _status: 'draft', deletedAt: null },
      latestVersionDoc,
      mainDoc,
      requestedStatus: 'draft',
    })

    expect(result.docWithLocales).toBe(latestVersionDoc)
    expect(result.versionDocWithLocales).toBeUndefined()
  })

  it('should use the latest version when explicitly publishing on restore', () => {
    const result = resolveTrashRestoreDocs({
      data: { _status: 'published', deletedAt: null },
      latestVersionDoc,
      mainDoc,
      requestedStatus: 'published',
    })

    expect(result.docWithLocales).toBe(latestVersionDoc)
    expect(result.versionDocWithLocales).toBeUndefined()
  })

  it('should keep the published main document when the request locale has a pending draft', () => {
    const localizedMainDoc = {
      id: '1',
      _status: { en: 'published', es: 'published' },
      localizedField: { en: 'en-published', es: 'es-published' },
    }
    const localizedLatestVersionDoc = {
      id: '1',
      _status: { en: 'published', es: 'draft' },
      localizedField: { en: 'en-published', es: 'es-draft' },
    }

    const result = resolveTrashRestoreDocs({
      data: { deletedAt: new Date().toISOString() },
      latestVersionDoc: localizedLatestVersionDoc,
      locale: 'es',
      mainDoc: localizedMainDoc,
    })

    expect(result.docWithLocales).toBe(localizedMainDoc)
    expect(result.versionDocWithLocales).toBe(localizedLatestVersionDoc)
  })

  it('should keep the published main document when locale is all and any locale has a pending draft', () => {
    const localizedMainDoc = {
      id: '1',
      _status: { en: 'published', es: 'published' },
      localizedField: { en: 'en-published', es: 'es-published' },
    }
    const localizedLatestVersionDoc = {
      id: '1',
      _status: { en: 'published', es: 'draft' },
      localizedField: { en: 'en-published', es: 'es-draft' },
    }

    const result = resolveTrashRestoreDocs({
      data: { deletedAt: new Date().toISOString() },
      latestVersionDoc: localizedLatestVersionDoc,
      locale: 'all',
      mainDoc: localizedMainDoc,
    })

    expect(result.docWithLocales).toBe(localizedMainDoc)
    expect(result.versionDocWithLocales).toBe(localizedLatestVersionDoc)
  })

  it('should use the latest version when the request locale is still published on the latest version', () => {
    const localizedMainDoc = {
      id: '1',
      _status: { en: 'published', es: 'published' },
      localizedField: { en: 'en-published', es: 'es-published' },
    }
    const localizedLatestVersionDoc = {
      id: '1',
      _status: { en: 'published', es: 'draft' },
      localizedField: { en: 'en-published', es: 'es-draft' },
    }

    const result = resolveTrashRestoreDocs({
      data: { deletedAt: new Date().toISOString() },
      latestVersionDoc: localizedLatestVersionDoc,
      locale: 'en',
      mainDoc: localizedMainDoc,
    })

    expect(result.docWithLocales).toBe(localizedLatestVersionDoc)
    expect(result.versionDocWithLocales).toBeUndefined()
  })

  it('should ignore a generated published status when the caller did not request publish', () => {
    // updateDocument may set data._status to 'published' when locale is `all` and
    // localizeStatus is enabled, even though the trash request only set deletedAt.
    const result = resolveTrashRestoreDocs({
      data: { _status: 'published', deletedAt: new Date().toISOString() },
      latestVersionDoc,
      mainDoc,
      requestedStatus: undefined,
    })

    expect(result.docWithLocales).toBe(mainDoc)
    expect(result.versionDocWithLocales).toBe(latestVersionDoc)
  })

  it('should use the latest version when publishAllLocales is explicitly requested', () => {
    const result = resolveTrashRestoreDocs({
      data: { _status: 'published', deletedAt: null },
      latestVersionDoc,
      mainDoc,
      publishAllLocales: true,
      requestedStatus: undefined,
    })

    expect(result.docWithLocales).toBe(latestVersionDoc)
    expect(result.versionDocWithLocales).toBeUndefined()
  })

  it('should use the latest version when the caller requested published status', () => {
    const result = resolveTrashRestoreDocs({
      data: { _status: 'published', deletedAt: null },
      latestVersionDoc,
      mainDoc,
      requestedStatus: 'published',
    })

    expect(result.docWithLocales).toBe(latestVersionDoc)
    expect(result.versionDocWithLocales).toBeUndefined()
  })

  it('should use the latest version when a generated draft status is present', () => {
    const result = resolveTrashRestoreDocs({
      data: { _status: 'draft', deletedAt: new Date().toISOString() },
      latestVersionDoc,
      mainDoc,
      requestedStatus: undefined,
    })

    expect(result.docWithLocales).toBe(latestVersionDoc)
    expect(result.versionDocWithLocales).toBeUndefined()
  })
})
