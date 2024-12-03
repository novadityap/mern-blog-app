import mongoose from 'mongoose';
import connectDB from '../src/config/connection.js';
import seedRole from '../src/seeders/roleSeeder.js';
import seedPermission from '../src/seeders/permissionSeeder.js';
import Role from '../src/models/roleModel.js';
import Permission from '../src/models/permissionModel.js';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import request from 'supertest';
import path from 'node:path';
import {
  createToken,
  createTestPost,
  removeTestPost,
  getTestPost,
  createTestCategory,
  removeTestCategory,
  createManyTestPosts,
  fileExists,
  removeUploadedFile,
  copyToUploadDir,
  createManyTestComments,
  removeTestComment,
} from './testUtil.js';

const adminToken = createToken('auth', 'admin');
const userToken = createToken('auth', 'user');
const testPostImagePath = path.join(
  process.cwd(),
  'tests/uploads/posts',
  'test-post.jpg'
);
const cases = [
  {
    name: 'post id is invalid',
    id: 'invalid',
    expectedStatus: 400,
    expectedMessage: 'Validation errors',
  },
  {
    name: 'post not found',
    id: new mongoose.Types.ObjectId(),
    expectedStatus: 404,
    expectedMessage: 'Post not found',
  },
];

beforeAll(async () => {
  await connectDB();
  await seedPermission();
  await seedRole();
});

afterAll(async () => {
  await Role.deleteMany();
  await Permission.deleteMany();
  await mongoose.connection.close();
});

