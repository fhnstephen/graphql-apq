"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStorage = void 0;

var _memoryCache = require("memory-cache");

const getStorage = () => {
  const cache = new _memoryCache.Cache();
  return {
    get: key => cache.get(key),
    set: (key, value) => void cache.put(key, value),
    has: key => cache.keys().includes(key)
  };
};

exports.getStorage = getStorage;