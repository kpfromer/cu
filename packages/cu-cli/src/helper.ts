import { Day } from './types';
import * as keytar from 'keytar';
import { v4 as uuidv4 } from 'uuid';
import Conf from 'conf';

/**
 * Rounds number to specific digit.
 * @param number the number to round.
 * @param place the digit to round to.
 */
export function toPlace(number: number, place = 2) {
  return Math.round(number * Math.pow(10, place)) / Math.pow(10, place);
}

/**
 * Converts to Google recurrence days string array.
 * @param courseDays the CU days string
 */
export function toDays(courseDays: string): Day[] {
  const days: Day[] = [];
  const chars = courseDays.toLowerCase().split('');
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (char === 'm') {
      days.push('MO');
    } else if (char === 't' && i + 1 < chars.length && chars[i + 1] === 'h') {
      days.push('TH');
      i++;
    } else if (char === 't') {
      days.push('TU');
    } else if (char === 'w') {
      days.push('WE');
    } else if (char === 'f') {
      days.push('FR');
    } else {
      throw new TypeError(`Invalid course days "${courseDays}"`);
    }
  }
  return days;
}

/**
 * Setups the secured config, using the system's keyring.
 */
export async function setupConfig(): Promise<Conf> {
  // create config for app
  const foundPassword = await keytar.findPassword('cu-api');
  let configPassword: string;
  if (!foundPassword) {
    configPassword = uuidv4();
    keytar.setPassword('cu-api', 'cu-api', configPassword);
  } else {
    configPassword = foundPassword;
  }

  return new Conf({ encryptionKey: configPassword });
}
