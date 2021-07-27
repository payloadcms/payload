import joi from 'joi';

export const componentSchema = joi.alternatives().try(
  joi.object().unknown(),
  joi.func(),
);
