import {
  computed, ComputedRef, Ref, ref, unref, watch,
} from 'vue';
import type { Obj, UnwrappedPromiseType } from './index';
import Deferred from './Deferred';

type OnErrorCb = (e: null | Error, params: any) => any;

type OnStartCb = (params: any) => any;

type OnEndCb<T> = (res: T, params: any) => any;

export default function useAsync<T>(
  func: (...args: any[]) => Promise<T>,
  params: Ref<any> | (() => any) | any = {},
  enabled: Ref<boolean> | (() => boolean) = ref(true),
): {
  onError: (cb: OnErrorCb) => any,
  onStart: (cb: OnStartCb) => any,
  onEnd: (cb: OnEndCb<UnwrappedPromiseType<typeof func>>) => any,
  isPending: Ref<boolean>,
  error: Ref<null | Error>,
  data: Ref<UnwrappedPromiseType<typeof func>>;
  reload: () => any,
  promise: ComputedRef<ReturnType<typeof func>>,
} {
  const isPending = ref();

  const data = ref<T>() as Ref<T>;

  const error = ref<null | Error>(null);

  const onErrorList: Array<OnErrorCb> = [];

  const onStartList: Array<OnStartCb> = [];

  const onEndList: Array<OnEndCb<T>> = [];

  // for legacy use case
  const d = ref<Deferred<T>>(new Deferred());

  const wrapParams = computed(() => {
    if (typeof params === 'function') {
      return params();
    }
    return unref(params);
  });

  const _enabled = computed(() => {
    if (typeof enabled === 'function') {
      return enabled();
    }
    return unref(enabled);
  });

  // generate new xhr/promise
  const _reload = (_params: Obj) => {
    onStartList.forEach((cb) => cb(wrapParams.value));

    d.value = new Deferred();

    isPending.value = true;
    error.value = null;

    // it's possible to pass multiple args by using an array as params
    const p = Array.isArray(_params)
      ? func.call(null, ..._params)
      : func(_params);

    p.then((res) => {
      data.value = res;
      d.value.resolve(res);

      onEndList.forEach((cb) => cb(res, wrapParams.value));
    }, (_error) => {
      error.value = _error || null;

      onErrorList.forEach((cb) => cb(error.value, wrapParams.value));

      d.value.reject(_error);
      error.value = _error;
    });

    p.finally(() => {
      isPending.value = false;
    });
  };

  // reload if the query has been enabled
  watch(
    () => _enabled.value,
    (v) => {
      // we don't want to execute twice if params changed AND exec changed
      if (!isPending.value && v) {
        _reload(wrapParams.value);
      }
    }, {
      // avoid simultaneously query
      immediate: false,
    },
  );

  watch(
    () => wrapParams.value,
    (v, oldV) => {
      if (
        ((_enabled.value && JSON.stringify(v) !== JSON.stringify(oldV))
        // fix if there is no change. Just undefined as value
        || (v === undefined && oldV === undefined))
      ) {
        _reload(v);
      }
    }, {
      immediate: _enabled.value,
      deep: true,
    },
  );

  return {
    isPending,
    data,
    error,
    reload: () => _reload(wrapParams.value),
    onError: (cb) => onErrorList.push(cb),
    onStart: (cb) => onStartList.push(cb),
    onEnd: (cb) => onEndList.push(cb),
    promise: computed(() => d.value.promise),
  };
}
