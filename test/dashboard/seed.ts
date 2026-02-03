import type { BasePayload } from 'payload'

import { devUser } from '@tools/test-utils/shared'

export const seed = async (payload: BasePayload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  // Create some sample data
  try {
    // Create sample tickets
    for (let i = 1; i <= 35; i++) {
      await payload.create({
        collection: 'tickets',
        data: {
          title: `Support Ticket #${i}`,
          description: `Sample ticket description for ticket ${i}`,
          status: ['open', 'in-progress', 'closed'][Math.floor(Math.random() * 3)],
          priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        },
      })
    }

    // Create sample revenue entries
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']
    for (const month of months) {
      for (let i = 1; i <= Math.floor(Math.random() * 10) + 5; i++) {
        await payload.create({
          collection: 'revenue',
          data: {
            amount: Math.floor(Math.random() * 10000) + 1000,
            description: `Revenue entry ${i} for ${month}`,
            date: `${month}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            category: ['sales', 'subscriptions', 'services', 'other'][
              Math.floor(Math.random() * 4)
            ],
            source: 'Sample data',
          },
        })
      }
    }

    // Create sample events
    const currentDate = new Date()
    for (let i = 1; i <= 550; i++) {
      const eventDate = new Date(currentDate)
      eventDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 365) - 180) // Random date within ±6 months

      await payload.create({
        collection: 'events',
        data: {
          title: `Event ${i}`,
          description: `Sample event description for event ${i}`,
          startDate: eventDate.toISOString(),
          type: ['meeting', 'conference', 'workshop', 'webinar', 'other'][
            Math.floor(Math.random() * 5)
          ],
          status: ['scheduled', 'in-progress', 'completed', 'cancelled'][
            Math.floor(Math.random() * 4)
          ],
          location: `Location ${i}`,
        },
      })
    }
  } catch (err) {
    console.error('Error creating sample data:', err)
  }
}
