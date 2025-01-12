"use strict";

var _ = _interopRequireDefault(require("./"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('core', () => {
  let cache;
  let apq;

  const getCache = () => ({
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn()
  });

  beforeEach(() => {
    cache = getCache();
    apq = new _.default({
      cache
    });
  });
  it('should create an APQ instance', () => {
    expect(new _.default()).toBeInstanceOf(_.default);
  });
  describe('cache', () => {
    it('should create a default cache object', () => {
      // @ts-ignore
      const cache = new _.default().cache;
      expect(cache).toHaveProperty('get', expect.any(Function));
      expect(cache).toHaveProperty('set', expect.any(Function));
      expect(cache).toHaveProperty('has', expect.any(Function));
    });
    it('should be possible to provide a custom cache object', () => {
      const cache = getCache(); // @ts-ignore

      expect(new _.default({
        cache
      }).cache).toBe(cache);
    });
    it('should throw for invalid custom cache', () => {
      // @ts-ignore
      expect(() => new _.default({
        cache: ''
      })).toThrow('Invalid cache'); // @ts-ignore

      expect(() => new _.default({
        cache: {}
      })).toThrow('Invalid cache');
    });
    it('should throw for invalid resolveHash', () => {
      // @ts-ignore
      expect(() => new _.default({
        resolveHash: ''
      })).toThrow('Invalid resolveHash'); // @ts-ignore

      expect(() => new _.default({
        resolveHash: {}
      })).toThrow('Invalid resolveHash');
    });
  });
  describe('formatError', () => {
    it('should return a persisted query formatter error', () => {
      expect(apq.formatError(new Error('message'))).toHaveProperty('errors.0.message', 'message');
    });
    it('should be possible to provide a custom persisted query error formatter', () => {
      const error = new Error('message');

      const formatError = () => 'custom';

      expect(new _.default({
        formatError
      }).formatError(error)).toBe('custom');
    });
  });
  describe('processOperation', () => {
    describe('errors', () => {
      it.each([[1, 'Invalid GraphQL operation provided'], ['', 'Invalid GraphQL operation provided'], [null, 'No GraphQL operation provided'], [undefined, 'No GraphQL operation provided']])('should throw for invalid GraphQL operations', (op, expected) => {
        // @ts-ignore
        return expect(() => apq.processOperation(op)).rejects.toThrow(expected);
      });
      it('should throw for missing hash', async () => {
        await expect(() => apq.processOperation({})).rejects.toThrow('PersistedQueryHashMissing');
        await expect(() => apq.processOperation({
          query: 'graphql query'
        })).rejects.toThrow('PersistedQueryHashMissing');
      });
      it('should throw for query not found', async () => {
        await expect(() => apq.processOperation({})).rejects.toThrow('PersistedQueryHashMissing');
        await expect(() => apq.processOperation({
          query: 'graphql query'
        })).rejects.toThrow('PersistedQueryHashMissing');
      });
      it('should throw when provided hash is not cached', async () => {
        const sha256Hash = 'some hash';
        const operation = {
          extensions: {
            persistedQuery: {
              sha256Hash
            }
          }
        };
        await expect(() => apq.processOperation(operation)).rejects.toThrow('PersistedQueryNotFound');
      });
    });
    it('should return unaltered operation when there is a query and it is already cached', async () => {
      const query = 'some query';
      const sha256Hash = 'some hash';
      const operation = {
        query,
        extensions: {
          persistedQuery: {
            sha256Hash
          }
        }
      }; // @ts-ignore

      await apq.cache.set(sha256Hash, query);
      expect((await apq.processOperation(operation))).toBe(operation);
    });
    it('should return unaltered operation when no hash is available and not requiring hashes', async () => {
      const apq = new _.default({
        requireHash: false
      });
      const operation = {};
      expect((await apq.processOperation(operation))).toEqual(operation);
    });
    it('should add the query to the operation when already cached', async () => {
      const query = 'some query';
      const sha256Hash = 'some hash';
      const operation = {
        extensions: {
          persistedQuery: {
            sha256Hash
          }
        }
      };
      cache.has.mockReturnValueOnce(true);
      cache.get.mockReturnValueOnce(query);
      const result = await apq.processOperation(operation);
      expect(result).toHaveProperty('query', query);
    });
    it('should add the query to the cache when both query and hash are available', async () => {
      const query = 'some query';
      const sha256Hash = 'some hash';
      const operation = {
        query,
        extensions: {
          persistedQuery: {
            sha256Hash
          }
        }
      };
      expect((await apq.processOperation(operation))).toBe(operation); // @ts-ignore

      expect(apq.cache.set).toHaveBeenCalledTimes(1); // @ts-ignore

      expect(apq.cache.set).toHaveBeenCalledWith(sha256Hash, query);
    });
  });
});