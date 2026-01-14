import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { nonUniqueSortSlug } from './collections/NonUniqueSort/index.js'

export async function seedSortable(payload: Payload) {
  await payload.delete({ collection: 'orderable', where: {} })
  await payload.delete({ collection: 'orderable-join', where: {} })

  const joinA = await payload.create({ collection: 'orderable-join', data: { title: 'Join A' } })

  await executePromises(
    [
      { title: 'A', orderableField: joinA.id },
      { title: 'B', orderableField: joinA.id },
      { title: 'C', orderableField: joinA.id },
      { title: 'D', orderableField: joinA.id },
    ].map(
      (data) => async () =>
        payload.create({
          collection: 'orderable',
          data,
        }),
    ),
  )

  await payload.create({ collection: 'orderable-join', data: { title: 'Join B' } })

  // Create 10 items to be sorted by non-unique field
  for (const i of Array.from({ length: 10 }, (_, index) => index)) {
    let order = 1

    if (i > 3) {
      order = 2
    } else if (i > 6) {
      order = 3
    }

    await payload.create({
      collection: nonUniqueSortSlug,
      data: {
        title: `Post ${i}`,
        order,
      },
    })

    // Wait 2 seconds to guarantee that the createdAt date is different
    // await wait(2000)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
}

export const seed = async (_payload: Payload) => {
  await executePromises([
    () =>
      _payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
        depth: 0,
        overrideAccess: true,
      }),
    () => seedSortable(_payload),
  ])
}
