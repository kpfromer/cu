import { CUSession, ICourse, ITerm } from 'cu-api';
import * as Conf from 'conf';
import moment from 'moment';
import { authorize } from './calendar';
import { google } from 'googleapis';
import { toDays } from './helper';
// for tests to spy on getCourses
import * as helper from './cli';

function getLogin(config: Conf): { username: string; password: string } {
  if (!config.has('username') || !config.has('password'))
    throw new TypeError('User is not loaded in to CU.');
  return {
    username: config.get('username'),
    password: config.get('password')
  };
}

/**
 * Creates a CU session with username and password from system keyring.
 */
async function createSession(config: Conf): Promise<CUSession> {
  const { username, password } = getLogin(config);
  const session = new CUSession();
  await session.init(username, password);
  return session;
}

/**
 * Returns the gpa as a number.
 * @param config the config for the application.
 */
export async function getGpa(config: Conf): Promise<number> {
  const { username, password } = await getLogin(config);
  const session = new CUSession();
  await session.init(username, password);
  const gpa = parseFloat((await session.GPA()).cum_GPA);
  return gpa;
}

export async function getCourses(
  config: Conf,
  term: 'current' | 'next' | 'next-next' | 'previous' = 'current'
): Promise<ICourse[]> {
  const session = await createSession(config);
  const terms = await session.termData();
  let wantedTerm: ITerm['attributeName'] = 'CURRENT_TERM';

  if (term === 'next') wantedTerm = 'NEXT_TERM';
  else if (term === 'next-next') wantedTerm = 'NEXT_NEXT_TERM';
  else if (term === 'previous') wantedTerm = 'PREVIOUS_TERM';

  const foundTerm = terms.find((term) => term.attributeName === wantedTerm);
  if (!foundTerm) {
    throw new Error('Could not find current term data.');
  }
  const courses = Array.from(
    (await session.classTermData(foundTerm.term4)).values()
  );
  return courses;
}

/**
 * Syncs classes from CU term to google calendar.
 */
export async function syncClassesCalendar(
  config: Conf,
  term: 'current' | 'next' | 'next-next' | 'previous' = 'current'
): Promise<void> {
  const courses = await helper.getCourses(config, term);

  if (!config.has('google')) throw new Error('Not logged in to google.');
  const auth = await authorize(config.get('google'));
  const calendar = google.calendar({ version: 'v3', auth });

  for (const course of courses) {
    const startTime = moment.utc(
      `${course.courseStartDate} ${course.courseStartTime}`,
      'YYYY-MM-DD k:m'
    );
    const endTime = moment.utc(
      `${course.courseStartDate} ${course.courseStopTime}`,
      'YYYY-MM-DD k:m'
    );
    const endDate = moment.utc(course.courseStopDate, 'YYYY-MM-DD');
    // const start = course.courseStartDate
    const days = toDays(course.days);
    const instructorText = course.instructors.reduce(
      (prev, instructor, index) => {
        if (index === 0) {
          return `\t${instructor.name} - ${instructor.email}`;
        }
        return prev + `\n\t${instructor.name} - ${instructor.email}`;
      },
      ''
    );
    console.log(`Creating "${course.courseTitle}" event.`);
    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: course.courseTitle,
        description: `Course Id: ${course.courseId}\nSubject: ${course.courseSubject}${course.courseNumber}-${course.courseSection}\nCredits: ${course.credits}\nInstructors:\n${instructorText}`,
        start: {
          dateTime: startTime.toISOString(), // yyyy-mm-dd
          timeZone: 'America/Denver'
        },
        end: {
          dateTime: endTime.toISOString(), // yyyy-mm-dd
          timeZone: 'America/Denver'
        },
        recurrence: [
          `RRULE:FREQ=WEEKLY;UNTIL=${endDate
            .locale('en')
            .format('YYYYMMDD[T]000000[Z]')};WKST=SU;BYDAY=${days.join(',')}`
        ],
        location: course.descrLocation
      }
    });
  }
}
