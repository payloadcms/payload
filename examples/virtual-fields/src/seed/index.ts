import payload from 'payload';
import { MongoClient } from 'mongodb';
import { eventsOne, eventsTwo } from './events';
import { locationOne, locationTwo } from './locations';
import { staffOne, staffTwo } from './staff';

export async function seed() {
  try {
    payload.logger.info('Dropping database...');
    await dropDB();
    payload.logger.info('Database dropped.');
    payload.logger.info('Seeding database...');
    await seedData();
    payload.logger.info('Seed Complete.');
  } catch (error) {
    console.error(error);
    payload.logger.error('Error seeding database.');
  }
}

async function dropDB() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(new URL(process.env.MONGODB_URI).pathname.substring(1));
  await db.dropDatabase();
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
