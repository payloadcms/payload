const mongoose = require('mongoose');

const connectMongoose = (url) => {
  mongoose.connect(url, {
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
