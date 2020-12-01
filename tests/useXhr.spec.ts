import Vue from 'vue';
import VueCompositionApi, { computed, ref, watch } from '@vue/composition-api';
import useXhr from '@/useXhr';
import mockXhr from './mockXhr';

Vue.use(VueCompositionApi);

describe('GIVEN `useAsync`', () => {
  const token = ref('FAKE_TOKEN');

  describe('WHEN run the function to resolve', () => {
    let get;
    beforeAll(() => {
      ({ get } = useXhr({ legacy: true, token }));
    });
    it('THEN `get` should be a function', () => {
      expect(typeof get).toBe('function');
    });

    describe('WHEN execute `get` Xhr', () => {
      let mocked;
      let data;
      let reload;
      let isPending;
      let xhr;
      let undefinedParam;
      const params = ref({ ok: 0, t: undefinedParam });

      afterAll(() => {
        mocked.restore();
      });
      beforeAll(async (done) => {
        mocked = mockXhr.get({
          url: '/fake/get/1',
        });
        mocked.resolve('get-ok');

        const {
          data: _data,
          reload: _reload,
          isPending: _isPending,
          promise,
          xhr: _xhr,
        } = get(
          '/fake/get/:ok',
          params,
          computed(() => !!params.value.ok),
        );

        params.value.ok = 1;

        xhr = _xhr;

        data = _data;
        reload = _reload;
        isPending = _isPending;

        await promise.value;
        setTimeout(() => {
          done();
        }, 1000);
      });
      it('THEN query should be retrieved with good value', async () => {
        expect(data.value).toBe('get-ok');
      });
      it('AND token should be in the `xhr` instance', () => {
        expect(xhr.token).toBe('FAKE_TOKEN');
        expect(mocked.context.header[1][0]).toBe('Authorization');
        expect(mocked.context.header[1][1]).toBe(`Bearer ${String(token.value)}`);
      });

      describe('WHEN execute `reload`', () => {
        let _isPending;
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
    let get;

    beforeAll(() => {
      ({ get } = useXhr({ legacy: true, token }));
    });
    it('THEN `get` should be a function', () => {
      expect(typeof get).toBe('function');
    });

    describe('WHEN execute `get` Xhr', () => {
      let mocked;
      let error;

      afterAll(() => {
        mocked.restore();
      });
      beforeAll(async (done) => {
        mocked = mockXhr.get({ url: '/fake/fail/get' });
        mocked.reject('ko');

        const {
          error: _error,
          promise,
        } = get('/fake/fail/get', {});

        error = _error;

        try {
          await promise.value;
        } catch (e) {
          done();
        }
      });
      it('THEN error should be retrieved with good value', async () => {
        expect(error.value).toBe('ko');
      });
    });
  });
});
