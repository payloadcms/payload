import type { CollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { Document, JsonObject } from '../types/index.js'

type AddTreeViewFieldsArgs = {
  collectionConfig: CollectionConfig
  parentDocFieldName?: string
  slugify?: (text: string) => string
  slugPathFieldName?: string
  titleFieldName: string
  titlePathFieldName?: string
}

export function addTreeViewFields({
  collectionConfig,
  parentDocFieldName = '_parentDoc',
  slugify = defaultSlugify,
  slugPathFieldName = 'slugPath',
  titleFieldName = 'title',
  titlePathFieldName = 'titlePath',
}: AddTreeViewFieldsArgs): void {
  collectionConfig.fields.push({
    type: 'group',
    fields: [
      {
        name: parentDocFieldName,
        type: 'relationship',
        admin: {
          disableBulkEdit: true,
        },
        filterOptions: ({ id }) => {
          return {
            id: {
              not_in: [id],
            },
          }
        },
        index: true,
        label: 'Parent Document',
        maxDepth: 0,
        relationTo: collectionConfig.slug,
      },
      {
        name: '_parentTree',
        type: 'relationship',
        admin: {
          isSortable: false,
          readOnly: true,
          // hidden: true,
        },
        hasMany: true,
        index: true,
        maxDepth: 0,
        relationTo: collectionConfig.slug,
      },
      {
        name: slugPathFieldName,
        type: 'text',
        admin: {
          // readOnly: true,
          // hidden: true,
        },
        index: true,
        label: ({ t }) => t('general:slugPath'),
        localized: true,
      },
      {
        name: titlePathFieldName,
        type: 'text',
        admin: {
          // readOnly: true,
          // hidden: true,
        },
        index: true,
        label: ({ t }) => t('general:titlePath'),
        localized: true,
      },
    ],
  })

  collectionConfig.hooks = {
    ...(collectionConfig.hooks || {}),
    afterChange: [
      async ({ data, doc, previousDoc, previousDocWithLocales, req }) => {
        // handle this better later
        if (req.locale === 'all') {
          return
        }
        const { newParentID, newSlug, parentChanged, prevParentID, prevSlug, slugChanged } =
          getTreeChanges({ doc, parentDocFieldName, previousDoc, slugify, titleFieldName })

        if (parentChanged || slugChanged) {
          let updatedSlugPath
          let updatedTitlePath
          let updatedParentTree
          if (parentChanged) {
            const updatedSlugPaths: Record<string, string> = {}
            const updatedTitlePaths: Record<string, string> = {}
            let documentAfterUpdate: JsonObject & TypeWithID = { id: doc.id }

            if (newParentID) {
              // query new parent
              const newParentFullDoc = await req.payload.findByID({
                id: newParentID,
                collection: collectionConfig.slug,
                depth: 0,
                locale: 'all',
                select: {
                  _parentTree: true,
                  [slugPathFieldName]: true,
                  [titlePathFieldName]: true,
                },
              })

              Object.entries(newParentFullDoc).forEach(([key, fieldValue]) => {
                if (key === slugPathFieldName) {
                  // assuming localization here for now
                  Object.entries(fieldValue as Record<string, string>).forEach(
                    ([locale, localizedParentSlugPath]) => {
                      updatedSlugPaths[locale] =
                        `${localizedParentSlugPath}/${slugify(previousDocWithLocales[titleFieldName][locale])}`
                    },
                  )
                } else if (key === titlePathFieldName) {
                  Object.entries(fieldValue as Record<string, string>).forEach(
                    ([locale, localizedParentTitlePath]) => {
                      updatedTitlePaths[locale] =
                        `${localizedParentTitlePath}/${previousDocWithLocales[titleFieldName][locale]}`
                    },
                  )
                }
              })

              // update current document
              documentAfterUpdate = await req.payload.db.updateOne({
                id: doc.id,
                collection: collectionConfig.slug,
                data: {
                  _parentTree: [...(newParentFullDoc?._parentTree || []), newParentID],
                  [slugPathFieldName]: updatedSlugPaths,
                  [titlePathFieldName]: updatedTitlePaths,
                },
                locale: 'all',
                req,
                select: {
                  _parentTree: true,
                  [slugPathFieldName]: true,
                  [titlePathFieldName]: true,
                },
              })
            } else {
              // removed parent

              // update current document
              documentAfterUpdate = await req.payload.db.updateOne({
                id: doc.id,
                collection: collectionConfig.slug,
                data: {
                  _parentTree: [],
                  [slugPathFieldName]: Object.keys(
                    previousDocWithLocales[titleFieldName],
                  ).reduce<JsonObject>((acc, locale) => {
                    if (req.locale === locale) {
                      acc[locale] = slugify(doc[titleFieldName])
                    } else {
                      acc[locale] = slugify(previousDocWithLocales[titleFieldName][locale])
                    }
                    return acc
                  }, {}),
                  [titlePathFieldName]: Object.keys(
                    previousDocWithLocales[titleFieldName],
                  ).reduce<JsonObject>((acc, locale) => {
                    if (req.locale === locale) {
                      acc[locale] = doc[titleFieldName]
                    } else {
                      acc[locale] = previousDocWithLocales[titleFieldName][locale]
                    }
                    return acc
                  }, {}),
                },
                locale: 'all',
                req,
                select: {
                  _parentTree: true,
                  [slugPathFieldName]: true,
                  [titlePathFieldName]: true,
                },
              })
            }

            updatedSlugPath = documentAfterUpdate[slugPathFieldName][req.locale!]
            updatedTitlePath = documentAfterUpdate[titlePathFieldName][req.locale!]
            updatedParentTree = documentAfterUpdate._parentTree

            const affectedDocs = await req.payload.find({
              collection: collectionConfig.slug,
              depth: 0,
              limit: 200,
              locale: 'all',
              select: {
                [titleFieldName]: true,
              },
              where: {
                _parentTree: {
                  in: [doc.id],
                },
              },
            })

            const updatePromises: Promise<JsonObject & TypeWithID>[] = []
            affectedDocs.docs.forEach((affectedDoc) => {
              updatePromises.push(
                // this pattern has an issue bc it will not run hooks on the affected documents
                // if we use payload.update, then we will need to loop over `n` locales and run 1 update per locale
                req.payload.db.updateOne({
                  id: affectedDoc.id,
                  collection: collectionConfig.slug,
                  data: {
                    _parentTree: [...(documentAfterUpdate._parentTree || []), doc.id],
                    [slugPathFieldName]: Object.keys(
                      affectedDoc[titleFieldName],
                    ).reduce<JsonObject>((acc, locale) => {
                      acc[locale] =
                        `${documentAfterUpdate[slugPathFieldName][locale]}/${slugify(affectedDoc[titleFieldName][locale])}`
                      return acc
                    }, {}),
                    [titlePathFieldName]: Object.keys(
                      affectedDoc[titleFieldName],
                    ).reduce<JsonObject>((acc, locale) => {
                      acc[locale] =
                        `${documentAfterUpdate[titlePathFieldName][locale]}/${affectedDoc[titleFieldName][locale]}`
                      return acc
                    }, {}),
                  },
                  locale: 'all',
                  req,
                }),
              )
            })
            await Promise.all(updatePromises)
          } else {
            // just slug changed (no localization needed)
            let updatedDocument = doc
            let prevParentDoc
            if (prevParentID) {
              // has parent
              prevParentDoc = await req.payload.findByID({
                id: prevParentID,
                collection: collectionConfig.slug,
                depth: 0,
                locale: req.locale,
                req,
                select: {
                  _parentTree: true,
                  [slugPathFieldName]: true,
                  [titleFieldName]: true,
                },
              })
            }

            updatedDocument = await req.payload.update({
              id: doc.id,
              collection: collectionConfig.slug,
              data: {
                [slugPathFieldName]: prevParentDoc
                  ? `${prevParentDoc[slugPathFieldName]}/${newSlug}`
                  : newSlug,
                [titlePathFieldName]: prevParentDoc
                  ? `${prevParentDoc[titlePathFieldName]}/${doc[titleFieldName]}`
                  : doc[titleFieldName],
              },
              depth: 0,
              locale: req.locale,
              req,
              select: {
                _parentTree: true,
                [slugPathFieldName]: true,
                [titleFieldName]: true,
              },
            })

            updatedSlugPath = updatedDocument[slugPathFieldName]
            updatedTitlePath = updatedDocument[titleFieldName]
            updatedParentTree = updatedDocument._parentTree

            const affectedDocs = await req.payload.find({
              collection: collectionConfig.slug,
              depth: 0,
              limit: 200,
              select: {
                [titleFieldName]: true,
              },
              where: {
                _parentTree: {
                  in: [doc.id],
                },
              },
            })

            const updatePromises: Promise<JsonObject & TypeWithID>[] = []
            affectedDocs.docs.forEach((affectedDoc) => {
              updatePromises.push(
                // this pattern has an issue bc it will not run hooks on the affected documents
                // if we use payload.update, then we will need to loop over `n` locales and run 1 update per locale
                req.payload.update({
                  id: affectedDoc.id,
                  collection: collectionConfig.slug,
                  data: {
                    _parentTree: [...(doc._parentTree || []), doc.id],
                    [slugPathFieldName]: `${updatedDocument[slugPathFieldName]}/${slugify(affectedDoc[titleFieldName])}`,
                    [titlePathFieldName]: `${updatedDocument[titlePathFieldName]}/${affectedDoc[titleFieldName]}`,
                  },
                  depth: 0,
                  req,
                }),
              )
            })

            await Promise.all(updatePromises)
          }

          if (updatedSlugPath) {
            doc[slugPathFieldName] = updatedSlugPath
          }
          if (updatedTitlePath) {
            doc[titlePathFieldName] = updatedTitlePath
          }
          if (parentChanged) {
            doc._parentTree = updatedParentTree
          }

          return doc
        }
      },
      // specifically run other hooks _after_ the document tree is updated
      ...(collectionConfig.hooks?.afterChange || []),
    ],
  }
}

// default slugify function
const defaultSlugify = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/\W+/g, '-') // Replace spaces and non-word chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

type GetTreeChanges = {
  doc: Document
  parentDocFieldName: string
  previousDoc: Document
  slugify: (text: string) => string
  titleFieldName: string
}

type GetTreeChangesResult = {
  newParentID: null | number | string | undefined
  newSlug: string | undefined
  parentChanged: boolean
  prevParentID: null | number | string | undefined
  prevSlug: string | undefined
  slugChanged: boolean
}

function getTreeChanges({
  doc,
  parentDocFieldName,
  previousDoc,
  slugify,
  titleFieldName,
}: GetTreeChanges): GetTreeChangesResult {
  const prevParentID = previousDoc[parentDocFieldName] || null
  const newParentID = doc[parentDocFieldName] || null
  const newSlug = doc[titleFieldName] ? slugify(doc[titleFieldName]) : undefined
  const prevSlug = previousDoc[titleFieldName] ? slugify(previousDoc[titleFieldName]) : undefined

  return {
    newParentID,
    newSlug,
    parentChanged: prevParentID !== newParentID,
    prevParentID,
    prevSlug,
    slugChanged: newSlug !== prevSlug,
  }
}
