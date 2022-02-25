"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errors = exports.PersistedQueryError = void 0;

class PersistedQueryError extends Error {}
/**
 * Error for when no query could be resolve.
 */


exports.PersistedQueryError = PersistedQueryError;

class PersistedQueryNotFound extends PersistedQueryError {
  message = 'PersistedQueryNotFound';
}
/**
 * Error for when no hash is found in the operation.
 */


class PersistedQueryHashMissing extends PersistedQueryError {
  message = 'PersistedQueryHashMissing';
}

const errors = {
  NOT_FOUND: PersistedQueryNotFound,
  HASH_MISSING: PersistedQueryHashMissing
};
exports.errors = errors;