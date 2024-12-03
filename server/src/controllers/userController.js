import userService from '../services/userService.js';

const show = async (req, res, next) => {
  try {
    const user = await userService.show(req.params.id);
    res.json({
      code: 200,
      message: 'User found',
      data: user,
    });
  } catch (e) {
    next(e);
  }
};

const search = async (req, res, next) => {
  try {
    const { users, meta } = await userService.search(req.queryOptions);

    if (users.length === 0) {
      return res.json({
        code: 200,
        message: 'Users not found',
        data: [],
      });
    }

    res.json({
      code: 200,
      message: 'Users found',
      data: users,
      meta,
    });
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => {
  try {
    await userService.create(req.body);
    res.status(201).json({
      code: 201,
      message: 'User created successfully',
    });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req);
    res.json({
      code: 200,
      message: 'User updated successfully',
      data: user,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await userService.remove(req.params.id);
    res.json({
      code: 200,
      message: 'User deleted successfully',
    });
  } catch (e) {
    next(e);
  }
};

export default {
  show,
  search,
  create,
  update,
  remove,
};
