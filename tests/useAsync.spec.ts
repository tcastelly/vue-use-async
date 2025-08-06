import type { Ref } from 'vue';
import { computed, ref } from 'vue';
import useAsync from '@/useAsync';

describe('GIVEN, `useAsync', () => {
  describe('WHEN resolve `useAsync`', () => {
    const func = () => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('ok');
      });
    });
    let data: Ref<undefined | null | string>;
    let promise;

    beforeAll(async () => {
      ({ data, promise } = useAsync(func));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok');
    });
  });

  describe('WHEN reject `useAsync`', () => {
    let err: Error;

    beforeAll(async () => new Promise((resolve) => {
      const rejectFunc = () => Promise.reject(Error('ko')).catch((e) => {
        err = e;
        resolve(e);
      });

      const f = () => useAsync(rejectFunc);
      f();
    }));

    it('promise should be rejected', () => {
      expect(err.message).toBe('ko');
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
      ({ data, promise } = useAsync(func, computed(() => 'msg')));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg');
    });
  });

  describe('WHEN change params', () => {
    const func = (arg: string) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg}`);
      }, 5);
    });

    const params = ref('');

    let data: Ref<undefined | null | string>;
    beforeAll((done) => {
      let onEnd;
      ({ data, onEnd } = useAsync(
        func,
        params,
      ));

      setTimeout(() => {
        params.value = 'msg2';

        setTimeout(() => {
          params.value = 'msg';
        }, 20);
      }, 100);

      let i = 0;
      onEnd(() => {
        if (i > 1) {
          done();
        }
        i += 1;
      });
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg');
    });
  });

  describe('WHEN wait enabled', () => {
    const func = (arg: string) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg}`);
      }, 5);
    });

    const enabled = ref(true);

    const params = ref('');

    let data: Ref<undefined | null | string>;
    beforeAll((done) => {
      let onEnd;
      ({ data, onEnd } = useAsync(
        func,
        params,
        enabled,
      ));

      setTimeout(() => {
        params.value = 'msg2';
        enabled.value = false;

        setTimeout(() => {
          params.value = 'msg';
        }, 20);

        setTimeout(() => {
          enabled.value = true;
        }, 10);
      }, 100);

      let i = 0;
      onEnd(() => {
        if (i > 1) {
          done();
        }
        i += 1;
      });
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg');
    });
  });

  describe('WHEN `func` expect params and `condition` as callback', () => {
    const func = (arg: string) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg}`);
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      ({ data, promise } = useAsync(
        func,
        () => 'msg',
        () => true,
      ));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg');
    });
  });

  describe('WHEN `func` expect params and `condition` as Ref', () => {
    const func = (arg: string) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg}`);
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      ({ data, promise } = useAsync(
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
    const func = (arg1: string, arg2: number, arg3: boolean) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg1} ${arg2} ${arg3}`);
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      ({ data, promise } = useAsync(
        func,
        () => ['msg', 42, true],
      ));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok msg 42 true');
    });
  });
});
