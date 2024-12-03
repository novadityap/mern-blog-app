import { readFile, unlink, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import User from '../src/models/userModel.js';
import Category from '../src/models/categoryModel.js';
import Post from '../src/models/postModel.js';
import Role from '../src/models/roleModel.js';
import Permission from '../src/models/permissionModel.js';
import Comment from '../src/models/commentModel.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const uploadDirs = {
  avatars: process.env.AVATAR_UPLOADS_DIR,
  posts: process.env.POST_UPLOADS_DIR,
};

export const getTestUser = async () => {
  return await User.findOne({ username: 'test' });
};

export const createTestUser = async (fields = {}) => {
  return await User.create({
    username: 'test',
    email: 'test@me.com',
    password: await bcrypt.hash('test123', 10),
    resetToken: '123',
    resetTokenExpires: Date.now() + 1 * 60 * 60 * 1000,
    ...fields,
  });
};

export const createManyTestUsers = async () => {
  const users = Array.from({ length: 15 }, (_, i) => createTestUser({ email: `test${i}@me.com` }));

  await Promise.all(users);
  return users;
};

export const removeTestUser = async (filter = {}) => {
  await User.deleteMany({ 
    username: { $regex: /^test/ }, 
    ...filter 
  });
};

export const createTestCategory = async (fields = {}) => {
  return await Category.create({ name: 'test', ...fields });
};

export const removeTestCategory = async (filter = {}) => {
  await Category.deleteMany({ 
    name: { $regex: /^test/ }, 
    ...filter 
  });
};

export const createManyTestCategories = async () => {
  const categories = Array.from({ length: 15 }, (_, i) => createTestCategory({ name: `test${i}` }));

  await Promise.all(categories);
  return categories;
};

export const createTestComment = async (fields = {}) => {
  const user = await createTestUser();

  return await Comment.create({ 
    userId: user._id,
    content: 'test', 
    ...fields 
  });
};

export const createManyTestComments = async (fields = {}) => {
  const comments = Array.from({ length: 15 }, (_, i) => createTestComment({ 
    content: `test${i}`,
    ...fields, 
  }));

  await Promise.all(comments);
  return comments;
};

export const removeTestComment = async (filter = {}) => {
  await Comment.deleteMany({ 
    content: { $regex: /^test/ }, 
    ...filter 
  });
};

export const createTestPost = async (fields = {}) => {
  return await Post.create({
    title: 'test',
    slug: 'test',
    content: 'test',
    ...fields,
  });
};

export const removeTestPost = async (filter = {}) => {
  await Post.deleteMany({ 
    title: { $regex: /^test/ }, 
    ...filter 
  });
};

export const getTestPost = async () => {
  return await Post.findOne({ title: 'test' });
};

export const createManyTestPosts = async () => {
  const categories = await createManyTestCategories();
  const posts = Array.from({ length: 15 }, (_, i) => createTestPost({ 
    slug: `test${i}`, 
    content: `test${i}`, 
    category: categories[i]._id 
  }));

  await Promise.all(posts);
  return posts;
};

export const createTestRole = async (fields = {}) => {
  return await Role.create({
    name: 'test',
    ...fields,
  });
};

export const createManyTestRoles = async () => {
  const roles = Array.from({ length: 15 }, (_, i) => createTestRole({ name: `test${i}` }));

  await Promise.all(roles);
  return roles;
};

export const removeTestRole = async (filter = {}) => {
  await Role.deleteMany({ 
    name: { $regex: /^test/ }, 
    ...filter 
  });
};

export const createTestPermission = async (fields = {}) => {
  return await Permission.create({
    action: 'test',
    resource: 'test',
    description: 'test',
    ...fields,
  });
};

export const createManyTestPermissions = async () => {
  const permissions = Array.from({ length: 15 }, (_, i) => createTestPermission({
    action: `test${i}`,
    resource: `test${i}`,
  }));

  await Promise.all(permissions);
  return permissions;
};

export const removeTestPermission = async (filter = {}) => {
  await Permission.deleteMany({ 
    action: { $regex: /^test/ }, 
    ...filter 
  });
};

export const createToken = (type, role = 'admin') => {
  return jwt.sign(
    {
      id: new mongoose.Types.ObjectId(),
      roles: [role],
    },
    type === 'auth' ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET,
    {
      expiresIn:
        type === 'auth'
          ? process.env.JWT_EXPIRES
          : process.env.JWT_REFRESH_EXPIRES,
    }
  );
};

export const fileExists = async (directory, filename) => {
  const filePath = path.join(process.cwd(), uploadDirs[directory], filename);

  try {
    await access(filePath);
    return true;
  } catch (e) {
    return false;
  }
};

export const copyToUploadDir  = async (source, directory) => {
  const filename = path.basename(source);
  const destinationPath = path.join(
    process.cwd(),
    uploadDirs[directory],
    filename
  );

  await copyFile(source, destinationPath);
};

export const removeUploadedFile  = async (directory, filename) => {
  const filePath = path.join(process.cwd(), uploadDirs[directory], filename);
  await unlink(filePath);
};

export const readLogs = async () => {
  const path = `${process.cwd()}/src/logs/app-${
    new Date().toISOString().split('T')[0]
  }.log`;
  const log = await readFile(path, 'utf-8');

  return log
    .trim()
    .split('\n')
    .map(line => JSON.parse(line));
};

export const findRelevantLog = async (message, startTime) => {
  const logs = await readLogs();
  return logs.find(log => {
    return new Date(log.timestamp) > startTime && log.message === message;
  });
};
