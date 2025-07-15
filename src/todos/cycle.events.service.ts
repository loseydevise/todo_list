import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { CronExpressionParser } from "cron-parser";
import * as dayjs from "dayjs";
import { pick } from "lodash";
import { Repository } from "typeorm";
import { Task } from "../entities/Task";

@Injectable()
export class CycleEventsService {
  constructor(
    private eventEmitter: EventEmitter2, // emitter 可以使用 MQ 達到保證送達，這裡為了簡化系統使用 eventEmitter 作為代替
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  private readonly logger = new Logger(CycleEventsService.name);

  @OnEvent("task.created", { async: true }) //非同步處理
  handleTaskCreatedEvent(payload: { task: Task }) {
    console.log(`Task created: ${payload.task.title} (ID: ${payload.task.id})`);
  }

  @OnEvent("task.deleted", { async: true }) //非同步處理
  handleTaskDeletedEvent(payload: { task: Task }) {
    console.log(`Task deleted: ${payload.task.title} (ID: ${payload.task.id})`);
  }

  @OnEvent("task.updated", { async: true }) //非同步處理
  async handleTaskUpdatedEvent({ task, previousTask }: { task: Task; previousTask: Task }) {
    // this.logger.log(
    //   `=======Task CycleEventsService updated: ${task.title} (ID: ${task.id}) ====== ${task.completedAt} ${task.completedAt}`,
    // );
    if (task.completedAt === previousTask.completedAt) return;
    if (!task.dueAt || !task.cycle || !task.completedAt) return;
    this.logger.log(
      `Task CycleEventsService updated: ${task.title} (ID: ${task.id}) task.completedAt ${dayjs(task.completedAt).toISOString()}`,
    );

    const keys = [
      "title",
      "description",
      "startAt",
      "dueAt",
      "parentPath",
      "parentTaskId",
      "assigneeId",
      "creatorId",
      "cycle",
      "notification",
    ];

    const nextDueAt = this.getNextDate(task.cycle, task.dueAt);

    const newTaskTemp = this.taskRepository.create({
      ...pick(task, keys),
      completedAt: undefined, // 清除已完成時間
      createdAt: dayjs().toDate(),
      updatedAt: dayjs().toDate(),
      dueAt: nextDueAt,
      startAt: this.getStartAt(task, nextDueAt),
    });
    const newTask = await this.taskRepository.save(newTaskTemp);

    this.eventEmitter.emit("task.created", { task: newTask });
  }

  private getStartAt(task: Task, newDueAt: Date) {
    if (!task.startAt) return undefined;
    const duration = dayjs(task.dueAt).diff(dayjs(task.startAt));
    return dayjs(newDueAt).subtract(duration).toDate();
  }

  private getNextDate(cronExpression: string, fromDate: Date): Date {
    const from = dayjs(fromDate);
    const interval = CronExpressionParser.parse(cronExpression, { currentDate: from.toDate() });
    const previousDate = interval.prev().toDate();
    const nextDate = interval.next().toDate();
    const duration = dayjs(nextDate).diff(dayjs(previousDate)); // 計算兩次執行之間的時間差
    return from.add(duration).toDate();
  }
}
