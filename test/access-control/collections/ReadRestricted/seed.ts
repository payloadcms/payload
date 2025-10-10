import type { Payload } from 'payload'

import { readRestrictedSlug } from './index.js'

export const seedReadRestricted = async (payload: Payload): Promise<void> => {
  await payload.create({
    collection: readRestrictedSlug,
    data: {
      // Top-level fields
      restrictedTopLevel: 'This should be hidden',
      visibleTopLevel: 'This is visible to everyone',

      // Group fields
      contactInfo: {
        email: 'contact@example.com',
        secretPhone: '+1-555-SECRET',
        publicPhone: '+1-555-PUBLIC',
      },

      // Row fields
      visibleInRow: 'Visible row data',
      restrictedInRow: 'Hidden row data',

      // Collapsible fields
      visibleInCollapsible: 'Visible collapsible data',
      restrictedInCollapsible: 'Hidden collapsible data',

      // Array fields
      items: [
        {
          title: 'Item 1',
          secretDescription: 'Secret details about item 1',
          publicDescription: 'Public details about item 1',
        },
        {
          title: 'Item 2',
          secretDescription: 'Secret details about item 2',
          publicDescription: 'Public details about item 2',
        },
        {
          title: 'Item 3',
          secretDescription: 'Secret details about item 3',
          publicDescription: 'Public details about item 3',
        },
      ],

      // Tab fields
      publicData: 'Public tab information',
      secretInPublicTab: 'Secret in public tab',
      settings: {
        visibleSetting: true,
        restrictedSetting: true,
      },

      // Deeply nested group fields
      metadata: {
        analytics: {
          visibleMetric: 1000,
          restrictedMetric: 9999,
        },
      },

      // Group with row inside
      address: {
        street: '123 Main Street',
        city: 'Springfield',
        secretPostalCode: '12345-SECRET',
      },

      // Collapsible with group inside
      advanced: {
        visibleAdvanced: 'Visible advanced setting',
        restrictedAdvanced: 'Hidden advanced setting',
      },
    },
  })

  await payload.create({
    collection: readRestrictedSlug,
    data: {
      restrictedTopLevel: 'Another hidden top level',
      visibleTopLevel: 'Another visible field',
      contactInfo: {
        email: 'info@example.com',
        secretPhone: '+1-555-HIDDEN',
        publicPhone: '+1-555-VISIBLE',
      },
      visibleInRow: 'Row visible text',
      restrictedInRow: 'Row hidden text',
      visibleInCollapsible: 'Collapsible visible',
      restrictedInCollapsible: 'Collapsible hidden',
      items: [
        {
          title: 'Product A',
          secretDescription: 'Confidential product info',
          publicDescription: 'Public product description',
        },
      ],
      publicData: 'More public data',
      secretInPublicTab: 'More secret data',
      settings: {
        visibleSetting: false,
        restrictedSetting: false,
      },
      metadata: {
        analytics: {
          visibleMetric: 2500,
          restrictedMetric: 8888,
        },
      },
      address: {
        street: '456 Oak Avenue',
        city: 'Portland',
        secretPostalCode: '67890-SECRET',
      },
      advanced: {
        visibleAdvanced: 'Public advanced config',
        restrictedAdvanced: 'Private advanced config',
      },
    },
  })

  await payload.create({
    collection: readRestrictedSlug,
    data: {
      restrictedTopLevel: 'Third hidden value',
      visibleTopLevel: 'Third visible value',
      contactInfo: {
        email: 'support@example.com',
        secretPhone: '+1-555-PRIVATE',
        publicPhone: '+1-555-SUPPORT',
      },
      visibleInRow: 'Third row visible',
      restrictedInRow: 'Third row hidden',
      visibleInCollapsible: 'Third collapsible visible',
      restrictedInCollapsible: 'Third collapsible hidden',
      items: [],
      publicData: 'Third public data',
      secretInPublicTab: 'Third secret data',
      settings: {
        visibleSetting: true,
        restrictedSetting: false,
      },
      metadata: {
        analytics: {
          visibleMetric: 750,
          restrictedMetric: 5555,
        },
      },
      address: {
        street: '789 Pine Road',
        city: 'Seattle',
        secretPostalCode: '54321-SECRET',
      },
      advanced: {
        visibleAdvanced: 'Third advanced visible',
        restrictedAdvanced: 'Third advanced hidden',
      },
    },
  })
}
