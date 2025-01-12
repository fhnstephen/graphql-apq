"use strict";

var _supertest = _interopRequireDefault(require("supertest"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _express = _interopRequireDefault(require("express"));

var _express2 = _interopRequireDefault(require("./express"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const operation = (query, sha256Hash) => ({ ...(sha256Hash ? {
    extensions: {
      persistedQuery: {
        sha256Hash
      }
    }
  } : {}),
  ...(query ? {
    query
  } : {})
});

describe('express middleware', () => {
  describe('unit', () => {
    const args = body => [{
      body
    }, {
      setHeader: jest.fn(),
      send: jest.fn()
    }, jest.fn()];

    const expectErrorResponse = (res, message) => {
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(res.send).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveProperty('mock.calls.0.0', JSON.stringify({
        errors: [{
          message
        }]
      }));
    };

    describe('errors', () => {
      it('should respond error when missing query hash', async () => {
        const [req, res, next] = args({});
        await (0, _express2.default)()(req, res, next);
        expectErrorResponse(res, 'PersistedQueryHashMissing');
      });
      it('should respond error when no query found', async () => {
        const body = operation(null, 'some hash');
        const [req, res, next] = args(body);
        await (0, _express2.default)()(req, res, next);
        expect(req.body).toBe(body);
        expectErrorResponse(res, 'PersistedQueryNotFound');
      });
    });
    it('should persist query when both hash an query are provided', async () => {
      const sha256Hash = 'some hash';
      const query = 'some query';
      const body = operation(query, sha256Hash);
      const cache = {
        get: jest.fn(),
        set: jest.fn(),
        has: () => false
      };
      const [req, res, next] = args(body);
      const middleware = (0, _express2.default)({
        cache
      });
      await middleware(req, res, next);
      expect(cache.set).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith(sha256Hash, query);
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.body).toBe(body);
    });
    it('should fulfil operation with previously persisted query', async () => {
      const sha256Hash = 'some hash';
      const query = 'some query';
      const cache = {
        set: jest.fn(),
        get: jest.fn(() => query),
        has: () => true
      };
      const body = operation(null, sha256Hash);
      const [req, res, next] = args(body);
      const middleware = (0, _express2.default)({
        cache
      });
      expect(req.body).not.toHaveProperty('query', query);
      await middleware(req, res, next);
      expect(cache.get).toHaveBeenCalledTimes(1);
      expect(cache.get).toHaveBeenCalledWith(sha256Hash); // fulfilled:

      expect(req.body).toHaveProperty('query', query);
    });
  });
  describe('integration', () => {
    let after;

    const getApp = config => (0, _express.default)().use(_bodyParser.default.json()).use((0, _express2.default)(config)).use(after = jest.fn((_req, res) => res.send('ok')));

    describe('errors', () => {
      it('should respond error when missing query hash', () => {
        return (0, _supertest.default)(getApp()).post('/').send().expect(200, {
          errors: [{
            message: 'PersistedQueryHashMissing'
          }]
        });
      });
      it('should respond error when no query found', async () => {
        return (0, _supertest.default)(getApp()).post('/').send(operation(null, 'some hash')).expect(200, {
          errors: [{
            message: 'PersistedQueryNotFound'
          }]
        });
      });
    });
    it('should persist query when both hash an query are provided', async () => {
      const sha256Hash = 'some hash';
      const query = 'some query';
      const cache = {
        get: jest.fn(),
        set: jest.fn(),
        has: () => false
      };
      const body = operation(query, sha256Hash);
      await (0, _supertest.default)(getApp({
        cache
      })).post('/').send(body).expect(200, 'ok');
      expect(cache.set).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith(sha256Hash, query);
      expect(after).toHaveBeenCalledTimes(1);
      expect(after).toHaveProperty('mock.calls.0.0.body', body);
    });
    it('should fulfil operation with previously persisted query', async () => {
      const sha256Hash = 'some hash';
      const query = 'some query';
      const cache = {
        set: jest.fn(),
        get: jest.fn(() => query),
        has: () => true
      };
      const body = operation(null, sha256Hash);
      await (0, _supertest.default)(getApp({
        cache
      })).post('/').send(body).expect(200, 'ok');
      expect(cache.get).toHaveBeenCalledTimes(1);
      expect(cache.get).toHaveBeenCalledWith(sha256Hash); // fulfilled:

      expect(after).toHaveProperty('mock.calls.0.0.body.query', query);
    });
  });
});