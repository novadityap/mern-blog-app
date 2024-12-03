import authService from '../services/authService.js';

const signup = async (req, res, next) => {
  try {
    await authService.signup(req.body);

    res.json({
      code: 200,
      message: 'Please check your email to verify your account',
    });
  } catch (e) {
    next(e);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    await authService.verifyEmail(req.params.token);

    res.json({
      code: 200,
      message: 'Your account has been verified successfully',
    });
  } catch (e) {
    next(e);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    await authService.resendVerification(req.body);

    res.json({
      code: 200,
      message: 'Please check your email to verify your account',
    });
  } catch (e) {
    next(e);
  }
};

const signin = async (req, res, next) => {
  try {
    const { token, refreshToken, user, permissions, roles } =
      await authService.signin(req.body);

    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        code: 200,
        message: 'Signed in successfully',
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatarUrl,
          roles,
          permissions,
          token,
        },
      });
  } catch (e) {
    next(e);
  }
};

const signout = async (req, res, next) => {
  try {
    await authService.signout(req.cookies.refreshToken);

    res.clearCookie('refreshToken');
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const newToken = await authService.refreshToken(req.cookies.refreshToken);
    
    res.json({
      code: 200,
      message: 'Token refreshed successfully',
      data: { token: newToken },
    });
  } catch (e) {
    next(e);
  }
};

const requestResetPassword = async (req, res, next) => {
  try {
    await authService.requestResetPassword(req.body);

    res.json({
      code: 200,
      message: 'Please check your email to reset your password',
    });
  } catch (e) {
    next(e);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body, req.params.token);
   
    res.json({
      code: 200,
      message:
        'Your password has been reset successfully. Please sign in with your new password',
    });
  } catch (e) {
    next(e);
  }
};

export default {
  signup,
  verifyEmail,
  resendVerification,
  signin,
  signout,
  refreshToken,
  requestResetPassword,
  resetPassword,
};
