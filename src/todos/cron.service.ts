import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import * as dayjs from "dayjs";
import { Task } from "../entities/Task";
import { Repository } from "typeorm";
import { UserNotification } from "../entities/UserNotification";
import { uniq } from "lodash";

@Injectable()
export class CronService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(UserNotification)
    private userNotificationRepository: Repository<UserNotification>,
  ) {}
  private readonly logger = new Logger(CronService.name);

  @Cron(CronExpression.EVERY_MINUTE) // 每分鐘執行一次
  async handleCron() {
    // 目前採用簡單做法，可靠性差（當服務器中斷時會有通知未送達），
    // 當前這種方式不支援橫向擴展，如果要支援橫向擴展 就要使用分布式鎖，
    // 或是 將來可以 使用 bullmq的延遲任務 來做更複雜的排程 ，
    // 並將該方法改為冪等性設計，將任務放入消息隊列並將消息id 記入資料庫表示已完成，
    // 下次執行時跳過已完成通知的訊息

    const start = dayjs().startOf("minute").toDate();
    const end = dayjs().endOf("minute").toDate();
    const tasks = await this.getTasksByNotificationAt(start, end);

    this.logger.log(
      `Found ${tasks.length} ${tasks.map((t) => t.id).toString()} tasks due for notification at ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
    );

    for (const task of tasks) {
      const userIdList = task.followers.map((follower) => follower.user.id);
      if (task.assignee?.id) userIdList.push(task.assignee.id); // 包含任務負責人
      if (task.creator?.id) userIdList.push(task.creator.id); // 包含任務負責人

      const notifList = uniq(userIdList).map((userId) => {
        return this.userNotificationRepository.create({
          userId: userId,
          message: `Task "${task.title}" (${task.id}) is due at ${dayjs(task.dueAt).format("YYYY-MM-DD HH:mm:ss")}`,
        });
      });

      await this.userNotificationRepository.save(notifList);
    }
  }

  // 查詢一個notificationAt區間的任務
  async getTasksByNotificationAt(start: Date, end: Date): Promise<Task[]> {
    return this.taskRepository
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.parent", "parent")
      .leftJoinAndSelect("task.assignee", "assignee")
      .leftJoinAndSelect("task.followers", "followers")
      .leftJoinAndSelect("followers.user", "followerUser")
      .leftJoinAndSelect("task.messages", "messages")
      .leftJoinAndSelect("task.creator", "creator")
      .where("task.notificationAt >= :start", { start: dayjs(start).toDate() })
      .andWhere("task.notificationAt <= :end", { end: dayjs(end).toDate() })
      .andWhere("task.completedAt IS NULL")
      .getMany();
  }
}
