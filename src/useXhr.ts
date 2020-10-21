import {
  computed,
  ComputedRef,
  isRef,
  onBeforeUnmount,
  ref,
  Ref,
  watch,
} from '@vue/composition-api';
import {
  CacheDuration,
  GetConfig,
  GetReturn,
  Obj,
  XhrConfig,
  XhrGet,
} from './index';
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

  const error = ref<Error | Obj | null>();

  let xhr: Xhr<any> = new Xhr<any>();

  let isThrowDisabled = false;

  const xhrList = ref<Array<Xhr<any>>>([]);

  /**
   * For GET it's possible to add cache
   */
  function get<T>(parametersObj: GetConfig, params?: Obj | Ref<Obj>): GetReturn<T> {
    const isPending = ref<boolean>();

    const data = ref<T>();

    const errorList = [];

    let url = '';
    let duration: CacheDuration = 0;
    let _onError = (e) => (onError || _blank).bind(context, e);

    const getParams = computed(() => {
      let _getParams: GetConfig = {};

      if (typeof parametersObj === 'string') {
        url = parametersObj;
        _getParams.url = url;
        _getParams.params = {};
      } else if (parametersObj && typeof parametersObj === 'object') {
        ({ url } = parametersObj);

        // use params from second args of get function
        if (!params) {
          params = parametersObj.params || {};
        }

        duration = parametersObj.cacheDuration;
        _onError = (parametersObj.onError || _onError).bind(context);

        _getParams = {
          ..._getParams,
          ...parametersObj,
        };
      }

      if (args && args.token) {
        _getParams.token = getTokenValue(args.token);
      }

      // merge params
      if (params && typeof _getParams === 'object' && _getParams.params) {
        _getParams.params = {
          ...(isRef(_getParams.params) ? _getParams.params.value : _getParams.params),
          ...(isRef(params) ? (params.value || {}) : params),
        };
      }

      return _getParams;
    });

    let lastCacheId;

    const xhrPromise = ref<XhrGet<T>>();

    const reload = () => {
      if (isPending.value) {
        xhr.abort();
      }

      isPending.value = true;
      error.value = null;
      isThrowDisabled = false;

      if (lastCacheId) {
        clearCache(lastCacheId);
      }

      lastCacheId = decodeURIComponent(Xhr.stringifyUrl(
        url,
        typeof getParams.value.params === 'object' ? getParams.value.params : {},
      ));

      // Preserve function extended in promise (abort)
      xhrPromise.value = cache<T>({
        id: lastCacheId,
        xhr: xhr.get.bind(xhr, getParams.value),
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

    watch(
      () => getParams.value,
      reload, {
        immediate: true,
      },
    );

    return {
      isPending: computed(() => isPending.value),
      data,
      onError(cb) {
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

  const post = <T = any>(xhrConfig?: XhrConfig, params?: Obj | Ref<Obj>) => useAsync<T>(xhr.post.bind(xhr, xhrConfig), params);

  const put = <T = any>(xhrConfig?: XhrConfig, params?: Obj | Ref<Obj>) => useAsync<T>(xhr.put.bind(xhr, xhrConfig), params);

  const _delete = <T = any>(xhrConfig?: XhrConfig, params?: Obj | Ref<Obj>) => useAsync<T>(xhr.delete.bind(xhr, xhrConfig), params);

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
