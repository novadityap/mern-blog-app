import {
  fetchUserById,
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import User from '../models/userModel.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import authorizeMiddleware from '../middlewares/authorizeMiddleware.js';
import express from 'express';

const router = express.Router();

router.use(authMiddleware);
router.get('', authorizeMiddleware(['admin']), fetchAllUsers);
router.post('', authorizeMiddleware(['admin']), createUser);
router.get('/:id', authorizeMiddleware(['admin', 'user'], User, true), fetchUserById);
router.put('/:id', authorizeMiddleware(['admin', 'user'], User, true), updateUser);
router.delete('/:id', authorizeMiddleware(['admin', 'user'], User, true), deleteUser);

export default router;