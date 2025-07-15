import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import * as dayjs from "dayjs";
import { Repository } from "typeorm";
import { Task } from "../entities/Task";

@Injectable()
export class CompletedEventsService {
  constructor(
    private eventEmitter: EventEmitter2, // emitter 可以使用 MQ 達到保證送達，這裡為了簡化系統使用 eventEmitter 作為代替
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}
  private readonly logger = new Logger(CompletedEventsService.name);

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
    this.logger.log(`Task CompletedEventsService updated: ====`);
    this.logger.log(
      `Task CompletedEventsService updated:  task.completedAt !== previousTask.completedAt task.completedAt ${dayjs(task.completedAt).toISOString()} ${previousTask.completedAt && dayjs(previousTask.completedAt).toISOString()}`,
    );

    if (task.completedAt === previousTask.completedAt || !task.completedAt) return;

    this.logger.log(
      `Task CompletedEventsService updated: ${task.title} (ID: ${task.id}) task.completedAt ${dayjs(task.completedAt).toISOString()}`,
    );

    // 當子任務完成時，父任務自動任務完成
    if (task.parentTaskId) {
      const parent = await this.taskRepository.findOne({ where: { id: task.parentTaskId }, relations: ["children"] });
      if (!parent) return;
      this.logger.log(
        `Parent task found: ${parent.title} (ID: ${parent.id}) with children count: ${parent.children.map((c) => c.id).toString()}`,
      );
      const isAllChildrenCompleted = parent.children.every((child) => child.completedAt);
      if (isAllChildrenCompleted) {
        const task = await this.taskRepository.update({ id: parent.id }, { completedAt: dayjs().toDate() });
        this.eventEmitter.emit("task.updated", { task: task, previousTask: parent });
      }
    }
  }
}
