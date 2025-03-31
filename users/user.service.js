const config = require("config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Op } = require("sequelize");
const sendEmail = require("_helpers/send-email");
const db = require("_helpers/db");
const Role = require("_helpers/role");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = {
  authenticate,
  refreshToken,
  revokeToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function authenticate({ email, password, ipAddress }) {
  const user = await db.User.scope("withHash").findOne({
    where: { email },
  });

  if (
    !user ||
    !user.isVerified ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    throw new AppError("Email or password is incorrect", 401);
  }

  // authentication successful so generate jwt and refresh tokens
  const jwtToken = generateJwtToken(user);
  const refreshToken = generateRefreshToken(user, ipAddress);

  // save refresh token
  await refreshToken.save();
  // console.log('saved in authenticate: ', refreshToken);

  // return basic details and tokens
  return {
    ...basicDetails(user),
    jwtToken,
    refreshToken: refreshToken.token,
  };
}

// Remove unnecessary console logs
async function refreshToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);
  const user = await refreshToken.getUser();
  const newRefreshToken = generateRefreshToken(user, ipAddress);

  // console.log('about to refreshToken.save: ', refreshToken);
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

async function _refreshToken({ token, ipAddress }) {
  console.log("refreshToken!!");

  if (token) {
    const refreshToken = await getRefreshToken(token);
    //console.log('refreshToken: ', refreshToken);
    const user = await refreshToken.getUser();
    // replace old refresh token with a new one and save
    const newRefreshToken = generateRefreshToken(user, ipAddress);
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
  } else {
    console.log("no token");
    // generate mock jwt
    const jwtToken = generateJwtToken({ user: { id: "0" } });
    return {
      user: "no user",
      jwtToken,
      refreshToken: jwtToken,
    };
  }
}

async function revokeToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);

  // revoke token and save
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();
}

async function register(params, origin) {
  // validate
  if (await db.User.findOne({ where: { email: params.email } })) {
    // send already registered error in email to prevent user enumeration
    return await sendAlreadyRegisteredEmail(params.email, origin);
  }

  // create user object
  const user = new db.User(params);

  // first registered user is an admin
  const isFirstUser = (await db.User.count()) === 0;
  user.role = isFirstUser ? Role.Admin : Role.User;
  user.verificationToken = randomTokenString();

  // hash password
  user.passwordHash = await hash(params.password);

  // save user
  await user.save();

  // send email
  await sendVerificationEmail(user, origin);
}

async function verifyEmail({ token }) {
  const user = await db.User.findOne({
    where: { verificationToken: token },
  });

  if (!user) throw "Verification failed";

  user.verified = Date.now();
  user.verificationToken = null;
  await user.save();
}

async function forgotPassword({ email }, origin) {
  const user = await db.User.findOne({ where: { email } });

  // always return ok response to prevent email enumeration
  if (!user) return;

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

  if (!user) throw "Invalid token";

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

async function getAll() {
  const users = await db.User.findAll();
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
  user.verified = Date.now();

  // hash password
  user.passwordHash = await hash(params.password);

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

async function _delete(id) {
  const user = await getUser(id);
  await user.destroy();
}

// helper functions

async function getUser(id) {
  const user = await db.User.findByPk(id);
  if (!user) throw "User not found";
  return user;
}

async function getUserByToken(token) {
  const { userId } = await db.RefreshToken.findOne({ where: { token } });
  return await getUser(userId);
}

async function getRefreshToken(token) {
  // console.log('getRefreshToken(token): ', token);
  const refreshToken = await db.RefreshToken.findOne({ where: { token } });
  // console.log('refreshToken: ', refreshToken.isActive);
  if (!refreshToken || !refreshToken.isActive)
    throw { status: 400, message: "Invalid token" };
  return refreshToken;
}

async function hash(password) {
  return await bcrypt.hash(password, 10);
}

function generateJwtToken(user) {
  // create a jwt token containing the user id that expires in 15 minutes
  return jwt.sign({ sub: user.id, id: user.id }, config.secret, {
    expiresIn: "15m",
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
  return crypto.randomBytes(40).toString("hex");
}

function basicDetails(user) {
  const { id, firstName, lastName, email, role, created, updated, isVerified } =
    user;
  return {
    id,
    firstName,
    lastName,
    email,
    role,
    created,
    updated,
    isVerified,
  };
}

async function sendVerificationEmail(user, origin) {
  if (origin) {
    const verifyUrl = `${origin}/user/verify-email?token=${user.verificationToken}`;
    message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to verify your email address with the <code>/user/verify-email</code> api route:</p>
                   <p><code>${user.verificationToken}</code></p>`;
  }

  await sendEmail({
    to: user.email,
    subject: "Sign-up Verification API - Verify Email",
    html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`,
  });
}

async function sendAlreadyRegisteredEmail(email, origin) {
  let message;
  if (origin) {
    message = `<p>If you don't know your password please visit the <a href="${origin}/user/forgot-password">forgot password</a> page.</p>`;
  } else {
    message = `<p>If you don't know your password you can reset it via the <code>/user/forgot-password</code> api route.</p>`;
  }

  await sendEmail({
    to: email,
    subject: "Sign-up Verification API - Email Already Registered",
    html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`,
  });
}

async function sendPasswordResetEmail(user, origin) {
  let message;
  if (origin) {
    const resetUrl = `${origin}/user/reset-password?token=${user.resetToken}`;
    message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to reset your password with the <code>/user/reset-password</code> api route:</p>
                   <p><code>${user.resetToken}</code></p>`;
  }

  await sendEmail({
    to: user.email,
    subject: "Sign-up Verification API - Reset Password",
    html: `<h4>Reset Password Email</h4>
               ${message}`,
  });
}
