const validate = require('express-validation');
const Joi = require('joi');

module.exports = {
  post: validate({
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }
  })
};
