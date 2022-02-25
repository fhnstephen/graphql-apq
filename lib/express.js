"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("./core");

var _errors = require("./errors");

var _default = options => {
  const apq = new _core.APQ(options);
  return async (req, res, next) => {
    try {
      req.body = await apq.processOperation(req.body);
      next();
    } catch (error) {
      // Respond known errors gracefully
      if (error instanceof _errors.PersistedQueryError) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(apq.formatError(error)));
        return;
      }

      next(error);
    }
  };
};

exports.default = _default;