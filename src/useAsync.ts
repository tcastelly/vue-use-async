import {
  computed,
  ComputedRef,
  isRef,
  Ref,
  ref,
  watch,
} from 'vue';
import { Obj, UnwrappedPromiseType } from './index';
import Deferred from './Deferred';

type OnErrorCb = (e: undefined | null | Error, params: any) => any;

type OnStartCb = (params: any) => any;

type OnEndCb<T> = (res: T, params: any) => any;

function useAsync<T>(
  func: (...args: any[]) => Promise<T>,
  params: Ref<any> | any = {},
  enabled = ref(true),
): {
  onError: (cb: OnErrorCb) => any,
  onStart: (cb: OnStartCb) => any,
  onEnd: (cb: OnEndCb<UnwrappedPromiseType<typeof func>>) => any,
  isPending: Ref<boolean>,
  error: Ref<undefined | null | Error>,
  data: Ref<undefined | UnwrappedPromiseType<typeof func>>;
  reload: () => any,
  promise: ComputedRef<ReturnType<typeof func>>,
} {
  const isPending = ref();

  const data = ref<T>();

  const error = ref<null | Error>();

  const wrapParams: Ref<any> = isRef(params) ? params : ref(params);

  const onErrorList: Array<OnErrorCb> = [];

  const onStartList: Array<OnStartCb> = [];

  const onEndList: Array<OnEndCb<T>> = [];

  // for legacy use case (Vue xhr Plugin)
  const d = ref<Deferred<T>>(new Deferred());

  // generate new xhr/promise
  const _reload = (_params: Obj) => {
    useAsync.config.onStart();
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

      useAsync.config.onEnd(res);
      onEndList.forEach((cb) => cb(res, wrapParams.value));
    }, (_error) => {
      error.value = _error || null;

      useAsync.config.onError(_error);
      onErrorList.forEach((cb) => cb(error.value, wrapParams.value));

      d.value.reject(_error);
      error.value = _error;
    });

    p.finally(() => {
      isPending.value = false;
    });
  };

  watch(
    () => wrapParams.value,
    (v, oldV) => {
      if ((enabled.value && JSON.stringify(v) !== JSON.stringify(oldV))
        // fix if there is no change. Just undefined as value
        || (v === undefined && oldV === undefined)) {
        _reload(v);
      }
    }, {
      immediate: enabled.value,
      deep: true,
    },
  );

  // reload if the query has been enabled
  watch(
    () => enabled.value,
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

// static object in function, when Main.js will be migrated to composition API, will be replaced by inject
useAsync.config = {
  onError(e: Error) { // eslint-disable-line @typescript-eslint/no-unused-vars
  },
  onStart() {
  },
  onEnd(res: any) { // eslint-disable-line @typescript-eslint/no-unused-vars
  },
};

export default useAsync;
