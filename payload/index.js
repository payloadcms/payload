const path = require('path');
const Collection = require('./Collection');

class Payload {

  constructor(options) {
    this.express = options.express;
    this.mongoose = options.mongoose;
    this.baseURL = options.baseURL;

    this.views = path.join(__dirname, 'views');

    this.collections = {};

    this.express.get(`/payload/admin`, function (req, res) {
      res.render('admin',
        {
          title: 'Payload Admin'
        })
    });
  }

  newCollection(key) {
    if (key in this.collections)
    {
      console.log(`${key} already exists in collections`);
      return;
    }

    return new Collection(this, key);
  }

  getCollection(key) {
    if (!(key in this.collections)) {
      console.log(`${key} does not exist in collections or has not been registered yet`);
      return;
    }

    return this.collections[key];
  }
}

module.exports = Payload;