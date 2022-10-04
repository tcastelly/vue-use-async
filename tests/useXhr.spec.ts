/**
 * @jest-environment jsdom
 */
import {
  computed, ComputedRef, Ref, ref, watch,
} from 'vue';
import Xhr from '@/Xhr';
import { cacheIds, clearCache } from '@/cache';
import useXhr from '@/useXhr';
import type { Func } from '@/index';
import mockXhr from './mockXhr';

describe('GIVEN `useXhr`', () => {
  const token = ref('FAKE_TOKEN');

  describe('WHEN run the function to resolve get', () => {
    it('THEN `get` should be a function', () => {
      const { get } = useXhr({ legacy: true, token });
      expect(typeof get).toBe('function');
    });

    describe('WHEN execute `get` Xhr', () => {
      let mocked: any;
      let data: Ref<undefined | null | string>;
      let reload: Func;
      let isPending: ComputedRef<undefined | null | boolean>;
      let xhr: Xhr<any>;
      const params = ref({ ok: 1, undefinedParam: undefined, otherParam: true });

      afterAll(() => {
        // maybe already restored
        mocked.restore?.();
      });

      beforeAll((done) => {
        const { get } = useXhr({ legacy: true, token });

        mocked = mockXhr().get({
          url: '/fake/get/1?otherParam=true',
        });
        mocked.resolve('get-ok');

        const {
          data: _data,
          reload: _reload,
          isPending: _isPending,
          xhr: _xhr,
        } = get<'get-ok'>({
          url: () => '/fake/get/:ok',
          params,
          enabled: computed(() => !!params.value.ok),
          cacheDuration: 'max',
        });

        xhr = _xhr;

        data = _data;
        reload = _reload;
        isPending = _isPending;

        watch(
          () => _data.value,
          () => done(),
        );
      });
      it('THEN query should be retrieved with good value', () => {
        expect(data.value).toBe('get-ok');
      });

      it('AND url should have params', () => {
        expect(xhr.url).toBe('/fake/get/1');
      });

      it('AND token should be in the `xhr` instance', () => {
        expect(xhr.token).toBe('FAKE_TOKEN');
        expect(mocked.context.header[1][0]).toBe('Authorization');
        expect(mocked.context.header[1][1]).toBe(`Bearer ${String(token.value)}`);
      });

      it('AND cache should be set', () => {
        expect(cacheIds().indexOf('/fake/get/1?otherParam=true') > -1).toBe(true);
      });

      it('AND params should be split in and params', () => {
        expect(JSON.stringify(xhr.params)).toContain(JSON.stringify({ otherParam: true }));
      });

      describe('WHEN execute `reload`', () => {
        let _isPending: undefined | null | boolean;
        beforeAll((done) => {
          clearCache('/fake/get/1?otherParam=true');
          reload();

          watch(
            () => isPending.value,
            () => {
              _isPending = isPending.value;
              if (isPending.value === true) {
                done();
              }
            },
            {
              immediate: true,
            },
          );
        });

        it('THEN `isPending` should be toggle to true', () => {
          expect(_isPending).toBe(true);
        });
      });
    });
  });

  describe('WHEN run the function to resolve a post', () => {
    it('THEN `post` should be a function', () => {
      const { post } = useXhr({ legacy: true, token });
      expect(typeof post).toBe('function');
    });

    describe('WHEN execute `post`', () => {
      let mocked: any;
      let data: Ref<undefined | null | string>;
      let xhr: Xhr<any>;
      const params = ref({ ok: 1, undefinedParam: undefined });

      afterAll(() => {
        // maybe already restored
        mocked.restore?.();
      });
      beforeAll((done) => {
        const { post } = useXhr({ legacy: true, token });

        mocked = mockXhr().post({
          url: '/fake/post/1',
        });
        mocked.resolve('post-ok');

        const {
          data: _data,
          xhr: _xhr,
        } = post<'post-ok'>({
          url: '/fake/post/1',
          params,
        });

        xhr = _xhr;

        data = _data;

        watch(
          () => _data.value,
          () => done(),
        );
      });

      it('THEN query should be retrieved with good value', () => {
        expect(data.value).toBe('post-ok');
      });

      it('AND token should be in the `xhr` instance', () => {
        expect(xhr.token).toBe('FAKE_TOKEN');
        expect(mocked.context.header[1][0]).toBe('Authorization');
        expect(mocked.context.header[1][1]).toBe(`Bearer ${String(token.value)}`);
      });

      it('AND params should be extracted', () => {
        expect(JSON.stringify(xhr.params)).toContain(JSON.stringify(params.value));
      });
    });
  });

  describe('WHEN run the function to resolve a delete', () => {
    it('THEN `post` should be a function', () => {
      const { post } = useXhr({ legacy: true, token });
      expect(typeof post).toBe('function');
    });

    describe('WHEN execute `post`', () => {
      let mocked: any;
      let data: Ref<undefined | null | string>;
      let xhr: Xhr<any>;
      const params = [1, 2, 3];

      afterAll(() => {
        // maybe already restored
        mocked.restore?.();
      });
      beforeAll((done) => {
        const { delete: _delete } = useXhr({ legacy: true, token });

        mocked = mockXhr().delete({
          url: '/fake/delete/1?%5B1%2C2%2C3%5D',
        });
        mocked.resolve('delete-ok');

        const {
          data: _data,
          xhr: _xhr,
        } = _delete<'delete-ok'>({
          url: '/fake/delete/1',
          params,
        });

        xhr = _xhr;

        data = _data;

        watch(
          () => _data.value,
          () => done(),
        );
      });

      it('THEN query should be retrieved with good value', () => {
        expect(data.value).toBe('delete-ok');
      });

      it('AND token should be in the `xhr` instance', () => {
        expect(xhr.token).toBe('FAKE_TOKEN');
        expect(mocked.context.header[1][0]).toBe('Authorization');
        expect(mocked.context.header[1][1]).toBe(`Bearer ${String(token.value)}`);
      });

      it('AND params should be extracted', () => {
        expect(JSON.stringify(xhr.params)).toContain(JSON.stringify(params));
      });
    });
  });

  describe('WHEN run the function to reject the query', () => {
    it('THEN `get` should be a function', () => {
      const { get } = useXhr({ legacy: true, token });
      expect(typeof get).toBe('function');
    });

    describe('WHEN execute `get` Xhr', () => {
      const { get } = useXhr({ legacy: true, token });

      let mocked: any;

      afterAll(() => {
        // maybe already restored
        mocked.restore?.();
      });

      beforeAll(() => {
        mocked = mockXhr().get({ url: '/fake/fail/get/1' });
        mocked.reject('ko');
      });

      // eslint-disable-next-line consistent-return
      it('THEN error should be retrieved with good value', () => {
        const fetch = async (): Promise<unknown> => new Promise((resolve, reject) => {
          const { promise } = get(
            '/fake/fail/get/:id',
            () => ({
              id: 1,
            }),
          );
          promise.value.catch((e) => {
            reject(Error(e));
          });
        });
        return expect(fetch).rejects.toThrow('ko');
      });
    });
  });
});
