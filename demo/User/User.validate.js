import validate from 'express-validation';
import Joi from 'joi';

export default {
  post: validate({
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }
  })
};
