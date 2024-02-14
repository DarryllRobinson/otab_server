const { expressjwt: expressJwt } = require('express-jwt');
const { secret } = require('user.config.json');
const db = require('_helpers/db');

module.exports = authorize;

function authorize(roles = []) {
  // roles param can be a single role string (e.g. Role.User or 'User')
  // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return [
    // authenticate JWT token and attach user to request object (req.user)
    expressJwt({ secret, algorithms: ['HS256'] }),

    // authorize based on user role
    async (req, res, next) => {
      const { body } = req;
      const user = await db.User.findByPk(body.id);

      if (!user || (roles.length && !roles.includes(body.role))) {
        // user no longer exists or role not authorized
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // authentication and authorization successful
      body.role = user.role;
      const refreshTokens = await user.getRefreshTokens();
      body.ownsToken = (token) =>
        !!refreshTokens.find((x) => x.token === token);
      next();
    },
  ];
}
