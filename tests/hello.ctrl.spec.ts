import { helloCtrl } from '../src/cloud/hello.ctrl';

describe('helloCtrl', () => {
  test('returns hello message', async () => {
    const response = await helloCtrl();
    expect(response.message).toBe('Hello World!');
  });
});
