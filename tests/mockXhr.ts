import Logger from '../src/_base/Logger';
import Deferred from '../src/Deferred';
import Xhr from '../src/Xhr';

type Condition = Partial<{
  method: string;
  url: string;
  params: { [id: string]: any };
  getAttribute: (arg0: string) => any;
}>;

const {
  send,
  abort,
  open,
  setRequestHeader,
} = XMLHttpRequest.prototype;

class MockXhr {
  header: Array<any>;

  xhr: null | XMLHttpRequest;

  method: null | string;

  pending: Deferred<any>;

  constructor() {
    this.header = [];
    this.xhr = null;
    this.method = null;
    this.pending = new Deferred();
  }

  get(condition: Condition) {
    condition.method = 'GET';
    return this._mockXMLHttpRequest(condition);
  }

  post(condition: Condition) {
    condition.method = 'POST';
    return this._mockXMLHttpRequest(condition);
  }

  delete(condition: Condition) {
    condition.method = 'DELETE';
    return this._mockXMLHttpRequest(condition);
  }

  put(condition: Condition) {
    condition.method = 'PUT';
    return this._mockXMLHttpRequest(condition);
  }

  sendForm(form: Condition) {
    const condition: Condition = {
      method: form?.getAttribute?.('method'),
      url: form?.getAttribute?.('action'),
    };

    return this._mockXMLHttpRequest(condition);
  }

  abort(fakeResult: any) {
    XMLHttpRequest.prototype.abort = () => {
      Logger.info('[Log] Fake xhr abort');

      this.pending.promise.catch((xhr) => xhr.resolve(fakeResult)).then(MockXhr.restore);
    };
  }

  resolve(fakeResult: any, delay = 0) {
    this.pending.promise.then((xhr) => {
      setTimeout(() => {
        xhr.resolve(fakeResult);
      }, delay);
    });
  }

  reject(fakeResult: any, delay = 0) {
    this.pending.promise.then((xhr) => {
      setTimeout(() => {
        xhr.reject(fakeResult);
      }, delay);
    });
  }

  static restore() {
    XMLHttpRequest.prototype.abort = abort;
    XMLHttpRequest.prototype.send = send;
    XMLHttpRequest.prototype.open = open;
    XMLHttpRequest.prototype.setRequestHeader = setRequestHeader;
  }

  _mockXMLHttpRequest(this: MockXhr, condition: Condition) {
    XMLHttpRequest.prototype.open = (method, url) => {
      Logger.info('[Log] Fake xhr open');
      if (Xhr.stringifyUrl(condition.url || '', condition.params) === url && condition.method === method) {
        this.method = method;
      } else {
        // @ts-ignore
        // eslint-disable-next-line prefer-rest-params
        open.apply(this, arguments);
      }
    };

    // @ts-ignore - implement fake send
    XMLHttpRequest.prototype.send = (params: any, xhr: XMLHttpRequest | null) => {
      Logger.info('[Log] Fake xhr sent');
      if (Xhr.stringifyUrl(condition.url || '', condition.params) && this.method === condition.method) {
        this.xhr = xhr;
        this.pending.resolve(xhr);
      } else {
        // @ts-ignore
        // eslint-disable-next-line prefer-rest-params
        send.apply(this, arguments);
      }
    };

    XMLHttpRequest.prototype.setRequestHeader = (type, value) => {
      this.header.push([type, value]);
    };

    return {
      context: this,
      abort: this.abort.bind(this, condition),
      resolve: this.resolve.bind(this),
      reject: this.reject.bind(this),
    };
  }
}

export default {
  get(condition: Condition) {
    return new MockXhr().get(condition);
  },
  post(condition: Condition) {
    return new MockXhr().post(condition);
  },
  delete(condition: Condition) {
    return new MockXhr().delete(condition);
  },
  put(condition: Condition) {
    return new MockXhr().put(condition);
  },
  sendForm(condition: Condition) {
    return new MockXhr().sendForm(condition);
  },
  restore() {
    MockXhr.restore();
  },
};
