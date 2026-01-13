/**
 * Test script to verify MongoDB connection and vector search functionality
 *
 * Usage:
 *   pnpm tsx scripts/test-mongodb-connection.ts
 */

import mongoose from 'mongoose'

export async function testConnection(url: string) {
  console.log('🔌 Connecting to MongoDB...')
  console.log('   url:', url.replace(/:[^:@]+@/, ':****@'))

  try {
    await mongoose.connect(url)
    console.log('✅ Connected successfully!\n')

    // Test 1: Basic ping
    console.log('📍 Test 1: Ping')
    const adminDb = mongoose.connection.db.admin()
    const pingResult = await adminDb.ping()
    console.log('   Ping result:', pingResult.ok === 1 ? 'OK' : 'FAILED')

    // Test 2: Replica set status
    console.log('\n📍 Test 2: Replica Set Status')
    try {
      const rsStatus = await adminDb.command({ replSetGetStatus: 1 })
      const primary = rsStatus.members?.find((m: any) => m.stateStr === 'PRIMARY')
      console.log('   Replica set:', rsStatus.set)
      console.log('   Primary:', primary?.name || 'none')
    } catch (e: any) {
      console.log('   Error:', e.message)
    }

    // Test 3: Transaction
    console.log('\n📍 Test 3: Transaction')
    const session = await mongoose.startSession()
    const TestModel =
      mongoose.models.TransactionTest ||
      mongoose.model('TransactionTest', new mongoose.Schema({ name: String }))

    await session.withTransaction(async () => {
      // @ts-expect-error
      await TestModel.create([{ name: 'transaction-test-' + Date.now() }], { session })
    })
    await session.endSession()
    console.log('   Transaction: OK')

    // Test 4: Search Index (requires mongot)
    console.log('\n📍 Test 4: Search Index')
    const db = mongoose.connection.db
    const searchTestColl = db.collection('search_test')

    // Insert test document
    await searchTestColl.deleteMany({})
    await searchTestColl.insertOne({
      title: 'MongoDB Vector Search Test',
      content: 'Testing vector search with mongot',
    })

    try {
      // Create search index
      await db.command({
        createSearchIndexes: 'search_test',
        indexes: [
          {
            name: 'text_search',
            definition: {
              mappings: { dynamic: true },
            },
          },
        ],
      })
      console.log('   Search index created: OK')
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log('   Search index: Already exists')
      } else {
        console.log('   Search index error:', e.message)
      }
    }

    // Wait for index to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Test search query
    try {
      const searchResults = await searchTestColl
        .aggregate([{ $search: { text: { query: 'vector', path: { wildcard: '*' } } } }])
        .toArray()
      console.log('   $search query: OK (found', searchResults.length, 'results)')
    } catch (e: any) {
      console.log('   $search query error:', e.message)
    }

    // Test 5: Vector Search Index
    console.log('\n📍 Test 5: Vector Search')
    const vectorColl = db.collection('vector_test')

    // Insert document with embedding
    await vectorColl.deleteMany({})
    const embedding = Array.from({ length: 128 }, () => Math.random())
    await vectorColl.insertOne({
      title: 'Vector Document',
      embedding,
    })

    try {
      // Create vector search index
      await db.command({
        createSearchIndexes: 'vector_test',
        indexes: [
          {
            name: 'vector_index',
            type: 'vectorSearch',
            definition: {
              fields: [
                {
                  type: 'vector',
                  path: 'embedding',
                  numDimensions: 128,
                  similarity: 'cosine',
                },
              ],
            },
          },
        ],
      })
      console.log('   Vector index created: OK')
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log('   Vector index: Already exists')
      } else {
        console.log('   Vector index error:', e.message)
      }
    }

    // Wait for index to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Test vector search query
    try {
      const vectorResults = await vectorColl
        .aggregate([
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector: embedding,
              numCandidates: 10,
              limit: 5,
            },
          },
          {
            $project: {
              title: 1,
              score: { $meta: 'vectorSearchScore' },
            },
          },
        ])
        .toArray()
      console.log('   $vectorSearch query: OK (found', vectorResults.length, 'results)')
      if (vectorResults.length > 0) {
        console.log('   Top result score:', vectorResults[0].score)
      }
    } catch (e: any) {
      console.log('   $vectorSearch query error:', e.message)
    }

    // Cleanup
    await searchTestColl.drop().catch(() => {})
    await vectorColl.drop().catch(() => {})
    await TestModel.collection.drop().catch(() => {})

    console.log('\n✅ All tests completed!')
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected.')
  }
}
