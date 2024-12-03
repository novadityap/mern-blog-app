import userController from '../controllers/userController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import checkOwnership from '../middlewares/checkOwnership.js';
import queryHandler from '../middlewares/queryHandler.js';
import restrictToAdmin from '../middlewares/restrictToAdmin.js';
import express from 'express';

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('search', 'user'), restrictToAdmin, queryHandler, userController.search);
router.post('/', authorize('create', 'user'), userController.create);
router.get('/:id', authorize('show', 'user'), checkOwnership('user'), userController.show);
router.patch('/:id', authorize('update', 'user'), checkOwnership('user'), userController.update);
router.delete('/:id', authorize('remove', 'user'), checkOwnership('user'), userController.remove);

export default router;