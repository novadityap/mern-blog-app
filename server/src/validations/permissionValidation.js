import Joi from 'joi';

const actionSchema = Joi.string().valid('create', 'stats', 'show', 'search', 'list', 'like', 'update', 'remove').required();
const resourceSchema = Joi.string().valid('user', 'role', 'permission', 'post', 'comment', 'category', 'dashboard').required();

const basePermissionSchema = Joi.object({
  action: actionSchema,
  resource: resourceSchema,
});

export const createPermissionSchema = basePermissionSchema;
export const updatePermissionSchema = basePermissionSchema.fork(
  ['action', 'resource'],
  schema => schema.optional()
);