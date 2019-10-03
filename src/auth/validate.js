import validate from 'express-validation';
import Joi from 'joi';

module.exports = {
  login: validate({
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    },
  })
};
