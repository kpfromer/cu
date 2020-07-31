import Conf from 'conf';

export type Day = 'MO' | 'TU' | 'WE' | 'TH' | 'FR';

export interface FilledCredentials {
  refresh_token: string;
  expiry_date: number;
  access_token: string;
  token_type: string;
  id_token: string;
}

export type Config = Conf<{
  username: string;
  password: string;
  google: FilledCredentials;
}>;
