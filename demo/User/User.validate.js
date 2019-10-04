const validate = require('express-validation');
const Joi = require('joi');

// TODO: move field specific validations to the config
module.exports = {
  post: validate({
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }
  })
};
