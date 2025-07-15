import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import * as dayjs from "dayjs";
import { Repository } from "typeorm";
import { Task } from "../entities/Task";

@Injectable()
export class NotificationEventsService {
  constructor(
    private eventEmitter: EventEmitter2, // emitter 可以使用 MQ 達到保證送達，這裡為了簡化系統使用 eventEmitter 作為代替
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}
  private readonly logger = new Logger(NotificationEventsService.name);

  @OnEvent("task.created", { async: true }) //非同步處理
  async handleTaskCreatedEvent(payload: { task: Task }) {
    this.logger.log(`Task created: ${payload.task.title} (ID: ${payload.task.id})`);
    await this.calNotificationTime(payload.task);
  }

  @OnEvent("task.updated", { async: true }) //非同步處理
  async handleTaskUpdatedEvent({ task, previousTask }: { task: Task; previousTask: Task }) {
    if (task.notification === previousTask.notification && task.dueAt === previousTask.dueAt) return;

    await this.calNotificationTime(task);
  }

  async calNotificationTime(task: Task) {
    if (!task.notification || !task.dueAt) return;

    const notificationTime = this.getNotificationTime(task.notification, task.dueAt);
    if (!notificationTime) return;
    await this.taskRepository.update({ id: task.id }, { notificationAt: notificationTime });

    return notificationTime;
  }

  private getNotificationTime(notification: string, dueTime: Date) {
    const due = dayjs(dueTime);
    const [type, value] = notification.split("/");

    if (type === "beforeDue") {
      const dueTime = due.add(parseInt(value, 10), "second");
      return dueTime.toDate();
    } else if (type === "thatDay") {
      const [hours, minutes] = value.split(":").map(Number);
      const dueTime = due.hour(hours).minute(minutes).second(0).millisecond(0);
      return dueTime.toDate();
    }
    return null; // 如果通知格式不正確，返回 null
  }
}
