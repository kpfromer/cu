jest.mock('googleapis');
jest.mock('google-auth-library');
import * as googleApi from 'googleapis';
import * as googleAuth from 'google-auth-library';

import { authorize } from '../calendar';

describe('calendar', () => {
  describe('authorize', () => {
    it('returns authorized oAuth2 google client', async () => {
      expect.assertions(3);
      const mockCredentials = jest.fn();

      const client = await authorize(mockCredentials as any);

      // not checking for details (should I?)
      expect(googleApi.google.auth.OAuth2).toHaveBeenCalled();

      expect(client).toBeInstanceOf(googleApi.google.auth.OAuth2);
      expect(client.setCredentials).toHaveBeenCalledWith(mockCredentials);
    });
  });
  describe('login', () => {
    it.todo('requests for google token and returns the credentials');
  });
});
