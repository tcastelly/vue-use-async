import Logger from '../src/_base/Logger';
import Deferred from '../src/Deferred';
import Xhr from '../src/Xhr';

const {
  send, abort, open, setRequestHeader,
} = XMLHttpRequest.prototype;

class MockXhr {
  constructor() {
    this.header = [];
    this.xhr = null;
    this.method = null;
    this.pending = new Deferred();
  }

  get(condition) {
    condition.method = 'GET';
    return this._mockXMLHttpRequest(condition);
  }

  post(condition) {
    condition.method = 'POST';
    return this._mockXMLHttpRequest(condition);
  }

  delete(condition) {
    condition.method = 'DELETE';
    return this._mockXMLHttpRequest(condition);
  }

  put(condition) {
    condition.method = 'PUT';
    return this._mockXMLHttpRequest(condition);
  }

  sendForm(form) {
    const condition = {
      method: form.getAttribute('method'),
      url: form.getAttribute('action'),
    };

    return this._mockXMLHttpRequest(condition);
  }

  abort(fakeResult) {
    XMLHttpRequest.prototype.abort = () => {
      Logger.info('[Log] Fake xhr abort');

      this.pending.promise.catch((xhr) => xhr.resolve(fakeResult)).then(MockXhr.restore);
    };
  }

  resolve(fakeResult, delay = 0) {
    this.pending.promise.then((xhr) => {
      setTimeout(() => {
        xhr.resolve(fakeResult);
      }, delay);
    });
  }

  reject(fakeResult, delay = 0) {
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

  _mockXMLHttpRequest(condition) {
    XMLHttpRequest.prototype.open = (method, url) => {
      Logger.info('[Log] Fake xhr open');
      if (Xhr.stringifyUrl(condition.url, condition.params) === url && condition.method === method) {
        this.method = method;
      } else {
        /* eslint-disable-next-line prefer-rest-params */
        open.apply(this, arguments);
      }
    };

    XMLHttpRequest.prototype.send = (params, xhr) => {
      Logger.info('[Log] Fake xhr sent');
      if (Xhr.stringifyUrl(condition.url, condition.params) && this.method === condition.method) {
        this.xhr = xhr;
        this.pending.resolve(xhr);
      } else {
        /* eslint-disable-next-line prefer-rest-params */
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
  get(condition) {
    return new MockXhr().get(condition);
  },
  post(condition) {
    return new MockXhr().post(condition);
  },
  delete(condition) {
    return new MockXhr().delete(condition);
  },
  put(condition) {
    return new MockXhr().put(condition);
  },
  sendForm(condition) {
    return new MockXhr().sendForm(condition);
  },
  restore() {
    MockXhr.restore();
  },
};
