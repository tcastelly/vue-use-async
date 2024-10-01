import type { ComputedRef, Ref, UnwrapRef } from 'vue';
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

type OnErrorCb<T> = (e: null | Error, params: T) => void;

type OnStartCb<T> = (params: T) => void;

type OnEndCb<T, Z> = (res: T, params: Z) => void;

const useAsync = <T,
  Z extends TypeAllowed,
  A extends TypeAllowed[],
  F extends ((...args: A) => Promise<T>) | ((args: Z) => Promise<T>),
  P extends RequiredParams<Parameters<F>[0], A>,
>(
    func: ((...args: A) => Promise<T>) | ((args: Z) => Promise<T>),
    params?: P,
    enabled: Ref<boolean> | (() => boolean) = ref(true),
  ): {
  isPending: Ref<undefined | boolean>,
  data: ComputedRef<undefined | null | UnwrappedPromiseType<F>>;
  error: Ref<null | Error>,
  reload: () => void,
  onError: (cb: OnErrorCb<P extends () => infer PP ? PP : (P extends ComputedRef<unknown> ? UnwrapRef<P> : P)>) => void,
  onStart: (cb: OnStartCb<P extends () => infer PP ? PP : (P extends ComputedRef<unknown> ? UnwrapRef<P> : P)>) => void,
  onEnd: (cb: OnEndCb<UnwrappedPromiseType<F>, P extends () => infer PP ? PP : (P extends ComputedRef<unknown> ? UnwrapRef<P> : P)>) => unknown;
  promise: ComputedRef<null | Promise<T>>,
} => {
  type PP = P extends () => infer PPP ? PPP : (P extends ComputedRef<unknown> ? UnwrapRef<P> : P);

  const isPending = ref<undefined | boolean>();

  const data = ref<T>();

  const error: Ref<null | Error> = ref(null);

  const onErrorList: OnErrorCb<PP>[] = [];

  const onStartList: OnStartCb<PP>[] = [];

  const onEndList: OnEndCb<UnwrappedPromiseType<F>, PP>[] = [];

  // for legacy use case
  const d = ref<null | Promise<T>>(null);

  const wrapParams = computed(() => {
    if (typeof params === 'function') {
      return params();
    }
    return unref(params);
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

    if (isPending.value) {
      // @ts-ignore - the `abortXhr` can came from useXhr
      d.value?.abortXhr?.();
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

      onEndList.forEach((cb) => cb(res as UnwrappedPromiseType<F>, wrapParams.value));
    });

    d.value.finally(() => {
      isPending.value = false;
    });

    return d.value;
  };

  const reload = () => _reload(wrapParams.value);

  const onError = (cb: OnErrorCb<PP>) => {
    onErrorList.push(cb);
  };

  const onStart = (cb: OnStartCb<PP>) => {
    onStartList.push(cb);
  };

  const onEnd = (cb: OnEndCb<UnwrappedPromiseType<F>, PP>) => {
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
      // fix if there is no change. Just undefined as value
      if ((v === undefined && lastUnwrapParams.value === undefined)
          || (_enabled.value && vStr !== JSON.stringify(lastUnwrapParams.value))
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
