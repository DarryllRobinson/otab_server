const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../middleware/validate-request');
const authorise = require('../middleware/authorise');
const Role = require('../helpers/role');
const userService = require('./user.service');

// routes
router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', authorise(), revokeTokenSchema, revokeToken);
router.post('/register', registerSchema, register);
router.post('/resend-invitation/:id', resendInvitation);
router.post('/verify-email', verifyEmailSchema, verifyEmail);
router.post('/forgot-password', forgotPasswordSchema, forgotPassword);
router.post(
  '/validate-reset-token',
  validateResetTokenSchema,
  validateResetToken
);
router.post('/reset-password', resetPasswordSchema, resetPassword);
router.post('/set-password', setPasswordSchema, setPassword);
router.get('/', authorise(), getAll);
router.get('/:id', authorise(), getById);
router.post('/', authorise(Role.Admin), createSchema, create);
router.put('/:id', authorise(), updateSchema, update);
router.put('/deactivate/:id', authorise(), deactivate);
router.put('/reactivate/:id', authorise(), reactivate);
router.delete('/:id', authorise(), _delete);

module.exports = router;

function authenticateSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
  const { email, password } = req.body;
  const ipAddress = req.ip;
  userService
    .authenticate({ email, password, ipAddress })
    .then(({ refreshToken, ...user }) => {
      setTokenCookie(res, refreshToken);
      res.json(user);
    })
    .catch(next);
}

function refreshToken(req, res, next) {
  const token = req.cookies.refreshToken;
  const ipAddress = req.ip;
  userService
    .refreshToken({ token, ipAddress })
    .then(({ refreshToken, ...user }) => {
      setTokenCookie(res, refreshToken);
      res.json(user);
    })
    .catch(next);
}

function revokeTokenSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().empty(''),
  });
  validateRequest(req, next, schema);
}

function revokeToken(req, res, next) {
  // accept token from request body or cookie
  const token = req.body.token || req.cookies.refreshToken;
  const ipAddress = req.ip;

  if (!token) return res.status(400).json({ message: 'Token is required' });

  // users can revoke their own tokens and admins can revoke any tokens
  if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: 'Unauthorised' });
  }

  userService
    .revokeToken({ token, ipAddress })
    .then(() => res.json({ message: 'Token revoked' }))
    .catch(next);
}

function registerSchema(req, res, next) {
  //console.log('registerSchema: ', req.body);
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    //password: Joi.string().min(8),
    //confirmPassword: Joi.string().valid(Joi.ref('password')),
    role: Joi.string().required(),
    active: Joi.boolean().required(),
    f_clientId: Joi.number().required(),
  });
  validateRequest(req, next, schema);
}

function register(req, res, next) {
  userService
    .register(req.body, req.get('origin'))
    .then((newUser) => {
      if (newUser) {
        res.json({
          message:
            'Registration successful, please check your email for verification instructions',
          status: 'success',
        });
      } else {
        res.json({
          message:
            'Registration unsuccessful, a user with the same email was found',
          status: 'duplicate',
        });
      }
    })
    .catch(next);
}

function resendInvitation(req, res, next) {
  userService
    .resendInvitation(req.params.id, req.get('origin'))
    .then(() => {
      res.json({
        message:
          'Invitation sent successfully, please check their email for verification instructions',
        status: 'success',
      });
    })
    .catch(next);
}

function verifyEmailSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function verifyEmail(req, res, next) {
  userService
    .verifyEmail(req.body)
    .then(() =>
      res.json({ message: 'Verification successful, you can now login' })
    )
    .catch(next);
}

function forgotPasswordSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  validateRequest(req, next, schema);
}

function forgotPassword(req, res, next) {
  userService
    .forgotPassword(req.body, req.get('origin'))
    .then((response) => {
      //console.log('response: ', response);
      if (response === undefined) {
        res.json({
          status: 'ok',
          message: 'Please check your email for password reset instructions',
        });
      } else if (response.status !== 'ok') {
        res.json(response);
      }
    })
    .catch(next);
}

function validateResetTokenSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function validateResetToken(req, res, next) {
  userService
    .validateResetToken(req.body)
    .then(() => res.json({ message: 'Token is valid' }))
    .catch(next);
}

function resetPasswordSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  });
  validateRequest(req, next, schema);
}

function resetPassword(req, res, next) {
  userService
    .resetPassword(req.body)
    .then(() =>
      res.json({ message: 'Password reset successful, you can now login' })
    )
    .catch(next);
}

function setPasswordSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  });
  validateRequest(req, next, schema);
}

function setPassword(req, res, next) {
  userService
    .setPassword(req.body)
    .then(() =>
      res.json({ message: 'Password set successful, you can now login' })
    )
    .catch(next);
}

function getAll(req, res, next) {
  userService
    .getAll()
    .then((users) => res.json(users))
    .catch(next);
}

function getById(req, res, next) {
  // users can get their own user and admins can get any user
  if (Number(req.params.id) !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: 'Unauthorised' });
  }

  userService
    .getById(req.params.id)
    .then((user) => (user ? res.json(user) : res.sendStatus(404)))
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8),
    confirmPassword: Joi.string().valid(Joi.ref('password')),
    role: Joi.string().valid(Role.Admin, Role.User).required(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  userService
    .create(req.body)
    .then((user) => res.json(user))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schemaRules = {
    firstName: Joi.string().empty(''),
    lastName: Joi.string().empty(''),
    email: Joi.string().email().empty(''),
    phone: Joi.string().empty(),
    password: Joi.string().min(8).empty(''),
    confirmPassword: Joi.string().valid(Joi.ref('password')).empty(''),
  };

  // only admins can update role
  /*if (req.user.role === Role.Admin) {
    schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty('');
  }*/

  const schema = Joi.object(schemaRules).with('password', 'confirmPassword');
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  // users can update their own user and admins can update any user
  if (Number(req.params.id) !== req.user.id) {
    return res.status(401).json({ message: 'Unauthorised' });
  }

  userService
    .update(req.params.id, req.body)
    .then((user) => res.json(user))
    .catch(next);
}

function deactivate(req, res, next) {
  userService
    .deactivate(req.params.id)
    .then((user) => res.json(user))
    .catch(next);
}

function reactivate(req, res, next) {
  userService
    .reactivate(req.params.id)
    .then((user) => res.json(user))
    .catch(next);
}

function _delete(req, res, next) {
  // users can delete their own user and admins can delete any user
  if (Number(req.params.id) !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: 'Unauthorised' });
  }

  userService
    .delete(req.params.id)
    .then(() => res.json({ message: 'User deleted successfully' }))
    .catch(next);
}

// helper functions

function setTokenCookie(res, token) {
  // create cookie with refresh token that expires in 7 days
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
  res.cookie('refreshToken', token, cookieOptions);
}
