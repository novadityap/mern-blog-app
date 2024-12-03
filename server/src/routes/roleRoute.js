import roleController from '../controllers/roleController.js';
import express from 'express';
import authorize from '../middlewares/authorize.js';
import authenticate from '../middlewares/authenticate.js';
import queryHandler from '../middlewares/queryHandler.js';

const router = express.Router();

router.use(authenticate);
router.post('/', authorize('create', 'role'), roleController.create);
router.get('/', authorize('search', 'role'), queryHandler, roleController.search);
router.get('/:id', authorize('show', 'role'), roleController.show);
router.patch('/:id', authorize('update', 'role'), roleController.update);
router.delete('/:id', authorize('remove', 'role'), roleController.remove);

export default router;
