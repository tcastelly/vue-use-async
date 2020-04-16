// @flow

import Vue from 'vue';
import VueCompositionApi, { computed } from '@vue/composition-api';
import { useAsync } from '../src';

Vue.use(VueCompositionApi);

describe('GIVEN, `useAsync', () => {
  describe('WHEN `useAsync`', () => {
    const func = () => new Promise((resolve) => {
      setTimeout(() => {
        resolve('ok');
      }, 200);
    });
    let data;
    let promise;
    beforeAll(async (done) => {
      ({ data, promise } = useAsync(func));
      await promise.value;
      done();
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok');
    });
  });

  describe('WHEN `func` expect params', () => {
    const func = (arg) => new Promise((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg}`);
      }, 200);
    });
    let data;
    let promise;
    beforeAll(async (done) => {
      ({ data, promise } = useAsync(func, computed(() => 'msg')));
      await promise.value;
      done();
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg');
    });
  });

  describe('WHEN `func` expect params and `condition`', () => {
    const func = (arg) => new Promise((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg}`);
      }, 200);
    });
    let data;
    let promise;
    beforeAll(async (done) => {
      ({ data, promise } = useAsync(
        func,
        computed(() => 'msg'),
        () => true,
      ));
      await promise.value;
      done();
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg');
    });
  });

  describe('WHEN `func` expect multiple params', () => {
    const func = (arg1, arg2) => new Promise((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg1} ${arg2}`);
      }, 200);
    });
    let data;
    let promise;
    beforeAll(async (done) => {
      ({ data, promise } = useAsync(func, computed(() => ['msg', 'msg2'])));
      await promise.value;
      done();
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg msg2');
    });
  });
});
