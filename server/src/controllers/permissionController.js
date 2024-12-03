import permissionService from '../services/permissionService.js';

const create = async (req, res, next) => {
  try {
    await permissionService.create(req.body);
    res.status(201).json({
      code: 201,
      message: 'Permission created successfully',
    });
  } catch (e) {
    next(e);
  }
};

const search = async (req, res, next) => {
  try {
    const { permissions, meta } = await permissionService.search(
      req.queryOptions
    );

    if (permissions.length === 0) {
      return res.json({
        code: 200,
        message: 'Permissions not found',
        data: [],
      });
    }

    res.json({
      code: 200,
      message: 'Permissions found',
      data: permissions,
      meta,
    });
  } catch (e) {
    next(e);
  }
};

const show = async (req, res, next) => {
  try {
    const permission = await permissionService.show(req.params.id);
    res.json({
      code: 200,
      message: 'Permission found',
      data: permission,
    });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const permission = await permissionService.update(req.params.id, req.body);
    res.json({
      code: 200,
      message: 'Permission updated successfully',
      data: permission,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await permissionService.remove(req.params.id);
    res.json({
      code: 200,
      message: 'Permission deleted successfully',
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
