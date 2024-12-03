import commentService from '../services/commentService.js';

const create = async (req, res, next) => {
  try {
    await commentService.create(req);
    res.status(201).json({
      code: 200,
      message: 'Comment created successfully',
    });
  } catch (e) {
    next(e);
  }
};
const search = async (req, res, next) => {
  try {
    const { comments, meta } = await commentService.search(req.queryOptions);

    if (comments.length === 0) {
      return res.json({
        code: 200,
        message: 'Comments not found',
        data: [],
      });
    }

    res.json({
      code: 200,
      message: 'Comments found',
      data: comments,
      meta,
    });
  } catch (e) {
    next(e);
  }
};

const show = async (req, res, next) => {
  try {
    const comment = await commentService.show(req.params.id);
    res.json({
      code: 200,
      message: 'Comment found',
      data: comment,
    });
  } catch (e) {
    next(e);
  }
};

const list = async (req, res, next) => {
  try {
    const { comments, meta } = await commentService.list(
      req.params.id,
      req.queryOptions
    );

    if (comments.length === 0) {
      return res.json({
        code: 200,
        message: 'Comments not found',
        data: [],
      });
    }

    res.json({
      code: 200,
      message: 'Comments found',
      data: comments,
      meta,
    });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const comment = await commentService.update(req.params.id, req.body);
    res.json({
      code: 200,
      message: 'Comment updated successfully',
      data: comment,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await commentService.remove(req.params.id);
    res.json({
      code: 200,
      message: 'Comment deleted successfully',
    });
  } catch (e) {
    next(e);
  }
};

export default {
  create,
  search,
  show,
  list,
  update,
  remove,
};
