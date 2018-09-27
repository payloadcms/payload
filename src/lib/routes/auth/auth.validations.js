import Joi from 'joi';

export default {
  // POST /auth/register
  register: {
    body: {
      email: Joi.string().email().required(),
    },
  },

  // POST /auth/login
  login: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    },
  },
};
