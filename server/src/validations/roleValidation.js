import Joi from 'joi';

const nameSchema = Joi.string().required();
const permissionsSchema = Joi.array().items(Joi.string()).min(1).required(); 

const baseRoleSchema = Joi.object({
  name: nameSchema,
  permissions: permissionsSchema
});

export const createRoleSchema = baseRoleSchema;
export const updateRoleSchema = baseRoleSchema.fork(['name', 'permissions'], schema =>
  schema.optional()
);
