import ResponseError from './responseError.js';
import formatError from './formatError.js';
import logger from './logger.js';

const validate = (schema, body) => {
  const result = schema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (result.error) {
    const errors = formatError(result.error.details);

    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, errors);
  }

  return result.value;
};

export default validate;
