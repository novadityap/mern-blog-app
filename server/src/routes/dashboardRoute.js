import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('stats', 'dashboard'), dashboardController.stats);

export default router;
