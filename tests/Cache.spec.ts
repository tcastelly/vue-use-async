/**
 * @jest-environment jsdom
 */
import cache, { cacheSize, clearCache } from '@/cache';
import type { XhrGet } from '@/index';

describe('Given Cache', () => {
  it('THEN no cache should be available', () => {
    let res = null;
    try {
      res = cache({ id: '/fake/' });
    } catch (e) {
      expect(res).toBeNull();
    } finally {
      expect(res).toBeNull();
    }
  });
  describe('WHEN send a promise', () => {
    let query: XhrGet<any>;

    const p: any = new Promise((resolve) => {
      resolve('ok');
    });
    p.abortXhr = () => {
      console.log('has been abort');
    };

    beforeAll(() => {
      query = cache({
        id: '/fake/',
        duration: 0,
        xhr: () => p,
      });
    });
    it('THEN cache should be inserted', () => expect(query).resolves.toEqual('ok'));
    describe('WHEN destroy a specific cache', () => {
      let xhr: () => XhrGet<any>;
      beforeAll(() => {
        // @ts-ignore - fake xhr
        xhr = () => new Promise((resolve) => {
          resolve('ok');
        });
        cache({
          id: '/fake-canceled/',
          xhr,
        });

        // clear the cache
        cache({
          id: '/fake-canceled/',
        });
        clearCache('/fake-canceled/');
      });
      it('THEN cache should be empty', () => {
        let res = null;
        try {
          res = cache({ id: '/fake-canceled/' });
        } catch (e) {
          expect(res).toBeNull();
        } finally {
          expect(res).toBeNull();
        }
      });
      describe('WHEN destroy all cache', () => {
        beforeAll(() => clearCache());

        it('THEN the map of cache should be empty', () => {
          expect(cacheSize()).toBe(0);
        });
      });
    });
  });
});
