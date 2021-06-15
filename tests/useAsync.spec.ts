import { computed, Ref, ref } from 'vue';
import useAsync from '@/useAsync';

describe('GIVEN, `useAsync', () => {
  describe('WHEN resolve `useAsync`', () => {
    const func = () => new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('ok');
      });
    });
    let data: Ref<string>;
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

    let error: Ref<null | Error>;
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

    let data: Ref<null | string>;
    let promise;
    beforeAll(async () => {
      ({ data, promise } = useAsync<string>(func, computed(() => 'msg')));
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

    let data: Ref<null | string>;
    beforeAll((done) => {
      let onEnd;
      ({ data, onEnd } = useAsync<string>(
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

    let data: Ref<null | string>;
    beforeAll((done) => {
      let onEnd;
      ({ data, onEnd } = useAsync<string>(
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

    let data: Ref<null | string>;
    let promise;
    beforeAll(async () => {
      ({ data, promise } = useAsync<string>(
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

    let data: Ref<null | string>;
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

    let data: Ref<null | string>;
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
