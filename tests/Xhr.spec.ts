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

    it('THEN fake should be catch', () => expect(query).resolves.toEqual('get-ok'));
  });
  describe('WHEN send POST query', () => {
    let query: Promise<any>;
    beforeAll(() => {
      mockXhr()
        .post({ url: '/fake/post' })
        .resolve('post-ok');

      query = new Xhr().post({
        url: '/fake/post',
        params: {
          user: 'thomas',
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

      query = new Xhr().get({ url: '/fake/abort', params: { user: 'Thomas' } });
      query.abortXhr();
    });

    it('THEN fake should be catch', () => expect(query).rejects.toHaveProperty('error'));
  });
});
