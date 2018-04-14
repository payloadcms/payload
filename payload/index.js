const path = require('path');
let fs = require('fs');

class Payload {

  constructor(app) {
    this.app = app;
    this.views = path.join(__dirname, 'views');

    mountInternalModel(this.app, path.join(__dirname, 'models'), 'User');
    mountDefaultViews(this.app);
  }
}

let mountDefaultViews = function (app) {
  fs.readdir(path.join(__dirname, 'views'), (err, files) => {
    files.forEach((file, index) => {
      let fileNoExtension = file.replace(/\.[^/.]+$/, "");
      console.log(`Mounting ${file}`);
      app.get(`/payload/${fileNoExtension}`, function (req, res) {
        res.render(fileNoExtension,
          {
            title: `Payload ${fileNoExtension}`
          })
      });
    });
  });
};

let mountInternalModel = function (app, directory, modelName) {
  app.get(`/payload/${modelName}`, function (req, res) {
    const User = require(path.join(directory, modelName));
    res.send(JSON.stringify(new User("John Doe", 22, "john@doe.com")));
  });
};

module.exports = Payload;