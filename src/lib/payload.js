/**
 * Module dependencies.
 */

const api = require('./api');

class Payload {
  constructor(options) {
    this.express = options.express;
    this.mongoose = options.mongoose;
    this.baseURL = options.baseURL;
    this.models = [];

    // TODO: Investigate creating an API controller to encapsulate
    this.express.get('/api', (req, res) => {
      // TODO: Possible return basic API info and/or HATEOAS info to other routes
      res.status(200).send({ models: this.models });
    });
  }

  loadModel(modelName) {
    console.log(`Loading ${modelName} model...`);

    // TODO: Require file, validate schema, mount routes instead of just adding to array
    let model = { [modelName]: {} };
    if (!this.models[modelName]) {
      this.models.push(model);
      console.log(`${modelName} Loaded.`);
    }
  }
}

export { Payload };
