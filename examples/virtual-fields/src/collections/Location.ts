import type { CollectionConfig, FieldHook } from 'payload/types'

const formatLocation: FieldHook = ({ data }) => {
  if (!data) return ''
  return `${data.city}${data.state ? `, ${data.state},` : ','} ${data.country}`
}

const getLocationStaff: FieldHook = async ({ data, req }) => {
  if (!data) return null

  const staff = await req.payload.find({
    collection: 'staff',
    where: {
      location: {
        equals: data.id,
      },
    },
  })

  if (staff.docs) {
    return staff.docs.map((doc) => doc.id)
  }

  return null
}

const getNextEvent: FieldHook = async ({ data, req }) => {
  if (!data) return null

  const eventsByDate = await req.payload.find({
    collection: 'events',
    sort: 'date',
    where: {
      location: {
        equals: data.id,
      },
    },
  })

  if (eventsByDate?.docs) {
    return eventsByDate.docs[0]?.id
  }

  return null
}

const getAllEvents: FieldHook = async ({ data, req }) => {
  if (!data) return null

  const allEvents = await req.payload.find({
    collection: 'events',
    where: {
      location: {
        equals: data.id,
      },
    },
  })
  if (allEvents.docs) return allEvents.docs.map((doc) => doc.id)

  return null
}

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    defaultColumns: ['location', 'nextEvent'],
    useAsTitle: 'location',
  },
  fields: [
    {
      name: 'location',
      type: 'text',
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [formatLocation],
        beforeChange: [
          ({ siblingData }) => {
            // Mutate the sibling data to prevent DB storage
            // eslint-disable-next-line no-param-reassign
            siblingData.location = undefined
          },
        ],
      },
      label: false,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'city',
          type: 'text',
          required: true,
        },
        {
          name: 'state',
          type: 'text',
        },
        {
          name: 'country',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'events',
      type: 'relationship',
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        readOnly: true,
      },
      hasMany: true,
      hooks: {
        afterRead: [getAllEvents],
        beforeChange: [
          ({ siblingData }) => {
            // Mutate the sibling data to prevent DB storage
            // eslint-disable-next-line no-param-reassign
            siblingData.events = undefined
          },
        ],
      },
      maxDepth: 0,
      relationTo: 'events',
    },
    {
      name: 'staff',
      type: 'relationship',
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        readOnly: true,
      },
      hasMany: true,
      hooks: {
        afterRead: [getLocationStaff],
        beforeChange: [
          ({ siblingData }) => {
            // Mutate the sibling data to prevent DB storage
            // eslint-disable-next-line no-param-reassign
            siblingData.staff = undefined
          },
        ],
      },
      maxDepth: 0,
      relationTo: 'staff',
    },
    {
      name: 'nextEvent',
      type: 'relationship',
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        afterRead: [getNextEvent],
        beforeChange: [
          ({ siblingData }) => {
            // Mutate the sibling data to prevent DB storage
            // eslint-disable-next-line no-param-reassign
            siblingData.nextEvent = undefined
          },
        ],
      },
      relationTo: 'events',
    },
  ],
}
