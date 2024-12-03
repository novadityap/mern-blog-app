import roleService from '../services/roleService.js';

const create = async (req, res, next) => {
  try {
    await roleService.create(req.body);
    res.status(201).json({
      code: 201,
      message: 'Role created successfully',
    });
  } catch (e) {
    next(e);
  }
};

const search = async (req, res, next) => {
  try {
    const { roles, meta } = await roleService.search(req.queryOptions);

    if (roles.length === 0) {
      return res.json({
        code: 200,
        message: 'Roles not found',
        data: [],
      });
    }

    res.json({
      code: 200,
      message: 'Roles found',
      data: roles,
      meta,
    });
  } catch (e) {
    next(e);
  }
};
const show = async (req, res, next) => {
  try {
    const role = await roleService.show(req.params.id);
    res.json({
      code: 200,
      message: 'Role found',
      data: role,
    });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const role = await roleService.update(req.params.id, req.body);
    res.json({
      code: 200,
      message: 'Role updated successfully',
      data: role,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await roleService.remove(req.params.id);
    res.json({
      code: 200,
      message: 'Role deleted successfully',
    });
  } catch (e) {
    next(e);
  }
};

export default {
  create,
  search,
  show,
  update,
  remove,
};
