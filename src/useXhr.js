// @flow

import {
  isRef,
  ref,
  onBeforeUnmount,
  watch,
  type Computed,
  type Ref,
} from '@vue/composition-api';
import Xhr, { type XhrConfig } from './Xhr';
import cache from './cache';
import useAsync from './useAsync';
import type { GetConfig } from './useXhr.js.flow';

// used as default `onError`
function _blank(e: Error) { // eslint-disable-line no-unused-vars
}

type GetReturn<T> = {|
  isPending: Computed<boolean>,
  data: Ref<T>,
  error: Ref<?Error>,
  abort: Function,
  promise: Promise<T>,
  onError: ((Error) => void) => void,
|}

export type GetXhr<T> = (GetConfig) => GetReturn<T>;

type UseXhr = {|
  onError?: (Error) => any,
  context?: any,
  legacy?: boolean,
  token?: Ref<?string> | Computed<?string> | ?string,
|};

const getTokenValue: ($ElementType<UseXhr, 'token'>) => ?string = (token) => {
  if (isRef(token) /*:: && token && typeof token === 'object' */) {
    return token.value;
  }

  const tokenStr: any = token;

  return (tokenStr: string);
};

export default function (args?: UseXhr) {
  const {
    onError,
    context,
    legacy,
  } = (args || {
    onError: (e) => e,
    context: null,
    legacy: false,
    token: null,
  });

  let xhr: Xhr<mixed> = new Xhr<mixed>();

  watch(
    () => {
      if (args) {
        return getTokenValue(args.token);
      }
      return null;
    },
    () => {
      xhr = new Xhr<mixed>();
      const token = args ? getTokenValue(args.token) : null;
      if (token) {
        xhr.token = token;
      }
    },
  );

  const xhrList = ref<Array<Xhr<mixed>>>([]);

  /**
   * For GET it's possible to add cache
   */
  function get<T>(parametersObj: GetConfig, params?: Object | Ref<Object>): GetReturn<T> {
    const isPending = ref<boolean>(true);

    const data = ref<T>();

    const error = ref<?Error>();

    const errorList = [];

    let url = '';
    let duration = 0;
    let _onError = (onError || _blank).bind(context);
    let getParams: GetConfig = {};

    if (typeof parametersObj === 'string' /*:: && typeof getParams === 'object' */) {
      url = parametersObj;
      getParams.url = url;
    } else if (parametersObj && typeof parametersObj === 'object') {
      ({ url, params } = parametersObj);
      duration = parametersObj.cacheDuration;
      _onError = (parametersObj.onError || _onError).bind(context);

      getParams = {
        ...getParams,
        ...parametersObj,
      };
    }

    if (args && args.token /*:: && typeof getParams === 'object' */) {
      getParams.token = getTokenValue(args.token);
    }

    // merge params
    if (params && typeof getParams === 'object' && getParams.params) {
      getParams.params = {
        ...getParams.params,
        ...(isRef(params) ? (params.value || {}) : params),
      };
    }

    // Preserve function extended in promise (abort)
    const xhrPromise = cache<T>({
      id: decodeURIComponent(Xhr.stringifyUrl(url, typeof getParams === 'object' ? getParams.params : {})),
      xhr: xhr.get.bind(xhr, getParams),
      duration,
    });

    // don t need to abort later, remove the xhr from the list
    const removeHttpXhrList = () => {
      const httpXhrIndex = xhrList.value.indexOf(xhr);
      if (httpXhrIndex > -1) {
        xhrList.value.splice(httpXhrIndex, 1);
      }
    };

    xhrPromise.then((_data) => {
      removeHttpXhrList();
      data.value = _data;
    }, (err) => {
      removeHttpXhrList();
      error.value = err;
      errorList.forEach((cb) => cb(error.value));
      _onError(err);
    });
    xhrPromise.finally(() => {
      isPending.value = false;
    });

    if (!legacy) {
      onBeforeUnmount(() => {
        xhrList.value.forEach((_xhr) => _xhr.abort());
      });
    }

    return {
      isPending,
      data,
      onError(cb: Function) {
        errorList.push(cb);
      },
      error,
      abort: xhrPromise.abortXhr,
      promise: xhrPromise,
    };
  }

  const post = <T>(xhrConfig?: XhrConfig, params?: Object | Ref<Object>) => useAsync<T>(xhr.post.bind(xhr, xhrConfig), params);

  const put = <T>(xhrConfig?: XhrConfig, params?: Object | Ref<Object>) => useAsync<T>(xhr.put.bind(xhr, xhrConfig), params);

  const _delete = <T>(xhrConfig?: XhrConfig, params?: Object | Ref<Object>) => useAsync<T>(xhr.delete.bind(xhr, xhrConfig), params);

  return {
    get,
    post,
    put,
    delete: _delete,
    abort: xhr.abort.bind(xhr),
    xhr,
  };
}
