const config = require('../helpers/config.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sendEmail = require('../helpers/send-email');
const db = require('../helpers/db');
const Role = require('../helpers/role');

module.exports = {
  authenticate,
  refreshToken,
  revokeToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  setPassword,
  deactivate,
  reactivate,
  resendInvitation,
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function authenticate({ email, password, ipAddress }) {
  //console.log('User authenticate', email, password, ipAddress);
  const user = await db.User.scope('withHash').findOne({
    where: { email },
  });

  if (
    !user ||
    !user.isVerified ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    throw 'Email or password is incorrect';
  }

  // authentication successful so generate jwt and refresh tokens
  const jwtToken = generateJwtToken(user);
  const refreshToken = generateRefreshToken(user, ipAddress);

  // save refresh token
  await refreshToken.save();

  // return basic details and tokens
  return {
    ...basicDetails(user),
    jwtToken,
    refreshToken: refreshToken.token,
  };
}

async function newauthenticate({ email, password, ipAddress }) {
  const user = await db.User.scope('withHash').findOne({
    where: { email },
  });

  if (
    !user ||
    !user.isVerified ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    //throw 'Email or password is incorrect';
    return { status: 'Error', message: 'Email or password is incorrect' };
  }

  // authentication successful so generate jwt and refresh tokens
  const jwtToken = generateJwtToken(user);
  const refreshToken = generateRefreshToken(user, ipAddress);

  // save refresh token
  await refreshToken.save();

  // return basic details and tokens
  return {
    status: 'success',
    ...basicDetails(user),
    jwtToken,
    refreshToken: refreshToken.token,
  };
}

async function refreshToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);
  const user = await refreshToken.getUser();

  // replace old refresh token with a new one and save
  const newRefreshToken = generateRefreshToken(user, ipAddress);
  //console.log('**************** newRefreshToken: ', newRefreshToken);
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByToken = newRefreshToken.token;
  await refreshToken.save();
  await newRefreshToken.save();

  // generate new jwt
  const jwtToken = generateJwtToken(user);

  // return basic details and tokens
  return {
    ...basicDetails(user),
    jwtToken,
    refreshToken: newRefreshToken.token,
  };
}

async function revokeToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);

  // revoke token and save
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();
}

async function register(params, origin) {
  // check if first user
  const isFirstUser = (await db.User.count()) === 0;
  //console.log('--------------------------------isFirstUser', isFirstUser);

  // validate
  if (await db.User.findOne({ where: { email: params.email } })) {
    // send already registered error in email to prevent user enumeration
    await sendAlreadyRegisteredEmail(params.email, origin);
    return false;
  }

  // create user object
  const user = new db.User(params);
  user.verificationToken = randomTokenString();

  // save user
  //console.log('--------------------------------user', user);
  await user.save();

  // send email
  await sendVerificationEmail(user, origin);
  return true;
}

async function verifyEmail({ token }) {
  const user = await db.User.findOne({
    where: { verificationToken: token },
  });

  if (!user) throw 'Verification failed';

  user.verified = Date.now();
  await user.save();
}

async function forgotPassword({ email }, origin) {
  const user = await db.User.findOne({ where: { email } });
  //console.log('user: ', user);

  // always return ok response to prevent email enumeration
  if (!user) {
    console.log('User not found');
    return { status: 'failed', message: 'User not found' };
  }
  if (!user.active) {
    console.log('User inactive');
    return { status: 'failed', message: 'User is deactivated' };
  }

  // create reset token that expires after 24 hours
  user.resetToken = randomTokenString();
  user.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  // send email
  await sendPasswordResetEmail(user, origin);
}

