import type { BasePayload } from 'payload'

import { devUser } from '../credentials.js'

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
          description: `Sample ticket description for ticket ${i}`,
          priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
          status: ['open', 'in-progress', 'closed'][Math.floor(Math.random() * 3)],
          title: `Support Ticket #${i}`,
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
            category: ['sales', 'subscriptions', 'services', 'other'][
              Math.floor(Math.random() * 4)
            ],
            date: `${month}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            description: `Revenue entry ${i} for ${month}`,
            source: 'Sample data',
          },
        })
      }
    }

    // Create sample events
    const currentDate = new Date()
    // Demo events span past and future so the "Event timeline" widget can render both
    // relative directions ("... ago" and "in ...") and overflow the widget height cap.
    const dashboardEventOffsets = [
      { amount: -6, unit: 'months' },
      { amount: -3, unit: 'months' },
      { amount: -1, unit: 'months' },
      { amount: -2, unit: 'weeks' },
      { amount: -1, unit: 'weeks' },
      { amount: -4, unit: 'days' },
      { amount: -2, unit: 'days' },
      { amount: -5, unit: 'hours' },
      { amount: -2, unit: 'hours' },
      { amount: -30, unit: 'minutes' },
      { amount: -5, unit: 'minutes' },
      { amount: 5, unit: 'minutes' },
      { amount: 30, unit: 'minutes' },
      { amount: 2, unit: 'hours' },
      { amount: 5, unit: 'hours' },
      { amount: 2, unit: 'days' },
      { amount: 4, unit: 'days' },
      { amount: 1, unit: 'weeks' },
      { amount: 2, unit: 'weeks' },
      { amount: 1, unit: 'months' },
      { amount: 3, unit: 'months' },
      { amount: 6, unit: 'months' },
    ]

    for (const [index, offset] of dashboardEventOffsets.entries()) {
      const eventDate = new Date(currentDate)

      if (offset.unit === 'minutes') {
        eventDate.setMinutes(currentDate.getMinutes() + offset.amount)
      }

      if (offset.unit === 'hours') {
        eventDate.setHours(currentDate.getHours() + offset.amount)
      }

      if (offset.unit === 'days') {
        eventDate.setDate(currentDate.getDate() + offset.amount)
      }

      if (offset.unit === 'weeks') {
        eventDate.setDate(currentDate.getDate() + offset.amount * 7)
      }

      if (offset.unit === 'months') {
        eventDate.setMonth(currentDate.getMonth() + offset.amount)
      }

      await payload.create({
        collection: 'events',
        data: {
          type: 'workshop',
          description: `Dashboard demo event ${index + 1}`,
          location: 'Dashboard demo',
          startDate: eventDate.toISOString(),
          status: 'scheduled',
          title: `Dashboard Event ${index + 1}`,
        },
      })
    }

    // Dedicated events for the "Events by priority" widget, which sorts by the nested
    // `details.priority` field. Priorities are intentionally unordered so a descending sort
    // produces a deterministic order (30, 20, 10, 5) the e2e test can assert.
    const nestedDemoPriorities = [10, 30, 20, 5]
    for (const [index, priority] of nestedDemoPriorities.entries()) {
      await payload.create({
        collection: 'events',
        data: {
          type: 'workshop',
          description: `Nested field demo event ${index + 1}`,
          details: {
            priority,
            room: `Room ${priority}`,
          },
          location: 'Nested field demo',
          startDate: currentDate.toISOString(),
          status: 'scheduled',
          title: `Nested Event ${index + 1}`,
        },
      })
    }

    for (let i = 1; i <= 550; i++) {
      const eventDate = new Date(currentDate)
      eventDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 365) - 180) // Random date within ±6 months

      await payload.create({
        collection: 'events',
        data: {
          type: ['meeting', 'conference', 'workshop', 'webinar', 'other'][
            Math.floor(Math.random() * 5)
          ],
          description: `Sample event description for event ${i}`,
          location: `Location ${i}`,
          startDate: eventDate.toISOString(),
          status: ['scheduled', 'in-progress', 'completed', 'cancelled'][
            Math.floor(Math.random() * 4)
          ],
          title: `Event ${i}`,
        },
      })
    }
  } catch (err) {
    console.error('Error creating sample data:', err)
  }
}
