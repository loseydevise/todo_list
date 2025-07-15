import { INestApplication } from "@nestjs/common";
import CronExpressionParser from "cron-parser";
import * as dayjs from "dayjs";
// "dayjs/plugin/duration"
import "dayjs/plugin/duration";
import { App } from "supertest/types";

describe("AppController (e2e)", () => {
  let app: INestApplication<App>;

  it("test", () => {
    // const next = getNextDate("0 0 1 * *", new Date("2023-10-01T00:10:00Z"));
    // console.log("Next execution date:", dayjs(next).format("YYYY-MM-DD HH:mm:ss"));
    // const now = dayjs();
    // const interval = CronExpressionParser.parse(
    //   "0 0 1 * *", // 每天午夜
    //   {
    //     currentDate: now.toDate(),
    //   },
    // );
    // const nextDate = interval.next().toDate();
    // const previousDate = interval.prev().toDate();
    // const duration = dayjs(nextDate).diff(dayjs(previousDate));
    // console.log(
    //   "Next execution date:",
    //   // use +8 timezone
    //   dayjs(nextDate).format("YYYY-MM-DD HH:mm:ss"),
    //   "Previous execution date:",
    //   dayjs(previousDate).format("YYYY-MM-DD HH:mm:ss"),
    // );
    // console.log(now.format("YYYY-MM-DD HH:mm:ss"), now.add(duration).format("YYYY-MM-DD HH:mm:ss"));
  });
});
