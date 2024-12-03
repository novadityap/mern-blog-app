import Post from '../models/postModel.js';
import Category from '../models/categoryModel.js';
import slugify from 'slugify';
import ResponseError from '../utils/responseError.js';
import uploadAndValidate from '../utils/uploadAndValidate.js';
import logger from '../utils/logger.js';
import {
  createPostSchema,
  updatePostSchema,
} from '../validations/postValidation.js';
import * as fs from 'node:fs/promises';
import validateObjectId from '../utils/validateObjectId.js';
import path from 'node:path';
import jwt from 'jsonwebtoken';

const create = async request => {
  const { validatedFiles, validatedFields, validationErrors } =
    await uploadAndValidate(request, {
      fieldname: 'postImage',
      formSchema: createPostSchema,
    });

  if (validationErrors) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, validationErrors);
  }

  const category = await Category.findById(validatedFields.category);
  if (!category) {
    logger.warn('category not found');
    throw new ResponseError('Category not found', 404);
  }

  validatedFields.slug = slugify(validatedFields.title, { lower: true });

  if (validatedFiles) {
    validatedFields.postImage = validatedFiles[0].newFilename;
  }

  await Post.create({
    ...validatedFields,
    userId: request.user.id,
  });

  logger.info('post created successfully');
};

const update = async (id, request) => {
  if (!validateObjectId(id)) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, {
      id: ['Invalid post id'],
    });
  }

  const post = await Post.findById(id);
  if (!post) {
    logger.warn('post not found');
    throw new ResponseError('Post not found', 404);
  }

  const { validatedFiles, validatedFields, validationErrors } =
    await uploadAndValidate(request, {
      fieldname: 'postImage',
      formSchema: updatePostSchema,
    });

  if (validationErrors) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, validationErrors);
  }

  const category = await Category.findById(validatedFields.category);
  if (!category) {
    logger.warn('category not found');
    throw new ResponseError('Category not found', 404);
  }

  if (validatedFiles) {
    if (post.postImage !== 'default.jpg') {
      await fs.unlink(
        path.join(process.cwd(), process.env.POST_UPLOADS_DIR, post.postImage)
      );
    }

    post.postImage = validatedFiles[0].newFilename;
    logger.info('post image updated successfully');
  }

  Object.assign(post, validatedFields);
  await post.save();

  logger.info('post updated successfully');
  return post;
};

const show = async (id, request) => {
  const token = request.headers.authorization?.replace('Bearer ', '');

  if (!validateObjectId(id)) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, {
      id: ['Invalid post id'],
    });
  }

  const post = await Post.findById(id)
    .populate('userId', 'email')
    .populate({
      path: 'comments',
      populate: {
        path: 'userId',
        select: 'username',
      },
    })
    .populate('category');

  if (!post) {
    logger.warn('post not found');
    throw new ResponseError('Post not found', 404);
  }

  if (token) {
    const currentUser = jwt.verify(token, process.env.JWT_SECRET);
    post.isLiked = post.likes.includes(currentUser.id) ?? false;
  }

  logger.info('post found');
  return post;
};

const search = async options => {
  const { page, limit, search, filters, skip } = options;
  const filter = { ...filters };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  const totalPosts = await Post.countDocuments(filter);
  const totalPages = Math.ceil(totalPosts / limit);
  const hasMore = page * limit < totalPosts;

  const posts = await Post.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate('userId', 'username email avatar')
    .populate('category');

  if (posts.length === 0) {
    logger.warn('posts not found');
  } else {
    logger.info('posts found');
  }

  return {
    posts,
    meta: {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalItems: totalPosts,
      hasMore,
    },
  };
};

const remove = async id => {
  if (!validateObjectId(id)) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, {
      id: ['Invalid post id'],
    });
  }

  const post = await Post.findById(id);
  if (!post) {
    logger.warn('post not found');
    throw new ResponseError('Post not found', 404);
  }

  if (post.postImage !== 'default.jpg') {
    await fs.unlink(
      path.join(process.cwd(), process.env.POST_UPLOADS_DIR, post.postImage)
    );
    logger.info('post image deleted successfully');
  }

  await post.deleteOne();
  logger.info('post deleted successfully');
};

const like = async (id, request) => {
  if (!validateObjectId(id)) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, {
      id: ['Invalid post id'],
    });
  }

  const post = await Post.findById(id);
  if (!post) {
    logger.warn('post not found');
    throw new ResponseError('Post not found', 404);
  }

  console.log(post)
  console.log(request.user)
  let isLiked = post.likes.includes(request.user.id);
  console.log(isLiked)
  if (isLiked) {
    post.likes.pull(request.user.id);
    post.totalLikes -= 1;
    isLiked = false;

    logger.info('post unliked successfully');
  } else {
    post.likes.push(request.user.id);
    post.totalLikes += 1;
    isLiked = true;
    
    logger.info('post liked successfully');
  }

  console.log(post)
  console.log(isLiked)
  await post.save();
  return { 
    totalLikes: post.totalLikes,
    isLiked
  };
};

export default {
  create,
  update,
  show,
  search,
  remove,
  like,
};
