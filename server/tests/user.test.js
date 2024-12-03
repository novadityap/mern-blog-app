import request from 'supertest';
import app from '../src/app.js';
import connectDB from '../src/config/connection.js';
import mongoose from 'mongoose';
import path from 'node:path';
import Role from '../src/models/roleModel.js';
import Permission from '../src/models/permissionModel.js';
import seedRole from '../src/seeders/roleSeeder.js';
import seedPermission from '../src/seeders/permissionSeeder.js';
import {
  createTestUser,
  createManyTestUsers,
  getTestUser,
  createToken,
  createTestRole,
  removeTestRole,
  removeTestUser,
  fileExists,
  copyToUploadDir,
  removeUploadedFile,
} from './testUtil.js';

const adminToken = createToken('auth', 'admin');
const userToken = createToken('auth', 'user');
const invalidToken = createToken('auth', 'invalid');
const testAvatarPath = path.join(
  process.cwd(),
  'tests/uploads/avatars',
  'test-avatar.jpg'
);
const cases = [
  {
    name: 'user id is invalid',
    id: 'invalid',
    expectedStatus: 400,
    expectedMessage: 'Validation errors',
  },
  {
    name: 'user not found',
    id: new mongoose.Types.ObjectId(),
    expectedStatus: 404,
    expectedMessage: 'User not found',
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

describe('GET /api/users', () => {
  beforeEach(async () => {
    await createManyTestUsers(3);
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if unauthorized access', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Permission denied');
  });

  it('should can search without parameter', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Users found');
    expect(res.body.data).toHaveLength(10);
    expect(res.body.meta.pageSize).toBe(10);
    expect(res.body.meta.totalItems).toBeGreaterThanOrEqual(15);
    expect(res.body.meta.currentPage).toBe(1);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('should can search to page 2', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 2 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Users found');
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    expect(res.body.meta.pageSize).toBe(10);
    expect(res.body.meta.totalItems).toBeGreaterThanOrEqual(15);
    expect(res.body.meta.currentPage).toBe(2);
    expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2);
  });

  it('should return users when the search query matches', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'test10' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Users found');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.pageSize).toBe(10);
      expect(res.body.meta.totalItems).toBe(1);
      expect(res.body.meta.currentPage).toBe(1);
      expect(res.body.meta.totalPages).toBe(1);
  });

  it('should return no permissions when search not found', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'notexist' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Users not found');
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/users/:id', () => {
  it('should reject if unauthorized access', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Permission denied');
  });

  it.each(cases)(
    'should reject if $name',
    async ({ id, expectedStatus, expectedMessage }) => {
      const res = await request(app)
        .get(`/api/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(expectedStatus);
      expect(res.body.message).toBe(expectedMessage);
    }
  );

  it('should can get a user', async () => {
    const user = await createTestUser();
    const res = await request(app)
      .get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User found');
    expect(res.body.data).toBeDefined();

    await removeTestUser();
  });
});

describe('POST /api/users', () => {
  let role;

  beforeEach(async () => {
    role = await createTestRole();
  });

  afterEach(async () => {
    await removeTestUser();
    await removeTestRole();
  });

  it('should reject if unauthorized access', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Permission denied');
  });

  it('should reject if request is invalid', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: '',
        email: '',
        password: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation errors');
    expect(res.body.errors.username).toEqual(expect.any(Array));
    expect(res.body.errors.email).toEqual(expect.any(Array));
    expect(res.body.errors.password).toEqual(expect.any(Array));
  });

  it('should reject if email already exists', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'test1',
        email: 'test@me.com',
        password: 'test123',
        roles: [role._id],
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already exists');
  });

  it('should reject if username already exists', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'test',
        email: 'test1@me.com',
        password: 'test123',
        roles: [role._id],
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Username already exists');
  });

  it('should reject if role id is invalid', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'test',
        email: 'test@me.com',
        password: 'test123',
        roles: ['invalid'],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation errors');
    expect(res.body.errors.roles).toEqual(expect.any(Array));
  });

  it('should can create a user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'test',
        email: 'test@me.com',
        password: 'test123',
        roles: [role._id],
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User created successfully');
  });
});

describe('PATCH /api/users/:id', () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if unauthorized access', async () => {
    const res = await request(app)
      .patch(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Permission denied');
  });

  it.each(cases)(
    'should reject if $name',
    async ({ id, expectedStatus, expectedMessage }) => {
      const res = await request(app)
        .get(`/api/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(expectedStatus);
      expect(res.body.message).toBe(expectedMessage);
    }
  );

  it('should can update existing user without changing avatar', async () => {
    const res = await request(app)
      .patch(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User updated successfully');
    expect(res.body.data.email).toBe('test1@me.com');
  });

  it('should can update existing user with changing avatar', async () => {
    const res = await request(app)
      .patch(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com')
      .attach('avatar', testAvatarPath);

    const updatedUser = await getTestUser();
    const avatarExists = await fileExists('avatars', updatedUser.avatar);

    expect(avatarExists).toBe(true);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User updated successfully');
    expect(res.body.data.email).toBe('test1@me.com');

    await removeUploadedFile('avatars', updatedUser.avatar);
  });

  it('Should can update existing user with changing avatar and remove old avatar', async () => {
    user.avatar = 'test-avatar.jpg';
    await user.save();
    await copyToUploadDir(testAvatarPath, 'avatars');

    const res = await request(app)
      .patch(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com')
      .attach('avatar', testAvatarPath);

    const updatedUser = await getTestUser();
    const oldAvatarExists = await fileExists('avatars', 'test-avatar.jpg');
    const avatarExists = await fileExists('avatars', updatedUser.avatar);

    expect(oldAvatarExists).toBe(false);
    expect(avatarExists).toBe(true);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User updated successfully');
    expect(res.body.data.email).toBe('test1@me.com');

    await removeUploadedFile('avatars', updatedUser.avatar);
  });
});

describe('DELETE /api/users/:id', () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if unauthorized access', async () => {
    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Permission denied');
  });

  it.each(cases)(
    'should reject if $name',
    async ({ id, expectedStatus, expectedMessage }) => {
      const res = await request(app)
        .get(`/api/users/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(expectedStatus);
      expect(res.body.message).toBe(expectedMessage);
    }
  );

  it('Should can delete user without removing default avatar', async () => {
    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const avatarExists = await fileExists('avatars', 'default.jpg');

    expect(avatarExists).toBe(true);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User deleted successfully');
  });

  it('should can delete user with removing avatar', async () => {
    user.avatar = 'test-avatar.jpg';
    user.save();
    await copyToUploadDir(testAvatarPath, 'avatars');

    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const avatarExists = await fileExists('avatars', 'test-avatar.jpg');

    expect(avatarExists).toBe(false);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User deleted successfully');
  });
});
