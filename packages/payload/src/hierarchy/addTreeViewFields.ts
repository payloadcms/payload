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
      async ({ doc, previousDoc, previousDocWithLocales, req }) => {
        // handle this better later
        const reqLocale = req.locale
        if (reqLocale === 'all') {
          return
        }
        const { newParentID, newSlug, parentChanged, prevParentID, prevSlug, slugChanged } =
          getTreeChanges({ doc, parentDocFieldName, previousDoc, slugify, titleFieldName })

        if (parentChanged || slugChanged) {
          /**
           * should look like:
           *
           * {
           *   [slugPathFieldName]: {
           *     [locale]: updatedSlugPath
           *   },
           *   [titlePathFieldName]: {
           *     [locale]: updatedTitlePath
           *   },
           *   _parentTree: updatedParentTree,
           * }
           */
          const dataToUpdateDoc: {
            _parentTree: (number | string)[]
            slugPath: {
              [locale: string]: string
            }
            titlePath: {
              [locale: string]: string
            }
          } = {
            _parentTree: [],
            slugPath: {},
            titlePath: {},
          }

          if (parentChanged) {
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

              dataToUpdateDoc._parentTree = [...(newParentFullDoc?._parentTree || []), newParentID]
              req.payload.config.localization.localeCodes.forEach((locale: string) => {
                const slugPrefix =
                  newParentFullDoc?.[slugPathFieldName]?.[locale] ||
                  newParentFullDoc?.[slugPathFieldName]?.[
                    req.payload.config.localization.defaultLocale
                  ] ||
                  ''
                const titlePrefix =
                  newParentFullDoc?.[titlePathFieldName]?.[locale] ||
                  newParentFullDoc?.[titlePathFieldName]?.[
                    req.payload.config.localization.defaultLocale
                  ] ||
                  ''
                if (reqLocale === locale) {
                  dataToUpdateDoc.slugPath[locale] = `${slugPrefix}/${slugify(doc[titleFieldName])}`
                  dataToUpdateDoc.titlePath[locale] = `${titlePrefix}/${doc[titleFieldName]}`
                } else {
                  // use prev title on previousDocWithLocales
                  dataToUpdateDoc.slugPath[locale] =
                    `${slugPrefix}/${slugify(previousDocWithLocales?.[titleFieldName]?.[locale] ? previousDocWithLocales[titleFieldName][locale] : doc[titleFieldName])}`
                  dataToUpdateDoc.titlePath[locale] =
                    `${titlePrefix}/${previousDocWithLocales?.[titleFieldName]?.[locale] ? previousDocWithLocales[titleFieldName][locale] : doc[titleFieldName]}`
                }
              })
            } else {
              // removed parent
              dataToUpdateDoc._parentTree = []
              req.payload.config.localization.localeCodes.forEach((locale: string) => {
                if (reqLocale === locale) {
                  // use current title on doc
                  dataToUpdateDoc.slugPath[locale] = slugify(doc[titleFieldName])
                  dataToUpdateDoc.titlePath[locale] = doc[titleFieldName]
                } else {
                  // use prev title on previousDocWithLocales
                  dataToUpdateDoc.slugPath[locale] = slugify(
                    previousDocWithLocales?.[titleFieldName]?.[locale]
                      ? previousDocWithLocales[titleFieldName][locale]
                      : doc[titleFieldName],
                  )
                  dataToUpdateDoc.titlePath[locale] = previousDocWithLocales?.[titleFieldName]?.[
                    locale
                  ]
                    ? previousDocWithLocales[titleFieldName][locale]
                    : doc[titleFieldName]
                }
              })
            }
          } else {
            // only the title field was updated
            let prevParentDoc: Document
            if (prevParentID) {
              // has parent
              prevParentDoc = await req.payload.findByID({
                id: prevParentID,
                collection: collectionConfig.slug,
                depth: 0,
                locale: 'all',
                req,
                select: {
                  _parentTree: true,
                  [slugPathFieldName]: true,
                  [titleFieldName]: true,
                  [titlePathFieldName]: true,
                },
              })
            }

            dataToUpdateDoc._parentTree = prevParentDoc
              ? [...(prevParentDoc._parentTree || []), prevParentID]
              : []
            req.payload.config.localization.localeCodes.forEach((locale: string) => {
              const slugPrefix = prevParentDoc?.[slugPathFieldName]?.[locale]
                ? prevParentDoc[slugPathFieldName][locale]
                : ''
              const titlePrefix = prevParentDoc?.[titlePathFieldName]?.[locale]
                ? prevParentDoc[titlePathFieldName][locale]
                : ''
              if (reqLocale === locale) {
                dataToUpdateDoc.slugPath[locale] =
                  `${slugPrefix ? `${slugPrefix}/` : ''}${slugify(doc[titleFieldName])}`
                dataToUpdateDoc.titlePath[locale] =
                  `${titlePrefix ? `${titlePrefix}/` : ''}${doc[titleFieldName]}`
              } else {
                // use prev title on previousDocWithLocales
                dataToUpdateDoc.slugPath[locale] =
                  `${slugPrefix ? `${slugPrefix}/` : ''}${slugify(previousDocWithLocales?.[titleFieldName]?.[locale] ? previousDocWithLocales[titleFieldName][locale] : doc[titleFieldName])}`
                dataToUpdateDoc.titlePath[locale] =
                  `${titlePrefix ? `${titlePrefix}/` : ''}${previousDocWithLocales?.[titleFieldName]?.[locale] ? previousDocWithLocales[titleFieldName][locale] : doc[titleFieldName]}`
              }
            })
          }

          const documentAfterUpdate = await req.payload.db.updateOne({
            id: doc.id,
            collection: collectionConfig.slug,
            data: {
              _parentTree: dataToUpdateDoc._parentTree,
              [slugPathFieldName]: dataToUpdateDoc.slugPath,
              [titlePathFieldName]: dataToUpdateDoc.titlePath,
            },
            locale: 'all',
            req,
            select: {
              _parentTree: true,
              [slugPathFieldName]: true,
              [titleFieldName]: true,
              [titlePathFieldName]: true,
            },
          })

          const updatedSlugPath = documentAfterUpdate[slugPathFieldName][reqLocale!]
          const updatedTitlePath = documentAfterUpdate[titlePathFieldName][reqLocale!]
          const updatedParentTree = documentAfterUpdate._parentTree

          const affectedDocs = await req.payload.find({
            collection: collectionConfig.slug,
            depth: 0,
            limit: 200,
            locale: 'all',
            req,
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
                  _parentTree: [...(doc._parentTree || []), doc.id],
                  [slugPathFieldName]:
                    req.payload.config.localization.localeCodes.reduce<JsonObject>(
                      (acc: JsonObject, locale: string) => {
                        const prefix =
                          documentAfterUpdate?.[slugPathFieldName]?.[locale] ||
                          documentAfterUpdate?.[slugPathFieldName]?.[
                            req.payload.config.localization.defaultLocale
                          ]
                        const slug =
                          affectedDoc?.[titleFieldName]?.[locale] ||
                          affectedDoc[titleFieldName][req.payload.config.localization.defaultLocale]
                        acc[locale] = `${prefix}/${slugify(slug)}`
                        return acc
                      },
                      {},
                    ),
                  [titlePathFieldName]:
                    req.payload.config.localization.localeCodes.reduce<JsonObject>(
                      (acc: JsonObject, locale: string) => {
                        const prefix =
                          documentAfterUpdate?.[titlePathFieldName]?.[locale] ||
                          documentAfterUpdate?.[titlePathFieldName]?.[
                            req.payload.config.localization.defaultLocale
                          ]
                        const title =
                          affectedDoc?.[titleFieldName]?.[locale] ||
                          affectedDoc[titleFieldName][req.payload.config.localization.defaultLocale]
                        acc[locale] = `${prefix}/${title}`
                        return acc
                      },
                      {},
                    ),
                },
                locale: 'all',
                req,
              }),
            )
          })

          await Promise.all(updatePromises)

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
