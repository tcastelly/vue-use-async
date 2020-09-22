import {
  isRef,
  ref,
  onBeforeUnmount,
  watch,
  computed,
  ComputedRef,
  Ref,
} from '@vue/composition-api';
import {
  CacheDuration,
  GetConfig,
  GetReturn, XhrConfig, XhrGet,
} from '@/types';
import Xhr from './Xhr';
import cache, { clearCache } from './cache';
import useAsync from './useAsync';

// used as default `onError`
function _blank(e: Error) { // eslint-disable-line @typescript-eslint/no-unused-vars
}

type Token = Ref<string | null> | ComputedRef<string | null> | string | null

type UseXhr = {
  onError?: (Error) => any,
  context?: any,
  legacy?: boolean,
  token?: Token,
};

const getTokenValue: (token: Token) => string | null = (token) => {
  if (isRef(token)) {
    return token.value;
  }

  const tokenStr: any = token;

  return tokenStr;
};

export default function <T = any> (args?: UseXhr) {
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

  const error = ref<Error | Object | null>();

  let xhr: Xhr<T> = new Xhr<T>();

  let isThrowDisabled = false;

  const xhrList = ref<Array<Xhr<T>>>([]);

  /**
   * For GET it's possible to add cache
   */
  function get(parametersObj: GetConfig, params?: Object | Ref<Object>): GetReturn<T> {
    const isPending = ref<boolean>();

    const data = ref<T>();

    const errorList = [];

    let url = '';
    let duration: CacheDuration = 0;
    let _onError = (e) => (onError || _blank).bind(context, e);

    const retrieveGetParams = () => {
      let getParams: GetConfig = {};

      if (typeof parametersObj === 'string' /*:: && typeof getParams === 'object' */) {
        url = parametersObj;
        getParams.url = url;
      } else if (parametersObj && typeof parametersObj === 'object') {
        ({ url } = parametersObj);

        // use params from second args of get function
        if (!params) {
          params = parametersObj.params || {};
        }

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

      return getParams;
    };

    let lastCacheId;

    const xhrPromise = ref<XhrGet<T>>();

    const reload = () => {
      if (isPending.value) {
        xhr.abort();
      }

      isPending.value = true;
      error.value = null;
      isThrowDisabled = false;

      const getParams = retrieveGetParams();
      if (lastCacheId) {
        clearCache(lastCacheId);
      }
      lastCacheId = decodeURIComponent(Xhr.stringifyUrl(url, typeof getParams === 'object' ? getParams.params : {}));

      // Preserve function extended in promise (abort)
      xhrPromise.value = cache<T>({
        id: lastCacheId,
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

      xhrPromise.value.then((_data) => {
        removeHttpXhrList();
        data.value = _data;
      }, (err) => {
        removeHttpXhrList();
        errorList.forEach((cb) => cb(error.value));
        _onError(err);
        error.value = err;
      });
      xhrPromise.value.finally(() => {
        isPending.value = false;
      });
    };

    reload();

    return {
      isPending: computed(() => isPending.value),
      data,
      onError(cb: Function) {
        errorList.push(cb);
      },
      error,
      abort() {
        return xhrPromise.value.abortXhr();
      },
      promise: computed(() => xhrPromise.value),
      reload,
    };
  }

  const post = (xhrConfig?: XhrConfig, params?: Object | Ref<Object>) => useAsync<T>(xhr.post.bind(xhr, xhrConfig), params);

  const put = (xhrConfig?: XhrConfig, params?: Object | Ref<Object>) => useAsync<T>(xhr.put.bind(xhr, xhrConfig), params);

  const _delete = (xhrConfig?: XhrConfig, params?: Object | Ref<Object>) => useAsync<T>(xhr.delete.bind(xhr, xhrConfig), params);

  if (!legacy) {
    onBeforeUnmount(() => {
      xhrList.value.forEach((_xhr) => _xhr.abort());
    });

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
  }

  watch(
    () => {
      if (args) {
        return getTokenValue(args.token);
      }
      return null;
    },
    () => {
      xhr = new Xhr<any>();
      const token = args ? getTokenValue(args.token) : null;
      if (token) {
        xhr.token = token;
      }
    }, {
      immediate: true,
    },
  );

  return {
    get,
    post,
    put,
    delete: _delete,
    abort: xhr.abort.bind(xhr),
    xhr,
  };
}
