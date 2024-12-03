import Permission from '../models/permissionModel.js';

const seedPermission = async () => {
  const resources = {
    permission: ['show', 'search', 'create', 'update', 'remove'],
    role: ['show', 'search', 'create', 'update', 'remove'],
    user: ['show', 'search', 'create', 'update', 'remove'],
    post: ['show', 'search', 'create', 'update', 'remove', 'like'],
    comment: ['show', 'search', 'list', 'create', 'update', 'remove'],
    category: ['show', 'search', 'create', 'update', 'remove'],
    dashboard: ['stats'],
  };

  const permissions = Object.entries(resources).flatMap(([resource, actions]) =>
    actions.map(action => ({
      action,
      resource,
    }))
  );

  await Permission.deleteMany({});
  await Permission.insertMany(permissions);
};

export default seedPermission;
