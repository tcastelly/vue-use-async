import type { ComputedRef, Ref } from 'vue';
import {
  computed,
  ref,
  unref,
  watch,
} from 'vue';
import { Result } from '@/useResult';
import uuid from '@/_base/uuid';
import type { RequiredParams, TypeAllowed, UnwrappedPromiseType } from '.';

type OnErrorCb<T> = (e: null | Error, params: T) => unknown;

type OnStartCb<T> = (params: T) => unknown;

type OnEndCb<T, Z> = (res: T, params: Z) => unknown;

type AsyncFunc = (...args: any[]) => Promise<unknown>;

type Enabled = Ref<boolean> | (() => boolean);

type AsyncParams<F extends AsyncFunc> = Parameters<F> extends TypeAllowed[]
  ? RequiredParams<Parameters<F>[0], Parameters<F>>
  : never;

// - no parameter: `params` is forbidden, `enabled` can be passed directly or after `undefined`
// - only optional parameters: `params` is optional
// - otherwise `params` is required
type AsyncArgs<F extends AsyncFunc, P> = Parameters<F> extends []
  ? [enabled?: Enabled] | [params: undefined, enabled?: Enabled]
  : [] extends Parameters<F>
    ? [params?: P, enabled?: Enabled]
    : [params: P, enabled?: Enabled];

// `useAsync(func, enabled)`: without expected parameter, a single arg resolving to a boolean is `enabled`
const isEnabledArg = (func: AsyncFunc, rest: unknown[]): rest is [Enabled] => {
  if (rest.length !== 1 || func.length !== 0) {
    return false;
  }
  const [arg] = rest;
  return typeof (typeof arg === 'function' ? arg() : unref(arg)) === 'boolean';
};

type UnwrapParams<P> = P extends () => infer PP
  ? PP
  : (P extends Ref<infer PP> ? PP : P);

const useAsync = <
  F extends AsyncFunc,
  P extends AsyncParams<F> = AsyncParams<F>,
>(
  func: F,
  ...rest: AsyncArgs<F, P>
): {
  isPending: Ref<undefined | boolean>;
  data: ComputedRef<undefined | null | UnwrappedPromiseType<F>>;
  error: Ref<null | Error>;
  reload: () => null | Promise<UnwrappedPromiseType<F>>;
  onError: (cb: OnErrorCb<UnwrapParams<P>>) => void;
  onStart: (cb: OnStartCb<UnwrapParams<P>>) => void;
  onEnd: (cb: OnEndCb<UnwrappedPromiseType<F>, UnwrapParams<P>>) => unknown;
  promise: ComputedRef<null | Promise<UnwrappedPromiseType<F>>>;
} => {
  const [params, enabled = () => true]: [unknown?, Enabled?] = isEnabledArg(func, rest)
    ? [undefined, rest[0]]
    : rest;

  type T = UnwrappedPromiseType<F>;

  type _PP = UnwrapParams<P>;

  const isPending = ref<undefined | boolean>();

  const data = ref<T>();

  const error: Ref<null | Error> = ref(null);

  const onErrorList: OnErrorCb<_PP>[] = [];

  const onStartList: OnStartCb<_PP>[] = [];

  const onEndList: OnEndCb<T, _PP>[] = [];

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
  const _reload = (_params: unknown) => {
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

    const _func = func as (...args: unknown[]) => Promise<T>;

    // it's possible to pass multiple args by using an array as params
    d.value = Array.isArray(_params)
      ? _func(..._params)
      : _func(_params);

    d.value.catch((_error) => {
      error.value = _error || null;
      onErrorList.forEach((cb) => cb(error.value, wrapParams.value));
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

  const onError = (cb: OnErrorCb<_PP>) => {
    onErrorList.push(cb);
  };

  const onStart = (cb: OnStartCb<_PP>) => {
    onStartList.push(cb);
  };

  const onEnd = (cb: OnEndCb<T, _PP>) => {
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
      if (!isPending.value
        && (
          (v === undefined && lastUnwrapParams.value === undefined)
          || (_enabled.value && vStr !== JSON.stringify(lastUnwrapParams.value)
          )
        )) {
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
