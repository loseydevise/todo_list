import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Task } from "./Task";

@Entity("task_followers")
export class TaskFollower {
  @PrimaryColumn({ type: "bigint", unsigned: true, comment: "使用者 ID" })
  userId: number;

  @PrimaryColumn({ type: "bigint", unsigned: true, comment: "任務 ID" })
  taskId: number;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", comment: "關注時間" })
  followedAt: Date;

  //======= 關聯 =======

  // 關聯到使用者
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  // 關聯到任務
  @ManyToOne(() => Task, { onDelete: "CASCADE" })
  @JoinColumn({ name: "taskId" })
  task: Task;
}
