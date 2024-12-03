import {
  createUserSchema,
  updateUserSchema,
} from '../validations/userValidation.js';
import User from '../models/userModel.js';
import Role from '../models/roleModel.js';
import validateSchema from '../utils/validateSchema.js';
import uploadAndValidate from '../utils/uploadAndValidate.js';
import ResponseError from '../utils/responseError.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';
import path from 'path';
import * as fs from 'node:fs/promises';
import validateObjectId from '../utils/validateObjectId.js';

const search = async options => {
  const { limit, search, skip, page } = options;
  const filter = {};

  if (search) {
    const roles = await Role.find({ name: { $regex: search, $options: 'i' } });

    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { roles: { $in: roles.map(role => role._id) } },
    ];
  }

  const totalUsers = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalUsers / limit);

  const users = await User.find(filter)
    .skip(skip)
    .limit(limit)
    .populate('roles', 'name');

  if (users.length === 0) {
    logger.info('users not found');
  } else {
    logger.info('users found');
  }

  return {
    users,
    meta: {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalItems: totalUsers,
    },
  };
};

const show = async id => {
  if (!validateObjectId(id)) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, {
      id: ['Invalid user id'],
    });
  }

  const user = await User.findById(id).populate('roles');
  if (!user) {
    logger.warn('user not found');
    throw new ResponseError('User not found', 404);
  }

  logger.info('user found');
  return user;
};

const create = async data => {
  const { validatedFields, validationErrors } = validateSchema(
    createUserSchema,
    data
  );

  if (validationErrors) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, validationErrors);
  }

  const existingUser = await User.findOne({
    $or : [
      { username: validatedFields.username },
      { email: validatedFields.email }
    ]
  });

  if (existingUser) {
    const conflictField = existingUser.username === validatedFields.username ? 'username' : 'email';
    logger.warn(`${conflictField} already exists`);
    throw new ResponseError(`${conflictField.charAt(0).toUpperCase() + conflictField.slice(1)} already exists`, 409);
  }

  const roles = await Role.find({
    _id: { $in: validatedFields.roles },
  });

  if (roles.length !== validatedFields.roles.length) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, {
      roles: ['Invalid role id'],
    });
  }

  validatedFields.password = await bcrypt.hash(validatedFields.password, 10);
  await User.create({
    ...validatedFields,
    isVerified: true,
    verificationToken: null,
    verificationTokenExpires: null,
  });

  logger.info('user created successfully');
};

const update = async (id, request) => {
  if (!validateObjectId(id)) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, {
      id: ['Invalid user id'],
    });
  }

  const user = await User.findById(id);
  if (!user) {
    logger.warn('user not found');
    throw new ResponseError('User not found', 404);
  }

  const { validatedFiles, validatedFields, validationErrors } =
    await uploadAndValidate(request, {
      fieldname: 'avatar',
      formSchema: updateUserSchema,
    });

  if (validationErrors) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, validationErrors);
  }

  const existingUser = await User.findOne({
    email: validatedFields.email,
    isVerified: true,
    _id: { $ne: id },
  });

  if (existingUser) {
    logger.warn('email already exists');
    throw new ResponseError('Email already exists', 409);
  }

  if (validatedFiles) {
    if (user.avatar !== 'default.jpg') {
      await fs.unlink(
        path.join(process.cwd(), process.env.AVATAR_UPLOADS_DIR, user.avatar)
      );
    }

    user.avatar = validatedFiles[0].newFilename;
    logger.info('avatar updated successfully');
  }

  if (validatedFields.password) {
    validatedFields.password = await bcrypt.hash(validatedFields.password, 10);
  }

  Object.assign(user, validatedFields);
  await user.save();

  logger.info('user updated successfully');
  return user;
};

const remove = async id => {
  if (!validateObjectId(id)) {
    logger.info('validation errors');
    throw new ResponseError('Validation errors', 400, {
      id: ['Invalid user id'],
    });
  }

  const user = await User.findById(id);
  if (!user) {
    logger.warn('user not found');
    throw new ResponseError('User not found', 404);
  }

  if (user.avatar !== 'default.jpg') {
    await fs.unlink(
      path.join(process.cwd(), process.env.AVATAR_UPLOADS_DIR, user.avatar)
    );
    logger.info('avatar deleted successfully');
  }

  await user.deleteOne();
  logger.info('user deleted successfully');
};

export default {
  search,
  show,
  create,
  update,
  remove,
};
