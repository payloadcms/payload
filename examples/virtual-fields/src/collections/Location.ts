/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import payload from 'payload';
import { CollectionAfterReadHook, CollectionConfig } from 'payload/types';

const populateFields: CollectionAfterReadHook = async ({ doc }) => {
  // Format location
  const location = `${doc.city}${doc.state ? `, ${doc.state},` : ','} ${doc.country}`;

  // Get events and next event
  const eventsByDate = await payload.find({
    collection: 'events',
    sort: 'date',
    where: {
      location: {
        equals: doc.id,
      },
    },
  });

  // Get staff members
  const staff = await payload.find({
    collection: 'staff',
    where: {
      location: {
        equals: doc.id,
      },
    },
  });

  const populatedDoc = {
    ...doc,
    location,
    nextEvent: eventsByDate?.docs[0] ? eventsByDate.docs[0]?.id : undefined,
    events: eventsByDate?.docs ? eventsByDate.docs.map((eventDoc) => eventDoc.id) : undefined,
    staff: staff?.docs ? staff.docs.map((staffDoc) => staffDoc.id) : undefined,
  };

  return populatedDoc;
};

const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    defaultColumns: ['location', 'nextEvent'],
    useAsTitle: 'location',
  },
  hooks: {
    afterRead: [populateFields],
  },
  fields: [
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
      name: 'location',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'events',
      maxDepth: 0,
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'staff',
      type: 'relationship',
      relationTo: 'staff',
      hasMany: true,
      maxDepth: 0,
      admin: {
        readOnly: true,
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
    },
  ],
};

export default Locations;
