import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TodosController } from "./todos.controller";
import { TodosService } from "./todos.service";
import { Task } from "../entities/Task";
import { TaskFollower } from "../entities/TaskFollower";
import { TaskMessage } from "../entities/TaskMessage";
import { User } from "../entities/User";
import { UserNotification } from "../entities/UserNotification";
import { CronService } from "./cron.service";
import { CycleEventsService } from "./cycle.events.service";
import { NotificationEventsService } from "./notification.events.service";
import { CompletedEventsService } from "./completed.events.service";

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskFollower, TaskMessage, User, UserNotification])],
  controllers: [TodosController],
  providers: [TodosService, CronService, CompletedEventsService, CycleEventsService, NotificationEventsService],
  exports: [TodosService],
})
export class TodosModule {}
