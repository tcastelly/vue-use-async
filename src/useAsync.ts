import {
  computed, ComputedRef, isRef, Ref, ref, watch,
} from '@vue/composition-api';
import { Func, Obj } from './index';
import Deferred from './Deferred';

function useAsync<T>(
  func: (...any) => Promise<T>,
  params: Ref<any> | any = {},
  enabled = ref(true),
): {
  onError: (cb: (e: Error) => any) => void,
  onStart: (cb: Func) => any,
  onEnd: (cb: (res: any) => void) => any,
  isPending: Ref<boolean>,
  error: Ref<Error | null>,
  data: Ref<T>,
  reload: (any) => void,
  promise: ComputedRef<Promise<T>>,
} {
  const isPending = ref();

  const data = ref<T>();

  const error = ref<Error | null>();

  const wrapParams: Ref<any> = isRef(params) ? params : ref(params);

  const onErrorList = [];

  const onStartList = [];

  const onEndList = [];

  // for legacy use case (Vue xhr Plugin)
  const d = ref<Deferred<T>>(new Deferred());

  // generate new xhr/promise
  const _reload = (_params: Obj) => {
    useAsync.config.onStart();
    onStartList.forEach((cb) => cb(error.value));

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
      onEndList.forEach((cb) => cb(res));
    }, (_error) => {
      error.value = _error || null;

      useAsync.config.onError(_error);
      onErrorList.forEach((cb) => cb(error.value));

      d.value.reject(_error);
      error.value = _error;
    });

    p.finally(() => {
      isPending.value = false;
    });
  };

  watch(
    () => wrapParams.value,
    (v) => {
      if (enabled.value) {
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
