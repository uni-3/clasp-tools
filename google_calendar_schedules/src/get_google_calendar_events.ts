import CalendarEvent = GoogleAppsScript.Calendar.CalendarEvent;
import Calendar = GoogleAppsScript.Calendar.Calendar;
// TODO 定義ファイルつくる
//type Moment = any;

// カレンダーから取得する日付
// 実行月の初日, 月末日（来月-1日）
const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// TODO: 保存先はspreadシート版もつくる
// for bigquery
const projectId = "sample-316208";
const datasetId = "test_dataset";
const eventTablePrefix = "google_calendar_events_";
// bigquery table schema
const eventSchema = `
[
    {
        "name": "calendar_id",
        "type": "STRING",
        "mode": "NULLABLE",
        "description": "カレンダーの識別ID 個人の予定は基本emailで入っている"
    },
    {
        "name": "event_id",
        "type": "STRING",
        "mode": "NULLABLE",
        "description": "予定ID。定期的な予定は同一IDをもつ"
    },
    {
        "name": "title",
        "type": "STRING",
        "mode": "NULLABLE",
        "description": "予定のタイトル"
    },
    {
        "name": "description",
        "type": "STRING",
        "mode": "NULLABLE",
        "description": "予定の詳細"
    },
    {
        "name": "start_time",
        "type": "DATETIME",
        "mode": "NULLABLE",
        "description": "予定開始時刻(JST)"
    },
    {
        "name": "end_time",
        "type": "DATETIME",
        "mode": "NULLABLE",
        "description": "予定終了時刻(JST)"
    },
    {
        "name": "duration",
        "type": "FLOAT",
        "mode": "NULLABLE",
        "description": "予定の時間(hour)"
    }
]
`;

export type record = {
  calendarId: string;
  eventId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
};
export class CalendarParser {
  events: CalendarEvent[];
  calendarId: string;

  constructor(c: Calendar, start: Date, end: Date) {
    this.calendarId = c.getId();
    this.events = c.getEvents(start, end);
  }

  eventRecord(c: CalendarEvent): record {
    const format = "yyyy-MM-dd HH:mm:ss";
    const startTime = Utilities.formatDate(c.getStartTime(), "JST", format);
    const endTime = Utilities.formatDate(c.getEndTime(), "JST", format);
    const duration = Moment.moment
      .duration(Moment.moment(endTime).diff(Moment.moment(startTime)))
      .asHours();

    return {
      calendarId: this.calendarId, // getName()のほうがいいかもしれない
      eventId: c.getId(),
      title: c.getTitle(),
      description: c.getDescription(),
      startTime: startTime,
      endTime: endTime,
      duration: duration,
    };
  }

  // カレンダーイベントの中身取得
  parseEventValue(): record[] {
    let eventRecords: record[] = [];
    for (const event of this.events) {
      const eventRecord = this.eventRecord(event);
      eventRecords.push(eventRecord);
    }

    return eventRecords;
  }
}

export class BQClient {
  projectId: string;
  datasetId: string;
  jobId: string;

  constructor(projectId: string, datasetId: string) {
    this.projectId = projectId;
    this.datasetId = datasetId;
    this.jobId = "";
  }

  toCSVStr<T>(data: T[]): string {
    // 文章中の"をエスケープして""で囲む
    const escapeCell = (c: any) => {
      if (typeof c === "string") {
        return `"${c.replace(/\"/g, '""')}"`;
      }
      return c;
    };

    let res = data
      .map((row: T) =>
        (Object.keys(row) as (keyof T)[])
          .map((key) => escapeCell(row[key]))
          .join(",")
      )
      .join("\n");

    return res;
  }

  //insert(tableId: string, fields: any[], records: record[]) {
  insert<T>(tableId: string, fields: any[], records: T[]) {
    let data = this.toCSVStr(records);
    let blob = Utilities.newBlob(data, "application/octet-stream");

    // create data upload job
    const job = {
      configuration: {
        load: {
          destinationTable: {
            projectId: this.projectId,
            datasetId: this.datasetId,
            tableId: tableId,
          },
          schema: {
            fields: fields,
          },
          skipLeadingRows: 0,
          createDisposition: "CREATE_IF_NEEDED",
          writeDisposition: "WRITE_TRUNCATE",
          allowQuotedNewlines: true,
          sourceFormat: "CSV",
        },
      },
    };
    const jobRes = BigQuery.Jobs?.insert(job, this.projectId, blob);
    Logger.log(
      "Load job started. Check on the status of it here: " +
        "https://bigquery.cloud.google.com/jobs/%s",
      this.projectId
    );

    this.jobId = jobRes?.jobReference?.jobId || "";
  }

  waitForJob(): void {
    // locationを設定しないとjobとってこれない
    // https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/get
    let path = {
      location: "asia-northeast1",
    };
    let jobStatus = BigQuery.Jobs?.get(this.projectId, this.jobId, path).status;
    if (jobStatus === undefined) {
      return;
    }
    // 終わるまでまつ
    while (jobStatus?.state === "RUNNING") {
      Utilities.sleep(1000);
      jobStatus = BigQuery.Jobs?.get(this.projectId, this.jobId, path).status;

      if (jobStatus?.state == "DONE") {
        if (jobStatus?.errorResult !== undefined) {
          Logger.log("error Status: " + jobStatus?.errorResult);
        }

        Logger.log("Status: " + jobStatus.state);
        Logger.log("FINISHED!");
      }
    }
  }
}

type Params = {
  dryRun?: boolean;
};

// 実行関数
function main(params: Params): void {
  const dryRun = params?.dryRun || false;

  // 取得するカレンダー
  const scriptProperties = PropertiesService.getScriptProperties();
  const subscribes = scriptProperties.getProperty("subscribes");
  if (subscribes === null) {
    throw new Error(
      "error: cannot get calNames must specify subscribes property"
    );
  }
  const calNames = subscribes.split(",");

  const cals: Calendar[] = [];
  for (let name of calNames) {
    cals.push(CalendarApp.subscribeToCalendar(name.trim()));
  }
  let eventRecords: record[] = [];
  for (const c of cals) {
    let calendarParser = new CalendarParser(c, firstDayOfMonth, lastDayOfMonth);
    if (calendarParser.events.length === 0) {
      Logger.log("skip save event is not exist: ", c.getName());
      continue;
    }
    const eventRecord = calendarParser.parseEventValue();
    eventRecords = eventRecords.concat(eventRecord);
  }
  console.log(
    "get event records:",
    eventRecords.length,
    firstDayOfMonth.toLocaleDateString(),
    lastDayOfMonth.toLocaleDateString()
  );

  if (dryRun) {
    Logger.log("skip insert records, because dryRun: ", dryRun);
    return;
  }
  // to bigquery
  const s = new BQClient(projectId, datasetId);
  const t = Utilities.formatDate(firstDayOfMonth, "JST", "yyyyMMdd");
  const eventTableId = eventTablePrefix + t;
  s.insert(eventTableId, JSON.parse(eventSchema), eventRecords);
  s.waitForJob();
}