describe('GET /api/posts', () => {
  beforeEach(async () => {
    await createManyTestPosts(3);
  });

  afterEach(async () => {
    await removeTestPost();
  });

  it('should can search without parameter', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Posts found');
    expect(res.body.data).toHaveLength(10);
    expect(res.body.meta.pageSize).toBe(10);
    expect(res.body.meta.totalItems).toBe(15);
    expect(res.body.meta.currentPage).toBe(1);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('should can search to page 2', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 2 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Posts found');
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta.pageSize).toBe(10);
    expect(res.body.meta.totalItems).toBe(15);
    expect(res.body.meta.currentPage).toBe(2);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('should return categories when the search query matches', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'test10' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Posts found');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.pageSize).toBe(10);
    expect(res.body.meta.totalItems).toBe(1);
    expect(res.body.meta.currentPage).toBe(1);
    expect(res.body.meta.totalPages).toBe(1);
  });

  it('should return no categories when search not found', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'notexist' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Posts not found');
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/posts/:id', () => {
  let post;

  beforeEach(async () => {
    post = await createTestPost();
  });

  afterEach(async () => {
    await removeTestPost();
  });

  it.each(cases)(
    'should reject if $name',
    async ({ id, expectedStatus, expectedMessage }) => {
      const res = await request(app)
        .get(`/api/posts/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(expectedStatus);
      expect(res.body.message).toBe(expectedMessage);
    }
  );

  it('should can get a post', async () => {
    const res = await request(app)
      .get(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post found');
    expect(res.body.data).toBeDefined();
  });
});

describe('POST /api/posts', () => {
  let category;

  beforeEach(async () => {
    category = await createTestCategory();
  });

  afterEach(async () => {
    await removeTestPost();
    await removeTestCategory();
  });

  it('should reject if unauthorized access', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Permission denied');
  });

  it('should reject if request is invalid', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation errors');
    expect(res.body.errors.title).toBeDefined();
    expect(res.body.errors.content).toBeDefined();
    expect(res.body.errors.category).toBeDefined();
  });

  it('should reject if category not found', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('title', 'test')
      .field('content', 'test')
      .field('category', new mongoose.Types.ObjectId().toString());

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Category not found');
  });

  it('should can create post without image', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('title', 'test')
      .field('content', 'test')
      .field('category', category._id.toString());

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Post created successfully');
  });

  it('should can create post with image', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('title', 'test')
      .field('content', 'test')
      .field('category', category._id.toString())
      .attach('postImage', testPostImagePath);

    const post = await getTestPost();
    const postImageExists = await fileExists('posts', post.postImage);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Post created successfully');
    expect(postImageExists).toBe(true);

    await removeUploadedFile('posts', post.postImage);
  });
});

describe('PATCH /api/posts/:id', () => {
  let post;
  let category;

  beforeEach(async () => {
    post = await createTestPost();
    category = await createTestCategory();
  });

  afterEach(async () => {
    await removeTestPost();
  });

  it('should reject if unauthorized access', async () => {
    const res = await request(app)
      .patch(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Permission denied');
  });

  it.each(cases)(
    'should reject if $name',
    async ({ id, expectedStatus, expectedMessage }) => {
      const res = await request(app)
        .patch(`/api/posts/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'multipart/form-data');

      expect(res.status).toBe(expectedStatus);
      expect(res.body.message).toBe(expectedMessage);
    }
  );

  it('should reject if request is invalid', async () => {
    const res = await request(app)
      .patch(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation errors');
    expect(res.body.errors.title).toBeDefined();
    expect(res.body.errors.content).toBeDefined();
    expect(res.body.errors.category).toBeDefined();
  });

  it('should can update existing post without image', async () => {
    const res = await request(app)
      .patch(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('title', 'test')
      .field('content', 'test')
      .field('category', category._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post updated successfully');
    expect(res.body.data.postImage).toContain('default.jpg');
  });

  it('should can update existing post with image', async () => {
    const res = await request(app)
      .patch(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('title', 'test')
      .field('content', 'test')
      .field('category', category._id.toString())
      .attach('postImage', testPostImagePath);

    const updatedPost = await getTestPost();
    const postImageExists = await fileExists('posts', updatedPost.postImage);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post updated successfully');
    expect(postImageExists).toBe(true);

    await removeUploadedFile('posts', updatedPost.postImage);
  });
});

describe('DELETE /api/posts/:id', () => {
  let post;

  beforeEach(async () => {
    post = await createTestPost();
  });

  afterEach(async () => {
    await removeTestPost();
  });

  it('should reject if unauthorized access', async () => {
    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Permission denied');
  });

  it.each(cases)(
    'should reject if $name',
    async ({ id, expectedStatus, expectedMessage }) => {
      const res = await request(app)
        .delete(`/api/posts/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(expectedStatus);
      expect(res.body.message).toBe(expectedMessage);
    }
  );

  it('should can delete post without deleting default image', async () => {
    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const postImageExists = await fileExists('posts', 'default.jpg');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post deleted successfully');
    expect(postImageExists).toBe(true);
  });

  it('should can delete post with deleting non default image', async () => {
    post.postImage = 'test-post.jpg';
    await post.save();
    await copyToUploadDir(testPostImagePath, 'posts');

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data');

    const postImageExists = await fileExists('posts', post.postImage);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post deleted successfully');
    expect(postImageExists).toBe(false);
  });
});

describe('GET /api/posts/:id/comments', () => {
  let post;

  beforeEach(async () => {
    post = await createTestPost();
  });

  afterEach(async () => {
    await removeTestPost();
  });

  it('should reject if post id is invalid', async () => {
    const res = await request(app)
      .get(`/api/posts/invalid/comments`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation errors');
  });

  it('should return empty comments', async () => {
    const res = await request(app)
      .get(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Comments not found');
    expect(res.body.data).toHaveLength(0);
  });

  it('should return comments', async () => {
    await createManyTestComments({ postId: post._id });

    const res = await request(app)
      .get(`/api/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Comments found');
    expect(res.body.data).toHaveLength(10);
    expect(res.body.meta.pageSize).toBe(10);
    expect(res.body.meta.totalItems).toBe(15);
    expect(res.body.meta.currentPage).toBe(1);
    expect(res.body.meta.totalPages).toBe(2);

    await removeTestComment();
  });
});

describe('PATCH /api/posts/:id/like', () => {
  afterEach(async () => {
    await removeTestPost();
  });

  it('should reject if post id is invalid', async () => {
    const res = await request(app)
      .patch(`/api/posts/invalid/like`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation errors');
  });

  it('should can like post', async () => {
    const post = await createTestPost();
    const res = await request(app)
      .patch(`/api/posts/${post._id}/like`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post liked successfully');
    expect(res.body.data.totalLikes).toBe(1);
  });

  it('should can unlike post', async () => {
    const decoded = jwt.decode(userToken);
    const post = await createTestPost({
      likes: [decoded.id],
      totalLikes: 1
    });
    const res = await request(app)
      .patch(`/api/posts/${post._id}/like`)
      .set('Authorization', `Bearer ${userToken}`);

    console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post unliked successfully');
    expect(res.body.data.totalLikes).toBe(0);
  });
});
