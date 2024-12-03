import categoryController from '../controllers/categoryController.js';
import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import queryHandler from '../middlewares/queryHandler.js';

const router = express.Router();

router.get('/', queryHandler, categoryController.search);
router.get('/:id', categoryController.show);

router.use(authenticate);
router.post('/', authorize('create', 'category'), categoryController.create);
router.patch('/:id', authorize('update', 'category'), categoryController.update);
router.delete('/:id', authorize('remove', 'category'), categoryController.remove);

export default router;
