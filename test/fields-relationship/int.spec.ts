import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Collection1 } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { collection1Slug, versionedRelationshipFieldSlug } from './slugs.js'

let payload: Payload
let restClient: NextRESTClient

const { email, password } = devUser

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Relationship Fields', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)

    await restClient.login({
      slug: 'users',
      credentials: {
        email,
        password,
      },
    })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('Versioned Relationship Field', () => {
    let version2ID: string
    const relatedDocName = 'Related Doc'
    beforeAll(async () => {
      const relatedDoc = await payload.create({
        collection: collection1Slug,
        data: {
          name: relatedDocName,
        },
      })

      const version1 = await payload.create({
        collection: versionedRelationshipFieldSlug,
        data: {
          title: 'Version 1 Title',
          relationshipField: {
            value: relatedDoc.id,
            relationTo: collection1Slug,
          },
        },
      })

      const version2 = await payload.update({
        collection: versionedRelationshipFieldSlug,
        id: version1.id,
        data: {
          title: 'Version 2 Title',
        },
      })

      const versions = await payload.findVersions({
        collection: versionedRelationshipFieldSlug,
        where: {
          parent: {
            equals: version2.id,
          },
        },
        sort: '-updatedAt',
        limit: 1,
      })

      version2ID = versions.docs[0].id
    })
    it('should return the correct versioned relationship field via REST', async () => {
      const version2Data = await restClient
        .GET(`/${versionedRelationshipFieldSlug}/versions/${version2ID}?locale=all`)
        .then((res) => res.json())

      expect(version2Data.version.title).toEqual('Version 2 Title')
      expect(version2Data.version.relationshipField[0].value.name).toEqual(relatedDocName)
    })

    it('should return the correct versioned relationship field via LocalAPI', async () => {
      const version2Data = await payload.findVersionByID({
        collection: versionedRelationshipFieldSlug,
        id: version2ID,
        locale: 'all',
      })

      expect(version2Data.version.title).toEqual('Version 2 Title')
      expect((version2Data.version.relationshipField[0].value as Collection1).name).toEqual(
        relatedDocName,
      )
    })
  })

  describe('Atomic Operations', () => {
    let relationDoc1: any
    let relationDoc2: any
    let relationDoc3: any
    let testDoc: any

    beforeAll(async () => {
      // Create test relation documents
      relationDoc1 = await payload.create({
        collection: 'relation-one',
        data: {
          name: 'Relation 1',
        },
      })

      relationDoc2 = await payload.create({
        collection: 'relation-one',
        data: {
          name: 'Relation 2',
        },
      })

      relationDoc3 = await payload.create({
        collection: 'relation-two',
        data: {
          name: 'Relation 3',
        },
      })

      // Create test document with initial relationships
      testDoc = await payload.create({
        collection: 'fields-relationship',
        data: {
          relationshipHasMany: [relationDoc1.id],
          relationshipHasManyMultiple: [{ relationTo: 'relation-one', value: relationDoc1.id }],
        },
      })
    })

    describe('$push operations', () => {
      it('should support $push on hasMany relationship fields', async () => {
        const result = await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {},
          operations: {
            $push: {
              relationshipHasMany: [relationDoc2.id],
            },
          },
          depth: 0,
        })

        expect(result.relationshipHasMany).toHaveLength(2)
        expect(result.relationshipHasMany).toContain(relationDoc1.id)
        expect(result.relationshipHasMany).toContain(relationDoc2.id)
      })

      it('should support $push on polymorphic hasMany relationship fields', async () => {
        const result = await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {},
          operations: {
            $push: {
              relationshipHasManyMultiple: [
                { relationTo: 'relation-one', value: relationDoc2.id },
                { relationTo: 'relation-two', value: relationDoc3.id },
              ],
            },
          },
          depth: 0,
        })

        expect(result.relationshipHasManyMultiple).toHaveLength(3)
        expect(result.relationshipHasManyMultiple).toContainEqual({
          relationTo: 'relation-one',
          value: relationDoc1.id,
        })
        expect(result.relationshipHasManyMultiple).toContainEqual({
          relationTo: 'relation-one',
          value: relationDoc2.id,
        })
        expect(result.relationshipHasManyMultiple).toContainEqual({
          relationTo: 'relation-two',
          value: relationDoc3.id,
        })
      })

      // Note: Array index paths (e.g., 'array.0.field') are not currently supported
      // This is a known limitation of the current field path resolution logic

      it('should support $push on nested hasMany relationship fields in groups', async () => {
        // First create initial relationships in the group
        await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {
            nestedGroup: {
              groupHasManyRelation: [{ relationTo: 'relation-one', value: relationDoc1.id }],
            },
          },
        })

        // Then push additional relationships to the nested group field
        const result = await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {},
          operations: {
            $push: {
              nestedGroup: {
                groupHasManyRelation: [{ relationTo: 'relation-two', value: relationDoc3.id }],
              },
            },
          },
          depth: 0,
        })

        expect(result.nestedGroup?.groupHasManyRelation).toHaveLength(2)
        expect(result.nestedGroup?.groupHasManyRelation).toContainEqual({
          relationTo: 'relation-one',
          value: relationDoc1.id,
        })
        expect(result.nestedGroup?.groupHasManyRelation).toContainEqual({
          relationTo: 'relation-two',
          value: relationDoc3.id,
        })
      })

      it('should allow updating nested text field via data while doing atomic operation on nested relationship field', async () => {
        // First create initial relationships in the group
        await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {
            nestedGroup: {
              groupTextField: 'initial text',
              groupHasManyRelation: [{ relationTo: 'relation-one', value: relationDoc1.id }],
            },
          },
        })

        // Then update text field via data while pushing to relationship field via operations
        const result = await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {
            nestedGroup: {
              groupTextField: 'updated text',
            },
          },
          operations: {
            $push: {
              nestedGroup: {
                groupHasManyRelation: [{ relationTo: 'relation-two', value: relationDoc3.id }],
              },
            },
          },
          depth: 0,
        })

        // Verify both changes were applied
        expect(result.nestedGroup?.groupTextField).toBe('updated text')
        expect(result.nestedGroup?.groupHasManyRelation).toHaveLength(2)
        expect(result.nestedGroup?.groupHasManyRelation).toContainEqual({
          relationTo: 'relation-one',
          value: relationDoc1.id,
        })
        expect(result.nestedGroup?.groupHasManyRelation).toContainEqual({
          relationTo: 'relation-two',
          value: relationDoc3.id,
        })
      })
    })

    describe('$remove operations', () => {
      it('should support $remove on hasMany relationship fields', async () => {
        // First add multiple items
        await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {
            relationshipHasMany: [relationDoc1.id, relationDoc2.id],
          },
        })

        // Then remove one
        const result = await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {},
          operations: {
            $remove: {
              relationshipHasMany: [relationDoc2.id],
            },
          },
          depth: 0,
        })

        expect(result.relationshipHasMany).toHaveLength(1)
        expect(result.relationshipHasMany).toContain(relationDoc1.id)
        expect(result.relationshipHasMany).not.toContain(relationDoc2.id)
      })

      it('should support $remove on polymorphic hasMany relationship fields', async () => {
        // First add multiple items
        await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {
            relationshipHasManyMultiple: [
              { relationTo: 'relation-one', value: relationDoc1.id },
              { relationTo: 'relation-one', value: relationDoc2.id },
              { relationTo: 'relation-two', value: relationDoc3.id },
            ],
          },
        })

        // Then remove one
        const result = await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {},
          operations: {
            $remove: {
              relationshipHasManyMultiple: [{ relationTo: 'relation-one', value: relationDoc2.id }],
            },
          },
          depth: 0,
        })

        expect(result.relationshipHasManyMultiple).toHaveLength(2)
        expect(result.relationshipHasManyMultiple).toContainEqual({
          relationTo: 'relation-one',
          value: relationDoc1.id,
        })
        expect(result.relationshipHasManyMultiple).toContainEqual({
          relationTo: 'relation-two',
          value: relationDoc3.id,
        })
        expect(result.relationshipHasManyMultiple).not.toContainEqual({
          relationTo: 'relation-one',
          value: relationDoc2.id,
        })
      })

      // Note: Array index paths (e.g., 'array.0.field') are not currently supported
      // This is a known limitation of the current field path resolution logic

      it('should support $remove on nested hasMany relationship fields in groups', async () => {
        // First create multiple relationships in the group
        await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {
            nestedGroup: {
              groupHasManyRelation: [
                { relationTo: 'relation-one', value: relationDoc1.id },
                { relationTo: 'relation-one', value: relationDoc2.id },
                { relationTo: 'relation-two', value: relationDoc3.id },
              ],
            },
          },
        })

        // Then remove one relationship from the nested group field
        const result = await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {},
          operations: {
            $remove: {
              nestedGroup: {
                groupHasManyRelation: [{ relationTo: 'relation-one', value: relationDoc2.id }],
              },
            },
          },
          depth: 0,
        })

        expect(result.nestedGroup?.groupHasManyRelation).toHaveLength(2)
        expect(result.nestedGroup?.groupHasManyRelation).toContainEqual({
          relationTo: 'relation-one',
          value: relationDoc1.id,
        })
        expect(result.nestedGroup?.groupHasManyRelation).toContainEqual({
          relationTo: 'relation-two',
          value: relationDoc3.id,
        })
        expect(result.nestedGroup?.groupHasManyRelation).not.toContainEqual({
          relationTo: 'relation-one',
          value: relationDoc2.id,
        })
      })
    })

    describe('Atomic operations with select', () => {
      it('should support $remove on hasMany fields even when field is not in select', async () => {
        // First add multiple items
        await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {
            relationshipHasMany: [relationDoc1.id, relationDoc2.id],
          },
        })

        // Remove one item with select that doesn't include the field being modified
        const result = await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {},
          operations: {
            $remove: {
              relationshipHasMany: [relationDoc2.id],
            },
          },
          select: {},
          depth: 0,
        })

        // The field should not be in the response due to select
        // @ts-expect-error - doing an invalid operation for testing
        expect(result.relationshipHasMany).toBeUndefined()

        // Verify the operation actually worked by fetching the document
        const verifyDoc = await payload.findByID({
          collection: 'fields-relationship',
          id: testDoc.id,
          depth: 0,
        })

        expect(verifyDoc.relationshipHasMany).toHaveLength(1)
        expect(verifyDoc.relationshipHasMany).toContain(relationDoc1.id)
        expect(verifyDoc.relationshipHasMany).not.toContain(relationDoc2.id)
      })

      it('should support $push on hasMany fields even when field is not in select', async () => {
        // Reset to single item
        await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {
            relationshipHasMany: [relationDoc1.id],
          },
        })

        // Push a new item with select that doesn't include the field being modified
        const result = await payload.update({
          collection: 'fields-relationship',
          id: testDoc.id,
          data: {},
          operations: {
            $push: {
              relationshipHasMany: [relationDoc2.id],
            },
          },
          select: {},
          depth: 0,
        })

        // The field should not be in the response due to select
        // @ts-expect-error - doing an invalid operation for testing
        expect(result.relationshipHasMany).toBeUndefined()

        // Verify the operation actually worked by fetching the document
        const verifyDoc = await payload.findByID({
          collection: 'fields-relationship',
          id: testDoc.id,
          depth: 0,
        })

        expect(verifyDoc.relationshipHasMany).toHaveLength(2)
        expect(verifyDoc.relationshipHasMany).toContain(relationDoc1.id)
        expect(verifyDoc.relationshipHasMany).toContain(relationDoc2.id)
      })
    })

    describe('Bulk update with atomic operations', () => {
      let bulkTestDoc1: any
      let bulkTestDoc2: any
      let bulkTestDoc3: any

      beforeAll(async () => {
        // Create multiple test documents for bulk operations
        bulkTestDoc1 = await payload.create({
          collection: 'fields-relationship',
          data: {
            relationshipHasMany: [relationDoc1.id],
          },
        })

        bulkTestDoc2 = await payload.create({
          collection: 'fields-relationship',
          data: {
            relationshipHasMany: [relationDoc1.id],
          },
        })

        bulkTestDoc3 = await payload.create({
          collection: 'fields-relationship',
          data: {
            relationshipHasMany: [relationDoc1.id, relationDoc2.id],
          },
        })
      })

      it('should support $push on multiple documents', async () => {
        const result = await payload.update({
          collection: 'fields-relationship',
          where: {
            id: {
              in: [bulkTestDoc1.id, bulkTestDoc2.id],
            },
          },
          data: {},
          operations: {
            $push: {
              relationshipHasMany: [relationDoc2.id],
            },
          },
          depth: 0,
        })

        expect(result.docs).toHaveLength(2)
        expect(result.errors).toHaveLength(0)

        // Verify both documents were updated
        for (const doc of result.docs) {
          expect(doc.relationshipHasMany).toHaveLength(2)
          expect(doc.relationshipHasMany).toContain(relationDoc1.id)
          expect(doc.relationshipHasMany).toContain(relationDoc2.id)
        }
      })

      it('should support $remove on multiple documents', async () => {
        const result = await payload.update({
          collection: 'fields-relationship',
          where: {
            id: {
              in: [bulkTestDoc1.id, bulkTestDoc2.id, bulkTestDoc3.id],
            },
          },
          data: {},
          operations: {
            $remove: {
              relationshipHasMany: [relationDoc2.id],
            },
          },
          depth: 0,
        })

        expect(result.docs).toHaveLength(3)
        expect(result.errors).toHaveLength(0)

        // Verify all documents were updated correctly
        for (const doc of result.docs) {
          expect(doc.relationshipHasMany).not.toContain(relationDoc2.id)

          switch (doc.id) {
            case bulkTestDoc1.id:
              expect(doc.relationshipHasMany).toHaveLength(1)
              expect(doc.relationshipHasMany).toContain(relationDoc1.id)
              break
            case bulkTestDoc2.id:
              expect(doc.relationshipHasMany).toHaveLength(1)
              expect(doc.relationshipHasMany).toContain(relationDoc1.id)
              break
            case bulkTestDoc3.id:
              expect(doc.relationshipHasMany).toHaveLength(1)
              expect(doc.relationshipHasMany).toContain(relationDoc1.id)
              break
          }
        }
      })

      it('should support bulk update with atomic operations and select', async () => {
        // Reset documents
        await payload.update({
          collection: 'fields-relationship',
          where: {
            id: {
              in: [bulkTestDoc1.id, bulkTestDoc2.id],
            },
          },
          data: {
            relationshipHasMany: [relationDoc1.id],
          },
        })

        // Perform bulk update with select that doesn't include the modified field
        const result = await payload.update({
          collection: 'fields-relationship',
          where: {
            id: {
              in: [bulkTestDoc1.id, bulkTestDoc2.id],
            },
          },
          data: {},
          operations: {
            $push: {
              relationshipHasMany: [relationDoc3.id],
            },
          },
          select: {},
          depth: 0,
        })

        expect(result.docs).toHaveLength(2)
        expect(result.errors).toHaveLength(0)

        // Fields should not be in response due to select
        for (const doc of result.docs) {
          // @ts-expect-error - doing an invalid operation for testing
          expect(doc.relationshipHasMany).toBeUndefined()
        }

        // Verify operations actually worked
        const verifyDoc1 = await payload.findByID({
          collection: 'fields-relationship',
          id: bulkTestDoc1.id,
          depth: 0,
        })

        expect(verifyDoc1.relationshipHasMany).toHaveLength(2)
        expect(verifyDoc1.relationshipHasMany).toContain(relationDoc1.id)
        expect(verifyDoc1.relationshipHasMany).toContain(relationDoc3.id)
      })
    })

    describe('Error handling', () => {
      it('should reject $push operations on non-hasMany relationship fields', async () => {
        await expect(
          payload.update({
            collection: 'fields-relationship',
            id: testDoc.id,
            data: {},
            operations: {
              $push: {
                // @ts-expect-error - doing an invalid operation for testing
                relationship: [relationDoc1.id],
              },
            },
          }),
        ).rejects.toThrow(
          'Invalid atomic operations: Field "relationship" of type "relationship" does not support atomic operations',
        )
      })

      it('should reject $remove operations on non-hasMany relationship fields', async () => {
        await expect(
          payload.update({
            collection: 'fields-relationship',
            id: testDoc.id,
            data: {},
            operations: {
              $remove: {
                // @ts-expect-error - doing an invalid operation for testing
                relationship: [relationDoc1.id],
              },
            },
          }),
        ).rejects.toThrow(
          'Invalid atomic operations: Field "relationship" of type "relationship" does not support atomic operations',
        )
      })

      it('should detect field conflicts between data and operations', async () => {
        await expect(
          payload.update({
            collection: 'fields-relationship',
            id: testDoc.id,
            data: {
              relationshipHasMany: [relationDoc1.id],
            },
            operations: {
              $push: {
                relationshipHasMany: [relationDoc2.id],
              },
            },
          }),
        ).rejects.toThrow('Field conflicts detected')
      })

      it('should reject $push operations on nested non-hasMany relationship fields', async () => {
        await expect(
          payload.update({
            collection: 'fields-relationship',
            id: testDoc.id,
            data: {},
            operations: {
              $push: {
                nestedGroup: {
                  // @ts-expect-error - doing an invalid operation for testing
                  nonExistentField: [relationDoc1.id],
                },
              },
            },
          }),
        ).rejects.toThrow('not found in schema')
      })
    })
  })
})
