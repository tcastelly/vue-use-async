import { computed, Ref, ref } from 'vue';
import useAsync from '@/useAsync';

describe('GIVEN, `useAsync', () => {
  describe('WHEN resolve `useAsync`', () => {
    const func = () => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('ok');
      });
    });
    let data: Ref<undefined | string>;
    let promise;

    beforeAll(async () => {
      ({ data, promise } = useAsync<string>(func));
      await promise.value;
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

    let error: Ref<undefined | null | Error>;
    let promise;
    beforeAll(async () => {
      ({ error, promise } = useAsync(func));
      try {
        await promise.value;
      } catch (e) {
        //
      }
    });

    it('THEN `data` should be resolved', () => {
      expect(error.value?.message).toBe('ko');
    });
  });

  describe('WHEN `func` expect params', () => {
    const func = (arg: string) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg}`);
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      ({ data, promise } = useAsync<string>(func, computed(() => 'msg')));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg');
    });
  });

  describe('WHEN `func` expect params and `condition`', () => {
    const func = (arg: string) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg}`);
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      ({ data, promise } = useAsync<string>(
        func,
        computed(() => 'msg'),
        ref(true),
      ));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg');
    });
  });

  describe('WHEN `func` expect multiple params', () => {
    const func = (arg1: string, arg2: string) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg1} ${arg2}`);
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      ({ data, promise } = useAsync<string>(func, computed(() => ['msg', 'msg2'])));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg msg2');
    });
  });
});
