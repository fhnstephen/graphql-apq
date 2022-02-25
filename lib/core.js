"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.APQ = void 0;

var _memoryStorage = require("./memory-storage");

var _errors = require("./errors");

const defaults = {
  cache: (0, _memoryStorage.getStorage)(),
  requireHash: true,
  formatError: error => ({
    errors: [{
      message: error.message
    }]
  }),
  resolveHash: operation => {
    var _operation$extensions, _operation$extensions2;

    return (operation === null || operation === void 0 ? void 0 : (_operation$extensions = operation.extensions) === null || _operation$extensions === void 0 ? void 0 : (_operation$extensions2 = _operation$extensions.persistedQuery) === null || _operation$extensions2 === void 0 ? void 0 : _operation$extensions2.sha256Hash) || null;
  }
};

class APQ {
  constructor(_config) {
    const config = { ...defaults,
      ..._config
    };
    this.cache = config.cache;
    this.formatError = config.formatError;
    this.requireHash = config.requireHash;
    this.resolveHash = config.resolveHash;
    this.validateConfig();
  }

  validateConfig() {
    const cacheMethods = ['get', 'set', 'has'];

    if (!this.cache || !cacheMethods.every(key => this.cache[key])) {
      throw new Error('Invalid cache provided');
    }

    if (typeof this.resolveHash !== 'function') {
      throw new Error('Invalid resolveHash provided');
    }
  }
  /**
   * Processes an operation and ensure query is set, when possible.
   */


  async processOperation(operation) {
    if (typeof operation !== 'object' && typeof operation !== 'undefined') {
      throw new Error('Invalid GraphQL operation provided');
    }

    if (!operation) {
      throw new Error('No GraphQL operation provided');
    }

    const {
      query
    } = operation;
    const hash = await this.resolveHash(operation);

    if (!hash) {
      // Advise user on missing required hash.
      if (this.requireHash) {
        throw new _errors.errors.HASH_MISSING();
      } // Proceed with unmodified operation in case no hash is present.


      return operation;
    }

    const isCached = hash && (await this.cache.has(hash)); // Proceed with unmodified operation in case query is present and already cached.

    if (query && isCached) {
      return operation;
    } // Append query to the operation in case we have it cached.


    if (!query && isCached) {
      return { ...operation,
        query: this.cache.get(hash)
      };
    } // Add the query to the cache in case we don't have it yet.


    if (query && !isCached) {
      await this.cache.set(hash, query);
    } // Proceed with original operation if we had both query and hash, but was
    // already cached.


    if (query) {
      return operation;
    } // Fail with no persisted query found in case no query could be resolved.


    throw new _errors.errors.NOT_FOUND();
  }

}

exports.APQ = APQ;