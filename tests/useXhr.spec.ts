/**
 * @jest-environment jsdom
 */
import {
  computed, ComputedRef, nextTick, Ref, ref, watch,
} from 'vue';
import Xhr from '@/Xhr';
import useXhr from '@/useXhr';
import type { Func, Obj } from '@/index';
import mockXhr from './mockXhr';

describe('GIVEN `useAsync`', () => {
  const token = ref('FAKE_TOKEN');

  describe('WHEN run the function to resolve', () => {
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
      const params = ref({ ok: 1, undefinedParam: undefined });

      afterAll(() => {
        // maybe already restored
        mocked.restore?.();
      });
      beforeAll((done) => {
        const { get } = useXhr({ legacy: true, token });

        mocked = mockXhr().get({
          url: '/fake/get/1',
        });
        mocked.resolve('get-ok');

        const {
          data: _data,
          reload: _reload,
          isPending: _isPending,
          xhr: _xhr,
        } = get<any>({
          url: () => '/fake/get/:ok',
          params,
          enabled: computed(() => !!params.value.ok),
        });

        nextTick(() => {
          params.value.ok = 1;
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
      it('AND token should be in the `xhr` instance', () => {
        expect(xhr.token).toBe('FAKE_TOKEN');
        expect(mocked.context.header[1][0]).toBe('Authorization');
        expect(mocked.context.header[1][1]).toBe(`Bearer ${String(token.value)}`);
      });

      describe('WHEN execute `reload`', () => {
        let _isPending: undefined | null | boolean;
        beforeAll((done) => {
          reload();

          watch(
            () => isPending.value,
            () => {
              _isPending = isPending.value;
              if (isPending.value === true) {
                done();
              }
            }, {
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

  describe('WHEN run the function to reject the query', () => {
    it('THEN `get` should be a function', () => {
      const { get } = useXhr({ legacy: true, token });
      expect(typeof get).toBe('function');
    });

    describe('WHEN execute `get` Xhr', () => {
      const { get } = useXhr({ legacy: true, token });

      let mocked: any;
      let error: Ref<Error | Obj | null>;

      afterAll(() => {
        // maybe already restored
        mocked.restore?.();
      });
      beforeAll(async () => {
        mocked = mockXhr().get({ url: '/fake/fail/get/1' });
        mocked.reject('ko');

        const {
          error: _error,
          promise,
        } = get(
          '/fake/fail/get/:id',
          () => ({
            id: 1,
          }),
        );

        error = _error;

        try {
          await promise.value;
        } catch (e) {
          //
        }
      });
      it('THEN error should be retrieved with good value', async () => {
        expect(error.value).toBe('ko');
      });
    });
  });
});
