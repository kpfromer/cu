jest.mock('cu-api');
jest.mock('../calendar');
jest.mock('googleapis');
import * as CU from 'cu-api';
import * as calendarHelper from '../calendar';
import { google } from 'googleapis';

import * as cli from '../cli';
import { getGpa, getCourses, syncClassesCalendar } from '../cli';

describe('getGpa', () => {
  let config: any;
  beforeEach(() => {
    jest.clearAllMocks();
    config = {
      get: jest.fn(),
      has: jest.fn()
    };
    config.get.mockImplementation((name: string) => {
      if (name === 'username') return 'mock-username';
      else if (name === 'password') return 'mock-password';
      else throw new Error();
    });
    config.has.mockImplementation((name: string) => {
      return name === 'username' || name === 'password';
    });
  });
  it('returns the gpa', async () => {
    expect.assertions(3);
    (CU as jest.Mocked<
      typeof CU
    >).CUSession.prototype.GPA.mockResolvedValueOnce({
      cum_GPA: '3.64',
      cur_GPA: '4.0'
    });

    const gpa = await getGpa(config);

    const CUSessionInstance = (CU as jest.Mocked<typeof CU>).CUSession.mock
      .instances[0];
    expect(CU.CUSession).toHaveBeenCalled();
    expect(CUSessionInstance.init).toHaveBeenCalledWith(
      'mock-username',
      'mock-password'
    );
    expect(gpa).toEqual(3.64);
  });
});

describe('getCourses', () => {
  let config: any;
  let termData: CU.ITerm[];
  beforeEach(() => {
    jest.clearAllMocks();
    config = {
      get: jest.fn(),
      has: jest.fn()
    };
    config.get.mockImplementation((name: string) => {
      if (name === 'username') return 'mock-username';
      else if (name === 'password') return 'mock-password';
      else throw new Error();
    });
    config.has.mockImplementation((name: string) => {
      return name === 'username' || name === 'password';
    });
    // mock term metadata
    termData = [
      {
        term4: '2200',
        term5: 'term5',
        startDate: '2019-08-01',
        endDate: '2020-12-25',
        termFriendly: 'Fall 2019',
        attributeName: 'PREVIOUS_TERM'
      },
      {
        term4: '2201',
        term5: 'term5',
        startDate: '2020-01-01',
        endDate: '2020-04-04',
        termFriendly: 'Spring 2020',
        attributeName: 'CURRENT_TERM'
      },
      {
        term4: '2202',
        term5: 'term5',
        startDate: '2020-05-01',
        endDate: '2020-08-01',
        termFriendly: 'Summer 2020',
        attributeName: 'NEXT_TERM'
      },
      {
        term4: '2203',
        term5: 'term5',
        startDate: '2020-08-01',
        endDate: '2020-12-25',
        termFriendly: 'Fall 2020',
        attributeName: 'NEXT_NEXT_TERM'
      }
    ];
  });
  describe('terms', () => {
    let classTermData: Map<any, any>;
    beforeEach(() => {
      classTermData = new Map();
      classTermData.set('class-id', {
        name: 'Computer Systems'
      });

      (CU as jest.Mocked<
        typeof CU
      >).CUSession.prototype.termData.mockResolvedValueOnce(termData);

      (CU as jest.Mocked<
        typeof CU
      >).CUSession.prototype.classTermData.mockResolvedValueOnce(classTermData);
    });
    it("gets current term's courses", async () => {
      expect.assertions(4);

      const courses = await getCourses(config);

      const CUSessionInstance = (CU as jest.Mocked<typeof CU>).CUSession.mock
        .instances[0];
      expect(CU.CUSession).toHaveBeenCalled();
      expect(CUSessionInstance.init).toHaveBeenCalledWith(
        'mock-username',
        'mock-password'
      );
      expect(CUSessionInstance.classTermData).toHaveBeenCalledWith('2201'); // current term
      expect(courses).toEqual([classTermData.get('class-id')]);
    });
    it("gets next term's courses", async () => {
      expect.assertions(4);

      const courses = await getCourses(config, 'next');

      const CUSessionInstance = (CU as jest.Mocked<typeof CU>).CUSession.mock
        .instances[0];
      expect(CU.CUSession).toHaveBeenCalled();
      expect(CUSessionInstance.init).toHaveBeenCalledWith(
        'mock-username',
        'mock-password'
      );
      expect(CUSessionInstance.classTermData).toHaveBeenCalledWith('2202'); // current term
      expect(courses).toEqual([classTermData.get('class-id')]);
    });
    it("gets next next term's courses", async () => {
      expect.assertions(4);

      const courses = await getCourses(config, 'next-next');

      const CUSessionInstance = (CU as jest.Mocked<typeof CU>).CUSession.mock
        .instances[0];
      expect(CU.CUSession).toHaveBeenCalled();
      expect(CUSessionInstance.init).toHaveBeenCalledWith(
        'mock-username',
        'mock-password'
      );
      expect(CUSessionInstance.classTermData).toHaveBeenCalledWith('2203'); // current term
      expect(courses).toEqual([classTermData.get('class-id')]);
    });
    it("gets previous term's courses", async () => {
      expect.assertions(4);

      const courses = await getCourses(config, 'previous');

      const CUSessionInstance = (CU as jest.Mocked<typeof CU>).CUSession.mock
        .instances[0];
      expect(CU.CUSession).toHaveBeenCalled();
      expect(CUSessionInstance.init).toHaveBeenCalledWith(
        'mock-username',
        'mock-password'
      );
      expect(CUSessionInstance.classTermData).toHaveBeenCalledWith('2200'); // current term
      expect(courses).toEqual([classTermData.get('class-id')]);
    });
  });
  it('errors if term is not found', async () => {
    expect.assertions(1);
    (CU as jest.Mocked<
      typeof CU
    >).CUSession.prototype.termData.mockResolvedValueOnce([
      {
        term4: '2200',
        term5: 'term5',
        startDate: '2019-08-01',
        endDate: '2020-12-25',
        termFriendly: 'Fall 2019',
        attributeName: 'PREVIOUS_TERM'
      }
    ]);

    const errorWrapper = async () => {
      await getCourses(config);
    };

    await expect(errorWrapper).rejects.toThrowErrorMatchingSnapshot();
  });
});

