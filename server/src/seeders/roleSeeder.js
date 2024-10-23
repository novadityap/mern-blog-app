import Role from '../models/roleModel.js';
import Permission from '../models/permissionModel.js';

const seedRole = async () => {
  const permissions = await Permission.find();
  const userPermissionsCriteria = {
    user: ['read', 'update', 'delete'],
    comment: ['create', 'read', 'update', 'delete'],
  };
  const roles = [
    { name: 'admin', permissions: [] },
    { name: 'user', permissions: [] },
  ];

  for (let permission of permissions) {
    const { _id, action, resource } = permission;

    roles[0].permissions.push(_id);

    if (userPermissionsCriteria[resource]?.includes(action)) {
      roles[1].permissions.push(_id);
    }
  }

  await Role.deleteMany({});
  await Role.insertMany(roles);
};

export default seedRole;
