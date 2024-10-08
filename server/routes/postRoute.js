import {
  createPost,
  getPosts,
  getPostWithComments,
  updatePost,
  deletePost,
  createComment,
} from '../controllers/postController.js';
import authorize from '../middlewares/authorize.js';
import authenticate from '../middlewares/authenticate.js';
import express from 'express';

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostWithComments);

router.use(authenticate);
router.post('/', authorize('create', 'post'), createPost);
router.put('/:id', authorize('update', 'post'), updatePost);
router.delete('/:id', authorize('delete', 'post'), deletePost);
router.post('/:id/comments', authorize('create', 'comment'), createComment);

export default router;