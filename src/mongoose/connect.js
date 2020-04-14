const mongoose = require('mongoose');

const connectMongoose = async (url) => {
  let urlToConnect = url;
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line global-require
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = new MongoMemoryServer();
    urlToConnect = await mongod.getUri();
  }
  mongoose.connect(urlToConnect, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }, (err) => {
    if (err) {
      console.log('Unable to connect to the Mongo server. Please start the server. Error:', err);
    } else {
      console.log('Connected to Mongo server successfully!');
    }
  });
};

module.exports = connectMongoose;
