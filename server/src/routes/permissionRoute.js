import permissionController from "../controllers/permissionController.js";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";
import queryHandler from "../middlewares/queryHandler.js";
import express from "express";

const router = express.Router();

router.use(authenticate);
router.post('/', authorize('create', 'permission'), permissionController.create);
router.get('/', authorize('search', 'permission'), queryHandler, permissionController.search);
router.get('/:id', authorize('show', 'permission'), permissionController.show);
router.patch('/:id', authorize('update', 'permission'), permissionController.update);
router.delete('/:id', authorize('remove', 'permission'), permissionController.remove);

export default router;