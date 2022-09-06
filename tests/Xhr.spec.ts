/**
 * @jest-environment jsdom
 */
import Xhr from '@/Xhr';
import type { XhrGet } from '@/index';
import mockXhr from './mockXhr';

describe('Given Xhr and MockXhr', () => {
  it('THEN constructor should not be null', () => {
    expect(Xhr.new()).not.toBe(null);
  });

  describe('WHEN send GET query', () => {
    let query: Promise<any>;
    afterAll(() => {
      Xhr.onBeforeSendList = [];
    });

    beforeAll(() => {
      Xhr.onBeforeSend((o) => ({
        ...o,
        attr: 'ok',
      }));

      Xhr.onBeforeSend((o) => ({
        ...o,
        attr2: 'ok',
      }));

      mockXhr()
        .get({ url: '/fake/get?attr=%22ok%22&attr2=%22ok%22' })
        .resolve('get-ok');

      query = new Xhr().get({
        url: '/fake/get',
        params: {},
      });
    });

    it('THEN fake should be catch', () => {
      expect(query).resolves.toEqual('get-ok');
    });
  });

  describe('WHEN send POST query', () => {
    let query: Promise<any>;
    const params = { user: 'thomas ' };
    beforeAll(() => {
      mockXhr()
        .post({ url: '/fake/post?entId=4', params })
        .resolve('post-ok');

      query = new Xhr().post({
        url: '/fake/post?entId=3',
        params: {
          ...params,
          entId: 4, // override `entId` query param
        },
      });
    });

    it('THEN fake should be catch', () => expect(query).resolves.toEqual('post-ok'));
  });

  describe('WHEN send POST query with array as parameter', () => {
    let query: Promise<any>;
    beforeAll(() => {
      mockXhr()
        .post({ url: '/fake/post' })
        .resolve('post-users-ok');

      query = new Xhr().post({
        url: '/fake/post',
        params: ['thomas'],
      });
    });

    it('THEN fake should be catch', () => expect(query).resolves.toEqual('post-users-ok'));
  });

  describe('WHEN send put query', () => {
    let query: Promise<any>;
    beforeAll(() => {
      mockXhr()
        .put({ url: '/fake/put' })
        .resolve('put-ok');

      query = new Xhr().put({ url: '/fake/put' });
    });

    it('THEN fake should be catch', () => expect(query).resolves.toEqual('put-ok'));
  });

  describe('WHEN send DELETE query', () => {
    let query: Promise<any>;
    beforeAll(() => {
      mockXhr()
        .delete({ url: '/fake/delete' })
        .resolve('delete-ok');

      query = new Xhr().delete({
        url: '/fake/delete',
        params: {},
      });
    });

    it('THEN fake should be catch', () => expect(query).resolves.toEqual('delete-ok'));
  });

  describe('WHEN send DELETE query with query params', () => {
    let query: Promise<any>;
    beforeAll(() => {
      mockXhr()
        .delete({ url: '/fake/delete?%5B1%2C2%2C3%5D' })
        .resolve('delete-ok');

      query = new Xhr().delete({
        url: '/fake/delete',
        params: [1, 2, 3],
      });
    });

    it('THEN fake should be catch', () => expect(query).resolves.toEqual('delete-ok'));
  });

  describe('WHEN send DELETE query with query params injected as path params', () => {
    let query: Promise<any>;
    beforeAll(() => {
      mockXhr()
        .delete({ url: '/fake/delete/toto/%5B1%2C2%2C3%5D' })
        .resolve('delete-ok');

      query = new Xhr().delete({
        url: '/fake/delete/:str/:pnumIds',
        params: {
          pnumIds: [1, 2, 3],
          str: 'toto',
        },
      });
    });

    it('THEN fake should be catch', () => expect(query).resolves.toEqual('delete-ok'));
  });

  describe('WHEN send ABORT query', () => {
    let query: XhrGet<any>;
    beforeAll(() => {
      mockXhr()
        .get({
          url: '/fake/abort',
          params: {
            user: 'Thomas',
          },
        })
        .abort();
    });

    it('THEN fake should be catch', () => {
      const fetch = () => {
        query = new Xhr().get({ url: '/fake/abort', params: { user: 'Thomas' } });
        query.abortXhr();
        return query;
      };
      expect(fetch).rejects.toThrow();
    });
  });

  describe('WHEN stringify URL', () => {
    const url = '/api-js/shipping/browses/loc/L/10?entId=3';
    let res: string;

    beforeAll(() => {
      res = Xhr.stringifyUrl(url, {
        pstrAiSts: 'A',
      });
    });

    it('THEN the url should be stringified', () => {
      expect(res).toBe('/api-js/shipping/browses/loc/L/10?entId=3&pstrAiSts=%22A%22');
    });
  });

  describe('WHEN stringify URL with existing query params', () => {
    const url = '/api-js/shipping/browses/loc/L/10?entId=3&pstrAiSts="I"&useIt=true&nullAttr=false';
    let res: string;

    beforeAll(() => {
      res = Xhr.stringifyUrl(url, {
        pstrAiSts: 'A',
        nullAttr: null,
      });
    });

    it('THEN the url should be stringified', () => {
      expect(res).toBe('/api-js/shipping/browses/loc/L/10?entId=3&pstrAiSts=%22A%22&useIt=true&nullAttr=null');
    });
  });

  describe('WHEN stringify URL with array as param', () => {
    const url = '/api-js';
    let res: string;

    beforeAll(() => {
      res = Xhr.stringifyUrl(url, [1, 2, 3]);
    });

    it('THEN the array should be serialized', () => {
      expect(res).toBe('/api-js?%5B1%2C2%2C3%5D');
    });
  });
});
