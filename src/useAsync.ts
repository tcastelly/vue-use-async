import {
  computed,
  ComputedRef,
  isRef,
  Ref,
  ref,
  watch,
} from '@vue/composition-api';
import { Obj } from '@/types';
import Deferred from './Deferred';

function useAsync<T>(
  func: (...any) => Promise<T>,
  params: Ref<any> | any = {},
  condition: (_params: Ref<any> | any) => boolean = () => true,
): {
  isPending: Ref<boolean>,
  error: Ref<Error | null>,
  data: Ref<T>,
  reload: (any) => void,
  onError: (cb: (e: Error) => void) => void,
  promise: ComputedRef<Promise<T>>,
} {
  const isPending = ref();

  const data = ref<T>();

  const error = ref<Error | null>();

  let isThrowDisabled = false;
  watch(
    () => error.value,
    (e) => {
      if (e && !isThrowDisabled) {
        // throw error break success of watch
        // force to disable it, else infinite loop
        isThrowDisabled = true;
        throw e;
      }
    }, {
      immediate: true,
    },
  );

  const wrapParams: Ref<any> = isRef(params) ? params : ref(params);

  const errorList = [];

  // for legacy use case (Vue xhr Plugin)
  const d = ref<Deferred<T>>(new Deferred());

  const _reload = (_params: Obj) => {
    if (condition(_params)) {
      d.value = new Deferred();

      isPending.value = true;
      error.value = null;
      isThrowDisabled = false;

      // it's possible to pass multiple args by using an array as params
      const p = Array.isArray(_params)
        ? func.call(null, ..._params)
        : func(_params);

      p.then((res) => {
        data.value = res;
        d.value.resolve(res);
      }, (_error) => {
        error.value = _error || null;
        errorList.forEach((cb) => cb(error.value));
        useAsync.config.onError(_error);
        d.value.reject(_error);
        error.value = _error;
      });

      p.finally(() => {
        isPending.value = false;
      });
    }
  };

  const onError = (cb) => {
    errorList.push(cb);
  };

  watch(
    () => wrapParams.value,
    _reload, {
      immediate: true,
      deep: true,
    },
  );

  return {
    isPending,
    data,
    error,
    reload: () => _reload(wrapParams.value),
    onError,
    promise: computed(() => d.value.promise),
  };
}

useAsync.config = {
  onError(e: Error) { // eslint-disable-line @typescript-eslint/no-unused-vars
  },
};

export default useAsync;
