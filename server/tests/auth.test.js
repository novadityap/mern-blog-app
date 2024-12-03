import request from 'supertest';
import app from '../src/app.js';
import {
  findRelevantLog,
  createTestUser,
  removeTestUser,
  createToken,
} from './testUtil.js';
import connectDB from '../src/config/connection.js';
import mongoose from 'mongoose';
import Blacklist from '../src/models/blacklistModel.js';
import jwt from 'jsonwebtoken';

const authAdminToken = createToken('auth', 'admin');
const refreshAdminToken = createToken('refresh', 'admin');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /api/auth/signup', () => {
  let startTime;

  beforeEach(async () => {
    startTime = new Date();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if request is invalid', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: '',
      email: '',
      password: '',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toMatchObject({
      username: expect.any(Array),
      email: expect.any(Array),
      password: expect.any(Array),
    });
  });

  it('should can sign up and should send a verification email', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: 'test',
      email: 'test@me.com',
      password: 'test123',
    });

    const logMessage = 'verification email has been sent';
    const relevantLog = await findRelevantLog(logMessage, startTime);

    expect(res.status).toBe(200);
    expect(relevantLog).toBeDefined();
  });

  it('should reject if user already exists and reject sending a verification email', async () => {
    await createTestUser();

    const res = await request(app).post('/api/auth/signup').send({
      username: 'test',
      email: 'test@me.com',
      password: 'test123',
    });

    const logMessage = 'user already exists';
    const relevantLog = await findRelevantLog(logMessage, startTime);

    expect(res.status).toBe(200);
    expect(relevantLog).toBeDefined();
  });
});

describe('POST /api/auth/verify-email/:token', () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if token is invalid', async () => {
    const res = await request(app).post(
      '/api/auth/verify-email/invalid-token'
    );

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid verification token');
  });

  it('should reject if token is expired', async () => {
    user.verificationTokenExpires = new Date() - 1000;
    await user.save();

    const res = await request(app).post(
      `/api/auth/verify-email/${user.verificationToken}`
    );

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid verification token');
  });

  it('should can verify email', async () => {
    const res = await request(app).post(
      `/api/auth/verify-email/${user.verificationToken}`
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Your account has been verified successfully');
  });
});

describe('POST /api/auth/resend-verification', () => {
  let startTime;

  beforeEach(async () => {
    startTime = new Date();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if request is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({
        email: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors.email).toBeDefined();
  });

  it('should reject sending a verification email if  user is not registered', async () => {
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({
        email: 'test@me.com',
      });

    const logMessage = 'email is not registered';
    const relevantLog = await findRelevantLog(logMessage, startTime);

    expect(res.status).toBe(200);
    expect(relevantLog).toBeDefined();
  });

  it('should can resend a verification email', async () => {
    await createTestUser();

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({
        email: 'test@me.com',
      });

    const logMessage = 'verification email has been sent';
    const relevantLog = await findRelevantLog(logMessage, startTime);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(
      'Please check your email to verify your account'
    );
    expect(relevantLog).toBeDefined();
  });
});

describe('POST /api/auth/signin', () => {
  beforeEach(async () => {
    await createTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if request is invalid', async () => {
    const res = await request(app).post('/api/auth/signin').send({
      email: '',
      password: '',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toMatchObject({
      email: expect.any(Array),
      password: expect.any(Array),
    });
  });

  it('should reject if email or password is invalid', async () => {
    const res = await request(app).post('/api/auth/signin').send({
      email: 'test@me.co',
      password: 'test12',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should can sign in', async () => {
    const res = await request(app).post('/api/auth/signin').send({
      email: 'test@me.com',
      password: 'test123',
    });

    const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('username');
    expect(res.body.data).toHaveProperty('email');
    expect(res.body.data).toHaveProperty('avatar');
    expect(decoded.id).toBeDefined();
    expect(decoded.roles).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=/);
  });
});

describe('POST /api/auth/signout', () => {
  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if refresh token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signout')
      .set('Authorization', `Bearer ${authAdminToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token is missing');
  });

  it('should reject if refresh token not found in database', async () => {
    const startTime = new Date();
    const res = await request(app)
      .post('/api/auth/signout')
      .set('Authorization', `Bearer ${authAdminToken}`)
      .set('Cookie', `refreshToken=${refreshAdminToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  it('should can sign out', async () => {
    const user = await createTestUser();
    user.refreshToken = refreshAdminToken;
    await user.save();

    const res = await request(app)
      .post('/api/auth/signout')
      .set('Authorization', `Bearer ${authAdminToken}`)
      .set('Cookie', `refreshToken=${refreshAdminToken}`);

    expect(res.status).toBe(204);
    await Blacklist.findOneAndDelete({ token: refreshAdminToken });
  });
});

describe('POST /api/auth/refresh-token', () => {
  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if refresh token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${authAdminToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token is missing');
  });

  it('should reject if refresh token is blacklisted', async () => {
    await Blacklist.create({ token: refreshAdminToken });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${authAdminToken}`)
      .set('Cookie', `refreshToken=${refreshAdminToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');

    await Blacklist.findOneAndDelete({ token: refreshAdminToken });
  });

  it('should reject if refresh token not found in database', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${authAdminToken}`)
      .set('Cookie', `refreshToken=${refreshAdminToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  it('should can refresh token', async () => {
    const user = await createTestUser();
    user.refreshToken = refreshAdminToken;
    await user.save();

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${authAdminToken}`)
      .set('Cookie', `refreshToken=${refreshAdminToken}`);

    const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Token refreshed successfully');
    expect(decoded.id).toBeDefined();
    expect(decoded.roles).toBeDefined();
  });
});

describe('POST /api/auth/request-reset-password', () => {
  let startTime;

  beforeAll(() => {
    startTime = new Date();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if request is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/request-reset-password')
      .send({
        email: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors.email).toBeDefined();
  });

  it('should reject if email is not registered', async () => {
    const res = await request(app)
      .post('/api/auth/request-reset-password')
      .send({
        email: 'test@me.com',
      });

    const logMessage = 'email is not registered';
    const relevantLog = await findRelevantLog(logMessage, startTime);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Please check your email to reset your password');
    expect(relevantLog).toBeDefined();
  });

  it('should can send a reset password email', async () => {
    const user = await createTestUser();
    user.isVerified = true;
    await user.save();

    const res = await request(app)
      .post('/api/auth/request-reset-password')
      .send({
        email: 'test@me.com',
      });

    const logMessage = 'reset password email has been sent';
    const relevantLog = await findRelevantLog(logMessage, startTime);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(
      'Please check your email to reset your password'
    );
    expect(relevantLog).toBeDefined();
  });
});

describe('POST /api/auth/reset-password/:token', () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser();
  });

  afterEach(async () => {
    await removeTestUser();
  });

  it('should reject if request is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/invalid-token')
      .send({
        newPassword: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors.newPassword).toBeDefined();
  });

  it('should reject if token is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/invalid-token')
      .send({
        newPassword: 'test123',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid reset token');
  });

  it('should reject if token is expired', async () => {
    user.resetTokenExpires = Date.now() - 1000;
    await user.save();

    const res = await request(app)
      .post(`/api/auth/reset-password/${user.resetToken}`)
      .send({
        newPassword: 'test123',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid reset token');
  });

  it('should can reset password', async () => {
    const res = await request(app)
      .post(`/api/auth/reset-password/${user.resetToken}`)
      .send({
        newPassword: 'test123',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(
      'Your password has been reset successfully. Please sign in with your new password'
    );
  });
});
