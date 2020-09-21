import { computed } from 'vue';
import useAsync from '../src/useAsync';

describe('GIVEN, `useAsync', () => {
  describe('WHEN resolve `useAsync`', () => {
    const func = () => new Promise((resolve) => {
      setTimeout(() => {
        resolve('ok');
      });
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

  describe('WHEN reject `useAsync`', () => {
    const func = () => new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(Error('ko'));
      });
    });
    let error;
    let promise;
    beforeAll(async (done) => {
      ({ error, promise } = useAsync(func));
      try {
        await promise.value;
      } catch (e) {
        done();
      }
    });

    it('THEN `data` should be resolved', () => {
      // $FlowFixMe - there is an error
      expect(error.value.message).toBe('ko');
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
