import validate from 'express-validation';
import Joi from 'joi';

// TODO: move field specific validations to the config
export default {
  post: validate({
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }
  })
};
