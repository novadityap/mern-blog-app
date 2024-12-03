import User from '../models/userModel.js';
import Role from '../models/roleModel.js';
import Blacklist from '../models/blacklistModel.js';
import validateSchema from '../utils/validateSchema.js';
import ResponseError from '../utils/responseError.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import ejs from 'ejs';
import sendMail from '../utils/sendMail.js';
import {
  signupSchema,
  signinSchema,
  verifyEmailSchema,
  resetPasswordSchema
} from '../validations/userValidation.js';

const signup = async data => {
  const { validatedFields, validationErrors } = validateSchema(
    signupSchema,
    data
  );

  if (validationErrors) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, validationErrors);
  }

  const user = await User.findOne({ 
    email: validatedFields.email,
    username: validatedFields.username
  });
  if (user) {
    logger.warn('user already exists');
    return;
  }

  let defaultRole = await Role.findOne({ name: 'user' });
  if (!defaultRole) defaultRole = await Role.create({name: 'user'});

  validatedFields.password = await bcrypt.hash(validatedFields.password, 10);

  const newUser = await User.create({
    ...validatedFields,
    roles: [defaultRole._id],
  });

  const html = await ejs.renderFile('./src/views/verifyEmail.ejs', {
    user: newUser,
    url: `${process.env.CLIENT_URL}/verify-email/${newUser.verificationToken}`,
  });

  await sendMail(newUser.email, 'Verify Email', html);
  logger.info('verification email has been sent');
};

const verifyEmail = async token => {
  const user = await User.findOneAndUpdate(
    {
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    },
    {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
    {
      new: true,
    }
  );

  if (!user) {
    logger.warn('invalid verification token');
    throw new ResponseError('Invalid verification token', 401);
  }

  logger.info('email has been verified successfully');
};

const resendVerification = async data => {
  const { validatedFields, validationErrors } = validateSchema(verifyEmailSchema, data);

  if (validationErrors) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, validationErrors)
  }

  const user = await User.findOneAndUpdate(
    {
      email: validatedFields.email,
      isVerified: false,
    },
    {
      verificationToken: crypto.randomBytes(32).toString('hex'),
      verificationTokenExpires: Date.now() + (24 * 60 * 60 * 1000),
    },
    { 
      new: true,
    }
  );

  if (!user) {
    logger.warn('email is not registered');
    return;
  }

  const html = await ejs.renderFile('./src/views/verifyEmail.ejs', {
    user,
    url: `${process.env.CLIENT_URL}/verify-email/${user.verificationToken}`,
  });

  await sendMail(user.email, 'Verify Email', html);
  logger.info('verification email has been sent');
}

const signin = async data => {
  const { validatedFields, validationErrors } = validateSchema(signinSchema, data);

  if (validationErrors) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, validationErrors)
  }

  const user = await User.findOne({ email: validatedFields.email })
    .populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });

  if (!user) {
    logger.warn('invalid email or password');
    throw new ResponseError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(validatedFields.password, user.password);
  if (!isMatch) {
    logger.warn('invalid email or password');
    throw new ResponseError('Invalid email or password', 401);
  }

  const roles = user.roles.map(role => role.name);
  const permissions = user.roles.reduce((acc, role) => {
    role.permissions.forEach(permission => {
      acc.push(permission);
    });

    return acc;
  }, []);

  const token = jwt.sign(
    { 
      id: user._id,
      username: user.username,
      roles
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { 
      id: user._id,
      username: user.username,
      roles
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES }
  );

  user.refreshToken = refreshToken;
  await user.save();

  logger.info('user signed in successfully');

  return {
    token,
    refreshToken,
    user,
    permissions,
    roles
  }
}

const signout = async refreshToken => {
  if (!refreshToken) {
    logger.warn('refresh token is missing');
    throw new ResponseError('Token is missing', 401);
  }
  
  const user = await User.findOneAndUpdate(
    { refreshToken },
    { refreshToken: null },
    { new: true }
  );

  if (!user) {
    logger.warn('refresh token not found');
    throw new ResponseError('Invalid token', 401);
  }

  await Blacklist.create({ token: refreshToken });
  logger.info('user signed out successfully');
}

const refreshToken = async refreshToken => {
  if (!refreshToken) {
    logger.warn('refresh token is missing');
    throw new ResponseError('Token is missing', 401);
  }

  const blacklistedToken = await Blacklist.findOne({ token: refreshToken });

  if (blacklistedToken) {
    logger.warn('refresh token is blacklisted');
    throw new ResponseError('Invalid token', 401);
  }

  const user = await User.findOne({ refreshToken })
    .populate('roles');

  if (!user) {
    logger.warn('refresh token not found');
    throw new ResponseError('Invalid token', 401);
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const roles = user.roles.map(role => role.name);
  const newToken = jwt.sign(
    {
      id: user._id,
      username: user.username,
      roles,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES,
    }
  );

  logger.info('refresh token has been refreshed successfully');
  return newToken;
}

const requestResetPassword = async data => {
  const { validatedFields, validationErrors } = validateSchema(
    verifyEmailSchema,
    data
  );

  if (validationErrors) {
    logger.warn('validation errors');
    throw new ResponseError('Validation errors', 400, validationErrors);
  }

  const user = await User.findOne({
    email: validatedFields.email,
    isVerified: true,
  });

  if (!user) {
    logger.warn('email is not registered');
    return;
  }

  user.resetToken = crypto.randomBytes(32).toString('hex');
  user.resetTokenExpires = Date.now() + (1 * 60 * 60 * 1000);
  const html = await ejs.renderFile('./src/views/resetPassword.ejs', {
    user,
    url: `${process.env.CLIENT_URL}/reset-password/${user.resetToken}`,
  });

  await sendMail(user.email, 'Reset Password', html);
  await user.save();

  logger.info('reset password email has been sent');
}

const resetPassword = async (data, token) => {
  const { validatedFields, validationErrors } = validateSchema(
    resetPasswordSchema,
    data
  );

  if (validationErrors) {
    logger.warn('validation errors');
    throw new ResponseError('validation errors', 400, validationErrors);
  }

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    logger.warn('invalid reset token');
    throw new ResponseError('Invalid reset token', 401);
  }

  user.password = await bcrypt.hash(validatedFields.newPassword, 10);
  user.resetToken = null;
  user.resetTokenExpires = null;
  await user.save();

  logger.info('password has been reset successfully');
}

export default { 
  signup,
  verifyEmail,
  resendVerification,
  signin,
  signout,
  refreshToken,
  requestResetPassword,
  resetPassword
};
