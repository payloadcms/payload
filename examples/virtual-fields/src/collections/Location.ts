/* eslint-disable import/no-extraneous-dependencies */
import payload from 'payload';
import { CollectionConfig, FieldHook } from 'payload/types';

const formatLocation: FieldHook = async ({ data }) => {
  return `${data.city}${data.state ? `, ${data.state},` : ','} ${data.country}`;
};

const getLocationStaff: FieldHook = async ({ data }) => {
  const staff = await payload.find({
    collection: 'staff',
    where: {
      location: {
        equals: data.id,
      },
    },
  });

  if (staff.docs) {
    return staff.docs.map((doc) => doc.id);
  }

  return null;
};

const getNextEvent: FieldHook = async ({ data }) => {
  const eventsByDate = await payload.find({
    collection: 'events',
    sort: 'date',
    where: {
      location: {
        equals: data.id,
      },
    },
  });

  if (eventsByDate?.docs) {
    return eventsByDate.docs[0]?.id;
  }

  return null;
};

const getAllEvents: FieldHook = async ({ data }) => {
  const allEvents = await payload.find({
    collection: 'events',
    where: {
      location: {
        equals: data.id,
      },
    },
  });
  if (allEvents.docs) return allEvents.docs.map((doc) => doc.id);

  return null;
};

const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    defaultColumns: ['location', 'nextEvent'],
    useAsTitle: 'location',
  },
  fields: [
    {
      name: 'location',
      label: false,
      type: 'text',
      hooks: {
        beforeChange: [({ siblingData }) => {
          // Mutate the sibling data to prevent DB storage
          // eslint-disable-next-line no-param-reassign
          siblingData.location = undefined;
        }],
        afterRead: [
          formatLocation,
        ],
      },
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        hidden: true,
      },
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
      maxDepth: 0,
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [({ siblingData }) => {
          // Mutate the sibling data to prevent DB storage
          // eslint-disable-next-line no-param-reassign
          siblingData.events = undefined;
        }],
        afterRead: [getAllEvents],
      },
    },
    {
      name: 'staff',
      type: 'relationship',
      relationTo: 'staff',
      hasMany: true,
      maxDepth: 0,
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [({ siblingData }) => {
          // Mutate the sibling data to prevent DB storage
          // eslint-disable-next-line no-param-reassign
          siblingData.staff = undefined;
        }],
        afterRead: [getLocationStaff],
      },
    },
    {
      name: 'nextEvent',
      type: 'relationship',
      relationTo: 'events',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: () => false,
        update: () => false,
      },
      hooks: {
        beforeChange: [({ siblingData }) => {
          // Mutate the sibling data to prevent DB storage
          // eslint-disable-next-line no-param-reassign
          siblingData.nextEvent = undefined;
        }],
        afterRead: [getNextEvent],
      },
    },
  ],
};

export default Locations;
