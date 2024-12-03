import postController from '../controllers/postController.js';
import commentController from '../controllers/commentController.js';
import authorize from '../middlewares/authorize.js';
import authenticate from '../middlewares/authenticate.js';
import queryHandler from '../middlewares/queryHandler.js';
import express from 'express';

const router = express.Router();

router.get('/', queryHandler, postController.search);
router.get('/:id', postController.show);
router.get('/:id/comments', queryHandler, commentController.list);

router.use(authenticate);
router.post('/', authorize('create', 'post'), postController.create);
router.patch('/:id', authorize('update', 'post'), postController.update);
router.delete('/:id', authorize('remove', 'post'), postController.remove);
router.patch('/:id/like', authorize('like', 'post'), postController.like);

export default router;