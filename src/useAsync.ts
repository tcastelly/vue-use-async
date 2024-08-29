import type { ComputedRef, Ref } from 'vue';
import {
  computed,
  ref,
  unref,
  watch,
} from 'vue';
import { Result } from '@/useResult';
import uuid from '@/_base/uuid';
import type {
  TypeAllowed,
  UnwrappedPromiseType,
  RequiredParams,
} from './index';

type OnErrorCb<T> = (e: null | Error, params: T) => unknown;

type OnStartCb<T> = (params: T) => unknown;

type OnEndCb<T, Z> = (res: T, params: Z) => unknown;

const useAsync = <T, Z extends TypeAllowed, A extends TypeAllowed[]>(
  func: ((...args: A) => Promise<T>) | ((args: Z) => Promise<T>),
  params?: RequiredParams<Z, A>,
  enabled: Ref<boolean> | (() => boolean) = ref(true),
): {
  isPending: Ref<undefined | boolean>,
  data: ComputedRef<undefined | null | UnwrappedPromiseType<typeof func>>;
  error: Ref<null | Error>,
  reload: () => unknown,
  onError: (cb: OnErrorCb<RequiredParams<Z, A>>) => unknown,
  onStart: (cb: OnStartCb<RequiredParams<Z, A>>) => unknown,
  onEnd: (cb: OnEndCb<UnwrappedPromiseType<typeof func>, RequiredParams<Z, A>>) => unknown,
  promise: ComputedRef<null | ReturnType<typeof func>>,
} => {
  const isPending = ref<undefined | boolean>();

  const data = ref<T>();

  const error: Ref<null | Error> = ref(null);

  const onErrorList: Array<OnErrorCb<RequiredParams<Z, A>>> = [];

  const onStartList: Array<OnStartCb<RequiredParams<Z, A>>> = [];

  const onEndList: Array<OnEndCb<T, RequiredParams<Z, A>>> = [];

  // for legacy use case
  const d = ref<null | Promise<T>>(null);

  const wrapParams = computed(() => {
    if (typeof params === 'function') {
      return params() as RequiredParams<Z, A>;
    }
    return unref(params) as RequiredParams<Z, A>;
  });

  const lastUnwrapParams = ref();

  const _enabled = computed(() => {
    if (typeof enabled === 'function') {
      return enabled();
    }
    return unref(enabled);
  });

  // generate new xhr/promise
  const _reload = (_params: RequiredParams<Z, A>) => {
    if (!_enabled.value) {
      return null;
    }

    onStartList.forEach((cb) => cb(wrapParams.value));

    isPending.value = true;
    error.value = null;

    // possible to call with rest params
    const funcDefault = func as ((args: RequiredParams<Z, A>) => Promise<T>);

    // call with only one param
    const funcRest = func as ((...args: A) => Promise<T>);

    // it's possible to pass multiple args by using an array as params
    d.value = Array.isArray(_params)
      ? funcRest(..._params)
      : funcDefault(_params);

    d.value.catch((_error) => {
      error.value = _error || null;

      onErrorList.forEach((cb) => cb(error.value, wrapParams.value));

      error.value = _error;
    });

    d.value.then((res) => {
      data.value = res;

      onEndList.forEach((cb) => cb(res, wrapParams.value));
    });

    d.value.finally(() => {
      isPending.value = false;
    });

    return d.value;
  };

  const reload = () => _reload(wrapParams.value);

  const onError = (cb: OnErrorCb<RequiredParams<Z, A>>) => {
    onErrorList.push(cb);
  };

  const onStart = (cb: OnStartCb<RequiredParams<Z, A>>) => {
    onStartList.push(cb);
  };

  const onEnd = (cb: OnEndCb<UnwrappedPromiseType<typeof func>, RequiredParams<Z, A>>) => {
    onEndList.push(cb);
  };

  const promise = computed(() => d.value);

  // reload if the query has been enabled
  watch(
    () => _enabled.value,
    (v) => {
      // we don't want to execute twice if params changed AND exec changed
      if (!isPending.value && v) {
        _reload(wrapParams.value);
      }
    },
    {
      // avoid simultaneously query
      immediate: false,
    },
  );

  watch(
    () => error.value,
    (err) => {
      if (err) {
        throw err;
      }
    },
  );

  watch(
    () => wrapParams.value,
    (v) => {
      const vStr = JSON.stringify(v);
      if (
        !isPending.value
        && (
          // fix if there is no change. Just undefined as value
          (v === undefined && lastUnwrapParams.value === undefined)

          || (_enabled.value && vStr !== JSON.stringify(lastUnwrapParams.value))
        )
      ) {
        _reload(v);
      }
      lastUnwrapParams.value = vStr === undefined ? undefined : JSON.parse(vStr);
    },
    {
      immediate: _enabled.value,
      deep: true,
    },
  );

  return {
    isPending,

    // set variable in ro only for TS
    data: computed({
      get: () => data.value,
      set: (v: typeof data.value | Result<typeof data.value>) => {
        // variable updated by `useResult`
        if (v instanceof Result && v.uuid === uuid) {
          data.value = v as typeof data.value;
        } else {
          console.warn('"useAsync" update a readonly field is not allowed');
          data.value = v as typeof data.value;
        }
      },
    }) as ComputedRef,

    error,
    reload,
    onError,
    onStart,
    onEnd,
    promise,
  };
};

export default useAsync;
