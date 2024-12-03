import commentController from '../controllers/commentController.js';
import express from 'express';
import authorize from '../middlewares/authorize.js';
import authenticate from '../middlewares/authenticate.js';
import queryHandler from '../middlewares/queryHandler.js';
import checkOwnership from '../middlewares/checkOwnership.js';

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('search', 'comment'), queryHandler, commentController.search);
router.post('/', authorize('create', 'comment'), commentController.create);
router.get('/:id', authorize('show', 'comment'), commentController.show);
router.patch('/:id', authorize('update', 'comment'), checkOwnership('comment'), commentController.update);
router.delete('/:id', authorize('remove', 'comment'), checkOwnership('comment'), commentController.remove);

export default router;