async function validateResetToken({ token }) {
  const user = await db.User.findOne({
    where: {
      resetToken: token,
      resetTokenExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!user) throw 'Invalid token';

  return user;
}

async function resetPassword({ token, password }) {
  const user = await validateResetToken({ token });

  // update password and remove reset token
  user.passwordHash = await hash(password);
  user.passwordReset = Date.now();
  user.resetToken = null;
  await user.save();
}

async function setPassword({ token, password }) {
  const user = await db.User.findOne({
    where: { verificationToken: token },
  });

  if (!user) throw 'Verification failed';

  // set password and remove verification token
  user.passwordHash = await hash(password);
  user.verificationToken = null;
  await user.save();
}

async function getAll() {
  const users = await db.User.findAll();
  //console.log('users: ', users);
  return users.map((x) => basicDetails(x));
}

async function getById(id) {
  const user = await getUser(id);
  return basicDetails(user);
}

async function create(params) {
  // validate
  if (await db.User.findOne({ where: { email: params.email } })) {
    throw 'Email "' + params.email + '" is already registered';
  }

  const user = new db.User(params);

  // first registered user is an admin and password is set at the time of registration
  // Second user and onwards must have their password set via an email link
  const isFirstUser = (await db.User.count()) === 0;

  if (isFirstUser) {
    user.role = Role.Admin;
    user.verificationToken = randomTokenString();
  } else {
    user.verified = Date.now();

    // hash password
    user.passwordHash = await hash(params.password);
  }

  // save user
  await user.save();

  return basicDetails(user);
}

async function update(id, params) {
  const user = await getUser(id);

  // validate (if email was changed)
  if (
    params.email &&
    user.email !== params.email &&
    (await db.User.findOne({ where: { email: params.email } }))
  ) {
    throw 'Email "' + params.email + '" is already taken';
  }

  // hash password if it was entered
  if (params.password) {
    params.passwordHash = await hash(params.password);
  }

  // copy params to user and save
  Object.assign(user, params);
  user.updated = Date.now();
  await user.save();

  return basicDetails(user);
}

async function resendInvitation(id, origin) {
  const user = await getUser(id);

  user.updated = Date.now();
  user.verificationToken = randomTokenString();
  await user.save();

  // send email
  await sendVerificationEmail(user, origin);
  return true;
}

async function deactivate(id) {
  const user = await getUser(id);

  // change Active state on user and save
  user.active = false;
  user.updated = Date.now();
  await user.save();

  return { status: 'success' };
}

async function reactivate(id) {
  const user = await getUser(id);

  // change Active state on user and save
  user.active = true;
  user.updated = Date.now();
  await user.save();

  return { status: 'success' };
}

async function _delete(id) {
  const user = await getUser(id);
  await user.destroy();
}

// helper functions

async function getUser(id) {
  const user = await db.User.findByPk(id);
  if (!user) throw 'User not found';
  return user;
}

async function getRefreshToken(token) {
  const refreshToken = await db.RefreshToken.findOne({ where: { token } });
  if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
  return refreshToken;
}

async function hash(password) {
  return await bcrypt.hash(password, 10);
}

function generateJwtToken(user) {
  // create a jwt token containing the user id that expires in 15 minutes
  return jwt.sign({ sub: user.id, id: user.id }, config.secret, {
    expiresIn: '15m',
  });
}

function generateRefreshToken(user, ipAddress) {
  // create a refresh token that expires in 7 days
  return new db.RefreshToken({
    userId: user.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress,
  });
}

function randomTokenString() {
  return crypto.randomBytes(40).toString('hex');
}

function basicDetails(user) {
  //console.log('&*&*&*&& basicDetails user: ', JSON.stringify(user));
  const {
    id,
    firstName,
    lastName,
    email,
    phone,
    role,
    active,
    created,
    updated,
    isVerified,
    f_clientId,
  } = user;
  return {
    id,
    firstName,
    lastName,
    email,
    phone,
    role,
    active,
    created,
    updated,
    isVerified,
    f_clientId,
  };
}

async function sendVerificationEmail(user, origin) {
  //console.log('sendVerificationEmail', user, origin);
  let message;
  if (origin) {
    const verifyUrl = `${origin}/users/verify-email?token=${user.verificationToken}`;
    message = `<p>Please click below to verify your email address:</p>
              <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
  } else {
    message = `<p>Please use the token below to verify your email address with the <code>/user/verify-email</code> api route:</p>
              <p><code>${user.verificationToken}</code></p>`;
  }

  await sendEmail({
    to: user.email,
    subject: 'The System Collections Platform - Verify Email',
    html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`,
  });
}

async function sendAlreadyRegisteredEmail(email, origin) {
  let message;
  if (origin) {
    message = `<p>If you don't know your password, please visit the <a href="${origin}/users/forgot-password">forgot password</a> page.</p>`;
  } else {
    message = `<p>If you don't know your password, please reset it via the <code>/user/forgot-password</code> api route.</p>`;
  }

  await sendEmail({
    to: email,
    subject: 'The System Collections Platform - Email Already Registered',
    html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`,
  });
}

async function sendPasswordResetEmail(user, origin) {
  let message;
  if (origin) {
    const resetUrl = `${origin}/users/reset-password?token=${user.resetToken}`;
    message = `<p>Please click the link below to reset your password; the link is valid for one day:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>`;
  } else {
    message = `<p>Please use the token below to reset your password with the <code>/user/reset-password</code> api route:</p>
              <p><code>${user.resetToken}</code></p>`;
  }

  await sendEmail({
    to: user.email,
    subject: 'The System Collections Platform - Reset Password',
    html: `<h4>Reset Password Email</h4>
               ${message}`,
  });
}
