import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  customSeparatorPagesSlug,
  explicitStoredPagesSlug,
  localizedTitlePagesSlug,
  nestedDocsPagesSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

describe('hierarchy stored path sync', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (payload) {
      await payload.destroy()
    }
  })

  afterEach(async () => {
    await payload.delete({
      collection: nestedDocsPagesSlug,
      where: {},
    })

    await payload.delete({
      collection: explicitStoredPagesSlug,
      where: {},
    })

    await payload.delete({
      collection: customSeparatorPagesSlug,
      where: {},
    })
  })

  describe('configuration', () => {
    it('should configure nested docs as a stored hierarchy preset', () => {
      const collection = payload.collections[nestedDocsPagesSlug].config
      const parentField = collection.fields.find((field) => field.name === 'parent')
      const slugPathField = collection.fields.find((field) => field.name === '_h_slugPath')
      const titlePathField = collection.fields.find((field) => field.name === '_h_titlePath')

      if (collection.hierarchy === false) {
        throw new Error('Expected nested docs collection to have hierarchy enabled')
      }

      expect(collection.hierarchy.pathStrategy).toBe('stored')
      expect(collection.hierarchy.parentFieldName).toBe('parent')
      expect(collection.hierarchy.slugField).toBe('slug')
      expect(collection.hierarchy.titleField).toBe('title')
      expect(collection.hierarchy.admin.injectSidebarTab).toBe(false)
      expect(collection.hierarchy.admin.useHeaderButton).toBe(true)
      expect(collection.admin.useAsTitle).toBe('_h_titlePath')
      expect(parentField?.type).toBe('relationship')
      expect(slugPathField?.virtual).toBeFalsy()
      expect(titlePathField?.virtual).toBeFalsy()
      expect(collection.hooks?.afterRead?.length ?? 0).toBe(0)
      expect(collection.hooks?.beforeOperation?.length ?? 0).toBe(0)
    })

    it('should keep explicit stored hierarchy configuration available outside the preset', () => {
      const collection = payload.collections[explicitStoredPagesSlug].config
      const slugPathField = collection.fields.find((field) => field.name === '_h_slugPath')
      const titlePathField = collection.fields.find((field) => field.name === '_h_titlePath')

      if (collection.hierarchy === false) {
        throw new Error('Expected explicit stored collection to have hierarchy enabled')
      }

      expect(collection.hierarchy.pathStrategy).toBe('stored')
      expect(collection.hierarchy.parentFieldName).toBe('_h_explicitStoredPages')
      expect(collection.admin.useAsTitle).toBe('title')
      expect(slugPathField?.virtual).toBeFalsy()
      expect(titlePathField?.virtual).toBeFalsy()
    })
  })

  describe('stored path writes', () => {
    it('should persist stored slug and title paths when creating nested pages', async () => {
      const root = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: null,
          slug: 'home',
          title: 'Home',
        },
      })

      const child = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: root.id,
          slug: 'services',
          title: 'Services',
        },
      })

      const rootWithPaths = await payload.findByID({
        id: root.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
      })

      const childWithPaths = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
      })

      expect(rootWithPaths._h_slugPath).toBe('home')
      expect(rootWithPaths._h_titlePath).toBe('Home')
      expect(childWithPaths._h_slugPath).toBe('home/services')
      expect(childWithPaths._h_titlePath).toBe('Home / Services')
    })

    it('should use a custom title path separator without changing slug paths', async () => {
      const root = await payload.create({
        collection: customSeparatorPagesSlug,
        data: {
          parent: null,
          slug: 'home',
          title: 'Home',
        },
      })

      const child = await payload.create({
        collection: customSeparatorPagesSlug,
        data: {
          parent: root.id,
          slug: 'about',
          title: 'About',
        },
      })

      expect(child._h_slugPath).toBe('home/about')
      expect(child._h_titlePath).toBe('Home › About')
    })

    it('should update descendant stored paths when an ancestor slug changes', async () => {
      const root = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: null,
          slug: 'home',
          title: 'Home',
        },
      })

      const child = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: root.id,
          slug: 'services',
          title: 'Services',
        },
      })

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'homepage',
        },
      })

      const updatedChild = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
      })

      expect(updatedChild._h_slugPath).toBe('homepage/services')
      expect(updatedChild._h_titlePath).toBe('Home / Services')
    })

    it('should update nested descendant stored paths when an ancestor slug changes', async () => {
      const root = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: null,
          slug: 'home',
          title: 'Home',
        },
      })

      const child = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: root.id,
          slug: 'services',
          title: 'Services',
        },
      })

      const grandchild = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: child.id,
          slug: 'consulting',
          title: 'Consulting',
        },
      })

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'homepage',
        },
      })

      const updatedGrandchild = await payload.findByID({
        id: grandchild.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
      })

      expect(updatedGrandchild._h_slugPath).toBe('homepage/services/consulting')
      expect(updatedGrandchild._h_titlePath).toBe('Home / Services / Consulting')
    })

    it('should recompute paths against published ancestors when publishing a draft child', async () => {
      const parent = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'draft',
          parent: null,
          slug: 'draft-parent',
          title: 'Draft Parent',
        },
      })

      const child = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'draft',
          parent: parent.id,
          slug: 'child',
          title: 'Child',
        },
      })

      const publishedChild = await payload.update({
        id: child.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
        },
      })

      expect(publishedChild._h_slugPath).toBe('child')
      expect(publishedChild._h_titlePath).toBe('Child')
    })

    it('should update a previously published child when a draft parent change is published', async () => {
      const parent = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'draft',
          parent: null,
          slug: 'parent',
          title: 'Parent',
        },
      })

      const child = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'draft',
          parent: parent.id,
          slug: 'child',
          title: 'Child',
        },
      })

      await payload.update({
        id: child.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
        },
      })

      await payload.update({
        id: parent.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
        },
      })

      const childAfterParentPublish = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
      })

      expect(childAfterParentPublish._h_slugPath).toBe('parent/child')
      expect(childAfterParentPublish._h_titlePath).toBe('Parent / Child')

      await payload.update({
        id: parent.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'draft',
          slug: 'updated-parent',
          title: 'Updated Parent',
        },
      })

      const childAfterParentDraft = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
      })

      expect(childAfterParentDraft._h_slugPath).toBe('parent/child')
      expect(childAfterParentDraft._h_titlePath).toBe('Parent / Child')

      await payload.update({
        id: parent.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
        },
      })

      const childAfterParentRepublish = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
      })

      expect(childAfterParentRepublish._h_slugPath).toBe('updated-parent/child')
      expect(childAfterParentRepublish._h_titlePath).toBe('Updated Parent / Child')
    })
  })

  describe('localized path writes', () => {
    it('should skip child updates when a draft parent change does not alter the published path', async () => {
      const root = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: null,
          slug: 'home',
          title: 'Home',
        },
      })

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'inicio',
          title: 'Inicio',
        },
        locale: 'es',
      })

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'startseite',
          title: 'Startseite',
        },
        locale: 'de',
      })

      const child = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: root.id,
          slug: 'services',
          title: 'Services',
        },
      })

      await payload.update({
        id: child.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'servicios',
          title: 'Servicios',
        },
        locale: 'es',
      })

      await payload.update({
        id: child.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'dienstleistungen',
          title: 'Dienstleistungen',
        },
        locale: 'de',
      })

      const childBeforeUpdate = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
        locale: 'all',
      })

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'draft',
          slug: 'home-draft',
        },
      })

      const childAfterUpdate = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
        locale: 'all',
      })

      expect(childAfterUpdate.updatedAt).toBe(childBeforeUpdate.updatedAt)
      expect(childAfterUpdate._h_slugPath).toEqual({
        de: 'startseite/dienstleistungen',
        en: 'home/services',
        es: 'inicio/servicios',
      })
      expect(childAfterUpdate._h_titlePath).toEqual({
        de: 'Startseite / Dienstleistungen',
        en: 'Home / Services',
        es: 'Inicio / Servicios',
      })
    })

    it('should update localized child paths when a draft parent locale is published', async () => {
      const root = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: null,
          slug: 'parent',
          title: 'Parent',
        },
        locale: 'en',
      })

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'draft',
          slug: 'padre',
          title: 'Padre',
        },
        locale: 'es',
      })

      const child = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: root.id,
          slug: 'child',
          title: 'Child',
        },
        locale: 'en',
      })

      await payload.update({
        id: child.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'draft',
          slug: 'hijo',
          title: 'Hijo',
        },
        locale: 'es',
      })

      await payload.update({
        id: child.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
        },
        locale: 'es',
      })

      const childAfterSpanishPublish = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
        locale: 'es',
      })

      expect(childAfterSpanishPublish._h_slugPath).toBe('hijo')
      expect(childAfterSpanishPublish._h_titlePath).toBe('Hijo')

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
        },
        locale: 'es',
      })

      const childAfterParentSpanishPublish = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
        locale: 'es',
      })

      expect(childAfterParentSpanishPublish._h_slugPath).toBe('padre/hijo')
      expect(childAfterParentSpanishPublish._h_titlePath).toBe('Padre / Hijo')

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'draft',
          slug: 'padre-actualizado',
          title: 'Padre Actualizado',
        },
        locale: 'es',
      })

      const childAfterParentSpanishDraft = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
        locale: 'es',
      })

      expect(childAfterParentSpanishDraft._h_slugPath).toBe('padre/hijo')
      expect(childAfterParentSpanishDraft._h_titlePath).toBe('Padre / Hijo')

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
        },
        locale: 'es',
      })

      const childAfterParentSpanishRepublish = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
        locale: 'es',
      })

      expect(childAfterParentSpanishRepublish._h_slugPath).toBe('padre-actualizado/hijo')
      expect(childAfterParentSpanishRepublish._h_titlePath).toBe('Padre Actualizado / Hijo')
    })

    it('should update localized descendant paths for all locales after parent move', async () => {
      const root = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: null,
          slug: 'home',
          title: 'Home',
        },
        locale: 'en',
      })

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'inicio',
          title: 'Inicio',
        },
        locale: 'es',
      })

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'startseite',
          title: 'Startseite',
        },
        locale: 'de',
      })

      const child = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: root.id,
          slug: 'services',
          title: 'Services',
        },
        locale: 'en',
      })

      await payload.update({
        id: child.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'servicios',
          title: 'Servicios',
        },
        locale: 'es',
      })

      await payload.update({
        id: child.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'dienstleistungen',
          title: 'Dienstleistungen',
        },
        locale: 'de',
      })

      const newRoot = await payload.create({
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: null,
          slug: 'catalog',
          title: 'Catalog',
        },
        locale: 'en',
      })

      await payload.update({
        id: newRoot.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'catalogo',
          title: 'Catalogo',
        },
        locale: 'es',
      })

      await payload.update({
        id: newRoot.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          slug: 'katalog',
          title: 'Katalog',
        },
        locale: 'de',
      })

      await payload.update({
        id: root.id,
        collection: nestedDocsPagesSlug,
        data: {
          _status: 'published',
          parent: newRoot.id,
        },
        locale: 'en',
      })

      const localizedChild = await payload.findByID({
        id: child.id,
        collection: nestedDocsPagesSlug,
        depth: 0,
        locale: 'all',
      })

      expect(localizedChild._h_slugPath).toEqual({
        de: 'katalog/startseite/dienstleistungen',
        en: 'catalog/home/services',
        es: 'catalogo/inicio/servicios',
      })
      expect(localizedChild._h_titlePath).toEqual({
        de: 'Katalog / Startseite / Dienstleistungen',
        en: 'Catalog / Home / Services',
        es: 'Catalogo / Inicio / Servicios',
      })
    })

    it('should localize both hierarchy path fields when only the title source is localized', async () => {
      const root = await payload.create({
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'published',
          parent: null,
          slug: 'home',
          title: 'Home',
        },
        locale: 'en',
      })

      await payload.update({
        id: root.id,
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'published',
          title: 'Inicio',
        },
        locale: 'es',
      })

      await payload.update({
        id: root.id,
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'published',
          title: 'Startseite',
        },
        locale: 'de',
      })

      const child = await payload.create({
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'published',
          parent: root.id,
          slug: 'services',
          title: 'Services',
        },
        locale: 'en',
      })

      await payload.update({
        id: child.id,
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'published',
          title: 'Servicios',
        },
        locale: 'es',
      })

      await payload.update({
        id: child.id,
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'published',
          title: 'Dienstleistungen',
        },
        locale: 'de',
      })

      const localizedChild = await payload.findByID({
        id: child.id,
        collection: localizedTitlePagesSlug,
        depth: 0,
        locale: 'all',
      })

      expect(localizedChild._h_slugPath).toEqual({
        de: 'home/services',
        en: 'home/services',
        es: 'home/services',
      })
      expect(localizedChild._h_titlePath).toEqual({
        de: 'Startseite / Dienstleistungen',
        en: 'Home / Services',
        es: 'Inicio / Servicios',
      })
    })

    it('should keep published child locale paths stable when the parent locale is drafted', async () => {
      const root = await payload.create({
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'published',
          parent: null,
          slug: 'home',
          title: 'Home',
        },
        locale: 'en',
      })

      await payload.update({
        id: root.id,
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'published',
          title: 'Inicio',
        },
        locale: 'es',
      })

      const child = await payload.create({
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'published',
          parent: root.id,
          slug: 'services',
          title: 'Services',
        },
        locale: 'en',
      })

      await payload.update({
        id: child.id,
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'published',
          title: 'Servicios',
        },
        locale: 'es',
      })

      const childBeforeDraft = await payload.findByID({
        id: child.id,
        collection: localizedTitlePagesSlug,
        depth: 0,
        locale: 'all',
      })

      await payload.update({
        id: root.id,
        collection: localizedTitlePagesSlug,
        data: {
          _status: 'draft',
          title: 'Inicio Draft',
        },
        locale: 'es',
      })

      const childAfterDraft = await payload.findByID({
        id: child.id,
        collection: localizedTitlePagesSlug,
        depth: 0,
        locale: 'all',
      })

      expect(childAfterDraft.updatedAt).toBe(childBeforeDraft.updatedAt)
      expect(childAfterDraft._h_slugPath).toEqual({
        en: 'home/services',
        es: 'home/services',
      })
      expect(childAfterDraft._h_titlePath).toEqual({
        en: 'Home / Services',
        es: 'Inicio / Servicios',
      })
    })
  })
})
