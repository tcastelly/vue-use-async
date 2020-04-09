// @flow

import {
  ref,
  isRef,
  watch,
  type Ref,
} from '@vue/composition-api';
import Deferred from './Deferred';

function useAsync<T>(
  func: (...any) => Promise<T>,
  params: Ref<any> | any = {},
  condition: (Ref<any> | any) => boolean = () => true,
): {|
  isPending: Ref<boolean>,
  error: Ref<?Error>,
  data: Ref<T>,
  reload: (any) => void,
  onError: ((Error) => void) => void,
  promise: Promise<T>,
|} {
  const isPending = ref(true);

  const data = ref<T>();

  const error = ref<?Error>();

  const wrapParams: Ref<any> = isRef(params) ? params : ref(params);

  const errorList = [];

  // for legacy use case (Vue xhr Plugin)
  const d = new Deferred();

  const _reload = (_params: mixed) => {
    if (condition(_params)) {
      // it's possible to pass mulitple args by using an array as params
      const p = Array.isArray(_params)
        ? func.call(null, ..._params)
        : func(_params);

      p.then((res) => {
        data.value = res;
        d.resolve(res);
      }, (_error) => {
        error.value = _error || null;
        errorList.forEach((cb) => cb(error.value));
        useAsync.config.onError(_error);
        d.reject(_error);
      });

      p.finally(() => {
        isPending.value = false;
      });
    }
  };

  const onError = (cb: Function) => {
    errorList.push(cb);
  };

  watch(
    () => wrapParams.value,
    _reload,
  );

  return {
    isPending,
    data,
    error,
    reload: () => _reload(wrapParams.value),
    onError,
    promise: d.promise,
  };
}

useAsync.config = {
  onError(e: Error) { // eslint-disable-line no-unused-vars
  },
};

export default useAsync;
