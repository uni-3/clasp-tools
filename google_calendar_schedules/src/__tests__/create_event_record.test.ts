import * as target from "../get_google_calendar_events";

describe("toCSVStr", (): void => {
  test("record", (): void => {
    let records: target.record[] = [
      {
        calendarId: "id",
        eventId: "",
        title: '"title"', // will escape
        description: "",
        startTime: "",
        endTime: "",
        duration: 0,
      },
      {
        calendarId: "id",
        eventId: "",
        title: '"title"', // will escape
        description: "",
        startTime: "",
        endTime: "",
        duration: 0,
      },
    ];

    let res = '"id","","""title""","","","",0\n"id","","""title""","","","",0';
    let bq = new target.BQClient("test", "test");
    expect(bq.toCSVStr(records)).toEqual(res);
  });
});

// TODO : GASの独自オブジェクトはモックする
//Calendar.getEvents = jest.fn(() => "");
