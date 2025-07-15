import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Task } from "../entities/Task";
import { TaskFollower } from "../entities/TaskFollower";
import { TaskMessage } from "../entities/TaskMessage";
import { User } from "../entities/User";
import * as dayjs from "dayjs";

@Injectable()
export class TodosService {
  constructor(
    private eventEmitter: EventEmitter2, // emitter 可以使用 MQ 達到保證送達，這裡為了簡化系統使用 eventEmitter 作為代替
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskMessage)
    private taskMessageRepository: Repository<TaskMessage>,
    @InjectRepository(TaskFollower)
    private taskFollowerRepository: Repository<TaskFollower>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  private readonly logger = new Logger(TodosService.name);

  async createTask(taskData: Partial<Task>): Promise<Task> {
    // 處理 parentPath 邏輯
    let parentPath = "";
    if (taskData.parentTaskId) {
      const parentTask = await this.taskRepository.findOne({ where: { id: taskData.parentTaskId } });
      if (parentTask) {
        parentPath = `${parentTask.parentPath}/${parentTask.id}`;
      }
    }

    const user = await this.userRepository.findOne({ where: { id: taskData.creatorId } });
    if (!user) {
      throw new Error(`創建者 ID ${taskData.creatorId} 不存在`);
    }

    // 創建任務實體
    const taskTemp = this.taskRepository.create({
      ...taskData,
      parentPath,
      completedAt: taskData.completedAt,
    });

    // 保存並返回任務
    const task = await this.taskRepository.save(taskTemp);

    void this.eventEmitter.emitAsync("task.created", { task });

    return task;
  }

  async deleteTask(id: number): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`任務 ID ${id} 不存在`);
    }

    await this.taskRepository.manager.transaction(async (manager) => {
      const children = await manager
        .createQueryBuilder(Task, "task")
        .select("id")
        .where("task.parentPath LIKE :path", { path: `${task.parentPath}/${task.id}%` })
        .getMany();

      // 刪除所有子任務
      if (children.length > 0) {
        const childIds = children.map((child) => child.id);
        await manager.delete(Task, [...childIds]);
      }
      await manager.delete(Task, { id }); // 刪除當前任務
    });

    this.eventEmitter.emit("task.deleted", { task });
    return;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task> {
    const previousTask = await this.taskRepository.findOne({ where: { id } });

    if (!previousTask) {
      throw new NotFoundException(`任務 ID ${id} 不存在`);
    }

    const temp: Task = this.taskRepository.create({
      ...previousTask,
      ...taskData,
    });
    // 更新任務屬性
    // Object.assign(temp, previousTask, taskData);

    // // 處理 parentPath 邏輯
    // if (previousTask.parentTaskId) {
    //   const parentTask = await this.taskRepository.findOne({ where: { id: previousTask.parentTaskId } });
    //   if (parentTask) {
    //     previousTask.parentPath = `${parentTask.parentPath}/${parentTask.id}`;
    //   }
    // }

    // 保存並返回更新後的任務
    const task = await this.taskRepository.save(temp);

    this.logger.log(
      `Task controller updated:(ID: ${task.id})  ${dayjs(task.completedAt).toISOString()}  ${previousTask.completedAt && dayjs(previousTask.completedAt).toISOString()}`,
    );

    this.eventEmitter.emit("task.updated", { task, previousTask });

    return task;
  }

  async addMessageToTask(data: { taskId: number; userId: number; content: string }): Promise<TaskMessage> {
    const task = await this.taskRepository.findOne({ where: { id: data.taskId } });
    if (!task) {
      throw new NotFoundException(`任務 ID ${data.taskId} 不存在`);
    }
    if (!data.content || data.content.trim() === "") {
      throw new Error("Message content cannot be empty");
    }

    const message = this.taskMessageRepository.create({
      taskId: data.taskId,
      userId: data.userId,
      content: data.content,
      messageType: "text",
    });

    const savedMessage = await this.taskMessageRepository.save(message);

    this.eventEmitter.emit("task.messageAdded", { task, message: savedMessage });

    return savedMessage;
  }

  // 加入 follow 功能
  async followTask(userId: number, taskId: number): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`任務 ID ${taskId} 不存在`);
    }

    const existingFollower = await this.taskFollowerRepository.findOne({
      where: { userId, taskId },
    });

    if (existingFollower) {
      throw new Error(`用戶 ${userId} 已經關注此任務`);
    }

    const follower = this.taskFollowerRepository.create({ userId, taskId });
    await this.taskFollowerRepository.save(follower);

    this.eventEmitter.emit("task.followed", { userId, taskId });
  }

  // 取消關注任務
  async unfollowTask(userId: number, taskId: number): Promise<void> {
    const follower = await this.taskFollowerRepository.findOne({ where: { userId, taskId } });
    if (!follower) {
      throw new NotFoundException(`用戶 ${userId} 沒有關注任務 ID ${taskId}`);
    }

    await this.taskFollowerRepository.remove(follower);

    this.eventEmitter.emit("task.unfollowed", { userId, taskId });
  }

  //======= 查詢 =======

  async getTaskById(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: [
        //
        "parent",
        "children",
        "assignee",
        "creator",
        "messages",
        "followers",
      ],
    });
    if (!task) {
      throw new NotFoundException(`任務 ID ${id} 不存在`);
    }
    return task;
  }

  async getUserTasks(
    userId: number,
    options?: {
      startDate?: Date;
      endDate?: Date;
      creatorId?: number;
      assigneeId?: number;
      orderBy?: "createdAt" | "completedAt" | "creatorId" | "id";
      order?: "ASC" | "DESC";
    },
  ) {
    const query = this.taskRepository
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.parent", "parent")
      .leftJoinAndSelect("task.assignee", "assignee")
      .leftJoinAndSelect("task.followers", "followers")
      .leftJoinAndSelect("followers.user", "followerUser")
      .leftJoinAndSelect("task.messages", "messages")
      .leftJoinAndSelect("task.creator", "creator");

    if (!options) {
      query.where("task.creatorId = :userId", { userId });
      query.orWhere("task.assigneeId = :userId", { userId });
      query.orWhere("followerUser.id = :userId", { userId });
    }

    // 篩選條件
    if (options?.startDate) {
      query.andWhere("task.createdAt >= :startDate", { startDate: options.startDate });
    }
    if (options?.endDate) {
      query.andWhere("task.createdAt <= :endDate", { endDate: options.endDate });
    }
    if (options?.creatorId) {
      query.andWhere("task.creatorId = :creatorId", { creatorId: options.creatorId });
    }
    if (options?.assigneeId) {
      query.andWhere("task.assigneeId = :assigneeId", { assigneeId: options.assigneeId });
    }

    // 排序邏輯
    const validOrderByFields = ["createdAt", "completedAt", "creatorId", "id"];
    const orderByField =
      options?.orderBy && validOrderByFields.includes(options.orderBy) ? options.orderBy : "createdAt";
    const orderDirection = options?.order === "ASC" ? "ASC" : "DESC";
    query.orderBy(`task.${orderByField}`, orderDirection);
    if (orderByField !== "createdAt") query.addOrderBy("task.createdAt", "DESC"); // 次排序確保穩定性

    return query.getMany();
  }
}