describe('syncClassesCalendar', () => {
  let config: any;
  let mockGoogleCredentials: any;
  beforeEach(() => {
    mockGoogleCredentials = {
      clientId: 'clientId',
      secret: 'googleSecret'
    };
    config = {
      get: jest.fn(),
      has: jest.fn()
    };
  });
  it('creates calendar events based on classes', async () => {
    expect.assertions(3);

    const mockAuth = jest.fn();
    const mockCalendar = {
      events: {
        insert: jest.fn()
      }
    };
    const term = 'next';
    const courses = [
      {
        courseTitle: 'The is the class name!',
        courseId: 'courseId',
        courseSubject: 'CSCI',
        courseNumber: '2824',
        courseSection: '666',
        credits: '55',
        instructors: [
          {
            name: 'Kyle Pfromer',
            email: 'kyle@email.com'
          }
        ],
        courseStartDate: '2020-01-01',
        courseStopDate: '2020-04-04',
        courseStartTime: '9:0',
        courseStopTime: '9:50',
        descrLocation: 'engineering center',
        days: 'MWF'
      }
    ];

    config.get.mockImplementation((name: string) => {
      if (name === 'username') return 'mock-username';
      else if (name === 'password') return 'mock-password';
      else if (name === 'google') return mockGoogleCredentials;
      else throw new Error();
    });
    config.has.mockImplementation((name: string) => {
      return name === 'username' || name === 'password' || name === 'google';
    });

    const getCoursesSpy = jest
      .spyOn(cli, 'getCourses')
      .mockResolvedValue(courses as any);
    (calendarHelper as jest.Mocked<
      typeof calendarHelper
    >).authorize.mockResolvedValue(mockAuth as any);
    (google as jest.Mocked<typeof google>).calendar.mockReturnValue(
      mockCalendar as any
    );

    await syncClassesCalendar(config, term);

    expect(getCoursesSpy).toHaveBeenCalledWith(config, term);
    expect(google.calendar).toHaveBeenCalledWith({
      version: 'v3',
      auth: mockAuth
    });
    expect(mockCalendar.events.insert.mock.calls[0][0]).toMatchSnapshot();
  });
  it('errors if not logged into google', async () => {
    expect.assertions(1);
    config.get.mockImplementation((name: string) => {
      if (name === 'username') return 'mock-username';
      else if (name === 'password') return 'mock-password';
      else throw new Error();
    });
    config.has.mockImplementation((name: string) => {
      return name === 'username' || name === 'password';
    });

    const errorWrapper = async () => {
      await syncClassesCalendar(config);
    };

    await expect(errorWrapper).rejects.toThrowErrorMatchingSnapshot();
  });
});
