import Xhr from '../src/Xhr';
import mockXhr from './mockXhr';

describe('Given Xhr and MockXhr', () => {
  it('THEN constructor should not be null', () => {
    expect(new Xhr()).not.toBe(null);
  });
  describe('WHEN send GET query', () => {
    let query;
    beforeAll(() => {
      mockXhr
        .get({ url: '/fake/get' })
        .resolve('get-ok');

      query = new Xhr().get({
        url: '/fake/get',
        params: {},
      });
    });

    it('THEN fake should be catch', () => expect(query).resolves.toEqual('get-ok'));
  });
  describe('WHEN send POST query', () => {
    let query;
    beforeAll(() => {
      mockXhr
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
  describe('WHEN send put query', () => {
    let query;
    beforeAll(() => {
      mockXhr
        .put({ url: '/fake/put' })
        .resolve('put-ok');

      query = new Xhr().put({ url: '/fake/put' });
    });

    it('THEN fake should be catch', () => expect(query).resolves.toEqual('put-ok'));
  });
  describe('WHEN send DELETE query', () => {
    let query;
    beforeAll(() => {
      mockXhr
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
    let query;
    beforeAll(() => {
      mockXhr
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
