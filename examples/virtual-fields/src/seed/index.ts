import payload from 'payload';
import { MongoClient } from 'mongodb';
import { eventsOne, eventsTwo } from './events';
import { locationOne, locationTwo } from './locations';
import { staffOne, staffTwo } from './staff';

export async function seed() {
  try {
    payload.logger.info('---- SEEDING DATABASE ----');
    await seedData();
    payload.logger.info('---- SEED COMPLETE ----');
  } catch (error) {
    console.error(error);
    payload.logger.error('Error seeding database.');
  }
}

async function seedData() {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  });

  const { id: locationOneID } = await payload.create({
    collection: 'locations',
    data: locationOne,
  });

  const { id: locationTwoID } = await payload.create({
    collection: 'locations',
    data: locationTwo,
  });


  await payload.create({
    collection: 'staff',
    data: {
      ...staffOne,
      location: [locationOneID],
    },
  });


  await payload.create({
    collection: 'staff',
    data: {
      ...staffTwo,
      location: [locationTwoID],
    },
  });

  eventsOne.map((event) => {
    payload.create({
      collection: 'events',
      data: {
        ...event,
        location: locationOneID,
      },
    });

    return null;
  });


  eventsTwo.map((event) => {
    payload.create({
      collection: 'events',
      data: {
        ...event,
        location: locationTwoID,
      },
    });

    return null;
  });
}
