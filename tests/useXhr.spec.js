// @flow

import Vue from 'vue';
import VueCompositionApi, { ref } from '@vue/composition-api';
import mockXhr from './mockXhr';
import { useXhr, Xhr } from '../src';

Vue.use(VueCompositionApi);

describe('GIVEN `useAsync`', () => {
  const token = ref('FAKE_TOKEN');

  describe('WHEN run the function', () => {
    let get;
    let xhr: Xhr<any>;
    beforeAll(() => {
      ({ get, xhr } = useXhr({ legacy: true, token }));
    });
    it('THEN `get` should be a function', () => {
      expect(typeof get).toBe('function');
    });

    describe('WHEN execute `get` Xhr', () => {
      let mocked;
      let data;
      beforeAll(async (done) => {
        mocked = mockXhr.get({ url: '/fake/get' });
        mocked.resolve('get-ok');

        const { data: _data, promise } = get({ url: '/fake/get', params: {} });
        data = _data;

        await promise;
        done();
      });
      it('THEN query should be retrieved with good value', async () => {
        expect(data.value).toBe('get-ok');
      });
      it('AND token should be in the `xhr` instance', () => {
        expect(xhr.token).toBe('FAKE_TOKEN');
        expect(mocked.context.header[1][0]).toBe('Authorization');
        expect(mocked.context.header[1][1]).toBe(`Bearer ${String(token.value)}`);
      });
    });
  });
});
