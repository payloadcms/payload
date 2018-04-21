const path = require('path');
const Collection = require('./Collection');

class Payload {
  constructor(options) {
    this.express = options.express;
    this.mongoose = options.mongoose;
    this.baseURL = options.baseURL;

    this.views = path.join(__dirname, 'views');

    this.collections = {};

    this.express.get('/payload/admin', (req, res) => {
      res.render('admin',
        {
          title: 'Payload Admin'
        });
    });
  }

  newCollection(key) {
    if (key in this.collections) {
      throw Error(`${key} already exists in collections`);
    }

    return new Collection(this, key);
  }

  getCollection(key) {
    if (!(key in this.collections)) {
      throw Error(`${key} does not exist in collections or has not been registered yet`);
    }

    return this.collections[key];
  }
}

module.exports = Payload;
