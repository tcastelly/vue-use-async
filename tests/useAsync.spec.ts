import type { ComputedRef, Ref } from 'vue';
import { computed, ref } from 'vue';
import {
  beforeAll,
  describe,
  expect,
  it,
} from '@jest/globals';
import useAsync from '@/useAsync';

describe('GIVEN, `useAsync', () => {
  describe('WHEN resolve `useAsync`', () => {
    const func = async () => new Promise<string>((resolve) => {
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
      const rejectFunc = async () => Promise.reject(Error('ko')).catch((e) => {
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
    const func = async (arg: string) => new Promise<string>((resolve) => {
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
    const func = async (arg: string) => new Promise<string>((resolve) => {
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

  describe('WHEN wait enabled with param', () => {
    const func = async (arg: string) => new Promise<string>((resolve) => {
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

  describe('WHEN wait enabled without param', () => {
    const func = async () => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('ok');
      }, 5);
    });

    const enabled = ref(true);

    let data: Ref<undefined | null | string>;
    beforeAll((done) => {
      let onEnd;
      ({ data, onEnd } = useAsync(
        func,
        enabled,
      ));

      setTimeout(() => {
        enabled.value = false;

        setTimeout(() => {
          enabled.value = true;
        }, 10);
      }, 100);

      // initial call + call when enabled again
      let i = 0;
      onEnd(() => {
        if (i > 0) {
          done();
        }
        i += 1;
      });
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok');
    });
  });

  describe('WHEN disabled without param', () => {
    let calls = 0;
    const func = async () => {
      calls += 1;
      return 'ok';
    };

    const enabled = ref(false);

    let data: Ref<undefined | null | string>;
    let promise: ComputedRef<null | Promise<string>>;
    beforeAll(async () => {
      ({ data, promise } = useAsync(func, () => enabled.value));
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
    });

    it('THEN `func` should not be called', () => {
      expect(calls).toBe(0);
      expect(data.value).toBe(undefined);
    });

    it('THEN `func` should be called once enabled', async () => {
      enabled.value = true;
      await new Promise((resolve) => {
        setTimeout(resolve);
      });
      await promise.value;
      expect(calls).toBe(1);
      expect(data.value).toBe('ok');
    });
  });

  describe('WHEN `func` expect params and `condition` as callback', () => {
    const func = async (arg: string) => new Promise<string>((resolve) => {
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
    const func = async (arg: string) => new Promise<string>((resolve) => {
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
    const func = async (arg1: string, arg2: number, arg3: boolean) => new Promise<string>((resolve) => {
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

  describe('WHEN use `func` with unexpected (1) params', () => {
    const func = async () => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('ok');
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      // @ts-expect-error - we're trying to call `func` without params
      ({ data, promise } = useAsync(func, () => 'ok'));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok');
    });
  });

  describe('WHEN use `func` with unexpected (2) params', () => {
    const func = async () => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('ok');
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      // @ts-expect-error - we're trying to call `func` without params
      ({ data, promise } = useAsync(func, () => ({})));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok');
    });
  });

  describe('WHEN use `func` with unexpected (3) params', () => {
    const func = async () => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('ok');
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      // @ts-expect-error - we're trying to call `func` without params
      ({ data, promise } = useAsync(func, () => ({
        ok: true,
      })));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok');
    });
  });

  describe('WHEN use `func` with unexpected (4) params', () => {
    const func = async () => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('ok');
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      // @ts-expect-error - we're trying to call `func` without params
      ({ data, promise } = useAsync(func, () => []));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok');
    });
  });

  describe('WHEN use `func` with unexpected (5) params', () => {
    const func = async () => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('ok');
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      // @ts-expect-error - we're trying to call `func` without params
      ({ data, promise } = useAsync(func, () => [true]));
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok');
    });
  });

  describe('WHEN use `func` without params', () => {
    const func = async (arg1: string, arg2: number, arg3: boolean) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg1} ${arg2} ${arg3}`);
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      // @ts-expect-error - we're trying to call `func` without params
      ({ data, promise } = useAsync(func) as any);
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok undefined undefined undefined');
    });
  });

  describe('WHEN use `func` with wrong params number', () => {
    const func = async (arg1: string, arg2: number, arg3: boolean) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg1} ${arg2} ${arg3}`);
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      // @ts-expect-error - `func` expects multiple params, so a single scalar is invalid
      ({ data, promise } = useAsync(func, 'toto') as any);
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok toto undefined undefined');
    });
  });

  describe('WHEN use `func` without optional parameter', () => {
    const func = async (arg1?: string) => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg1}`);
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      ({ data, promise } = useAsync(func) as any);
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok undefined');
    });
  });

  describe('WHEN use `func` without initialized optional parameter', () => {
    const func = async (arg1 = 'ok') => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`ok ${arg1}`);
      }, 200);
    });

    let data: Ref<undefined | null | string>;
    let promise;
    beforeAll(async () => {
      ({ data, promise } = useAsync(func) as any);
      await promise.value;
    });

    it('THEN `data` should be resolved', () => {
      expect(data.value).toBe('ok ok');
    });
  });
});
