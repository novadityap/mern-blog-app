import categoryService from '../services/categoryService.js';

const create = async (req, res, next) => {
  try {
    await categoryService.create(req.body);
    res.status(201).json({
      code: 201,
      message: 'Category created successfully',
    });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const category = await categoryService.update(req.params.id, req.body);
    res.json({
      code: 200,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await categoryService.remove(req.params.id);
    res.json({
      code: 200,
      message: 'Category deleted successfully',
    });
  } catch (e) {
    next(e);
  }
};

const show = async (req, res, next) => {
  try {
    const category = await categoryService.show(req.params.id);
    res.json({
      code: 200,
      message: 'Category found',
      data: category,
    });
  } catch (e) {
    next(e);
  }
};

const search = async (req, res, next) => {
  try {
    const { categories, meta } = await categoryService.search(req.queryOptions);

    if (categories.length === 0) {
      return res.json({ code: 200, message: 'Categories not found', data: [] });
    }

    res.json({
      code: 200,
      message: 'Categories found',
      data: categories,
      meta,
    });
  } catch (e) {
    next(e);
  }
};

export default {
  create,
  update,
  remove,
  show,
  search,
};
