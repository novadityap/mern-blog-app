import postService from '../services/postService.js';

const create = async (req, res, next) => {
  try {
    await postService.create(req);
    res.status(201).json({
      code: 201,
      message: 'Post created successfully',
    });
  } catch (e) {
    next(e);
  }
};

const search = async (req, res, next) => {
  try {
    const { posts, meta } = await postService.search(req.queryOptions);

    if (posts.length === 0) {
      return res.json({
        code: 200,
        message: 'Posts not found',
        data: [],
      });
    }

    res.json({
      code: 200,
      message: 'Posts found',
      data: posts,
      meta
    });
  } catch (e) {
    next(e);
  }
};

const show = async (req, res, next) => {
  try {
    const post = await postService.show(req.params.id, req);
    res.json({
      code: 200,
      message: 'Post found',
      data: post,
    });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const post = await postService.update(req.params.id, req);
    res.json({
      code: 200,
      message: 'Post updated successfully',
      data: post,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await postService.remove(req.params.id);
    res.json({
      code: 200,
      message: 'Post deleted successfully',
    });
  } catch (e) {
    next(e);
  }
};

const like = async (req, res, next) => {
  try {
    const { totalLikes, isLiked } = await postService.like(req.params.id, req);

    let message;

    if(isLiked) {
      message = 'Post liked successfully';
    } else {
      message = 'Post unliked successfully';
    }

    res.json({
      code: 200,
      message,
      data: { 
        totalLikes, 
        isLiked 
      },
    })
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
  like,
};
