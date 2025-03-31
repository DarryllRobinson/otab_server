const { expressjwt: expressJwt } = require("express-jwt");
const { secret } = require("config.json");
const db = require("_helpers/db");
const logger = require("winston");

module.exports = authorize;

function authorize(roles = []) {
  // roles param can be a single role string (e.g. Role.User or 'User')
  // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
  if (typeof roles === "string") {
    roles = [roles];
  }

  return [
    // authenticate JWT token and attach user to request object (req.user)
    expressJwt({ secret, algorithms: ["HS256"] }),

    // authorize based on user role
    async (req, res, next) => {
      const user = await db.User.findByPk(req.user.id);

      if (!user || (roles.length && !roles.includes(user.role))) {
        logger.warn(`Unauthorized access attempt by user ID: ${req.user.id}`);
        return res.status(401).json({ message: "Unauthorized" });
      }

      req.user.role = user.role;
      const refreshTokens = await user.getRefreshTokens();
      req.user.ownsToken = (token) =>
        !!refreshTokens.find((x) => x.token === token);

      next();
    },
  ];
}
