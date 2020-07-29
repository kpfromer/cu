import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import * as inquirer from 'inquirer';

// If modifying these scopes, clean the config.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const googleAuth = {
  client_id:
    '867864663032-q5bujv25mljvupbet2rr4jrp7aharaps.apps.googleusercontent.com',
  client_secret: '9IXaOsKa3lQQ7YHMNdQ-x3Yl',
  redirect_uris: ['urn:ietf:wg:oauth:2.0:oob', 'http://localhost']
};

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param  credentials The authorization client credentials.
 */
export async function authorize(
  credentials: Credentials
): Promise<OAuth2Client> {
  const { client_secret, client_id, redirect_uris } = googleAuth;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  oAuth2Client.setCredentials(credentials);
  return oAuth2Client;
}

/**
 * Gets oAuth2 details needed to access the Google Calendar API.
 */
export async function login(): Promise<Credentials> {
  const { client_secret, client_id, redirect_uris } = googleAuth;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  return await getAccessToken(oAuth2Client);
}

/**
 * Get and store new token after prompting for user authorization, and then execute the given callback with the authorized OAuth2 client.
 */
async function getAccessToken(
  oAuth2Client: OAuth2Client
): Promise<Credentials> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const { code } = await inquirer.prompt([
    { type: 'input', name: 'code', message: 'Enter the code from that page:' }
  ]);
  const token = await oAuth2Client.getToken(code);
  return token.tokens;
}

// /**
//  * Lists the next 10 events on the user's primary calendar.
//  * @param auth An authorized OAuth2 client.
//  */
// export async function listEvents(calendar: calendar_v3.Calendar) {
//   const res = await calendar.events.list({
//     calendarId: 'primary',
//     timeMin: new Date().toISOString(),
//     maxResults: 10,
//     singleEvents: true,
//     orderBy: 'startTime'
//   });
//   if (res?.data?.items) {
//     const events = res.data.items;
//     if (events.length) {
//       console.log('Upcoming 10 events:');
//       events.map((event, i) => {
//         if (event?.start?.dateTime || event?.start?.date) {
//           const start = event.start.dateTime || event.start.date;
//           console.log(`${start} - ${event.summary}`);
//         }
//       });
//     } else {
//       console.log('No upcoming events found.');
//     }
//   }
// }
