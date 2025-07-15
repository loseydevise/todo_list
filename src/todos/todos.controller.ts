import { Body, Controller, Delete, Headers, Param, Post, Get, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../app/auth.guard";
import { Task } from "../entities/Task";
import { TodosService } from "./todos.service";
import { compact, values } from "lodash";

@UseGuards(AuthGuard)
@Controller("todos")
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  // 新增任務
  @Post()
  async createTask(@Headers("x-user-id") userId: string, @Body() taskData: Partial<Task>): Promise<Task> {
    const taskWithCreator = {
      ...taskData,
      creatorId: parseInt(userId, 10),
    };
    return await this.todosService.createTask(taskWithCreator);
  }

  // 移除任務
  @Delete(":id")
  async deleteTask(@Param("id") id: number): Promise<void> {
    await this.todosService.deleteTask(id);
  }

  // 修改任務 (標題、描述、開始時間、結束時間、完成或未完成等)
  @Post(":id")
  async updateTask(@Param("id") id: number, @Body() taskData: Partial<Task>): Promise<Task> {
    return await this.todosService.updateTask(id, taskData);
  }

  // 新增任務訊息
  @Post(":id/messages")
  async addMessageToTask(
    @Param("id") taskId: number,
    @Headers("x-user-id") userId: string,
    @Body("content") content: string,
  ) {
    return await this.todosService.addMessageToTask({
      taskId,
      userId: parseInt(userId, 10),
      content,
    });
  }

  // 關注任務
  @Post(":id/follow")
  async followTask(@Param("id") taskId: number, @Headers("x-user-id") userId: string): Promise<void> {
    await this.todosService.followTask(parseInt(userId, 10), taskId);
  }

  // 取消關注任務
  @Delete(":id/follow")
  async unfollowTask(@Param("id") taskId: number, @Headers("x-user-id") userId: string): Promise<void> {
    await this.todosService.unfollowTask(parseInt(userId, 10), taskId);
  }

  // 獲取單個任務
  @Get(":id")
  async getTask(@Param("id") id: number): Promise<Task> {
    return await this.todosService.getTaskById(id);
  }

  // 獲取用戶任務列表
  @Get()
  async getUserTasks(
    @Headers("x-user-id") userId: string,
    @Query("assigneeId") assigneeId?: string,
    @Query("creatorId") creatorId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("orderBy") orderBy?: "createdAt" | "completedAt" | "creatorId" | "id",
    @Query("order") order?: "ASC" | "DESC",
  ): Promise<Task[]> {
    const options = {
      assigneeId: assigneeId ? parseInt(assigneeId, 10) : undefined,
      creatorId: creatorId ? parseInt(creatorId, 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      orderBy,
      order,
    };
    const isAllUndefined = compact(values(options)).length === 0;
    return await this.todosService.getUserTasks(parseInt(userId, 10), isAllUndefined ? undefined : options);
  }
}
