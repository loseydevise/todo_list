import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Task } from "./Task";
import { User } from "./User";

@Entity("task_messages")
@Index("idx_task_id", ["taskId"])
@Index("idx_user_id", ["userId"])
@Index("idx_created_at", ["createdAt"])
export class TaskMessage {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true, comment: "訊息唯一識別碼" })
  id: number;

  @Column({ type: "bigint", unsigned: true, nullable: false, comment: "關聯的任務 ID" })
  taskId: number;

  @Column({ type: "bigint", unsigned: true, nullable: true, comment: "發送訊息的用戶 ID，null is system" })
  userId: number;

  @Column({ type: "varchar", length: 50, default: "text", comment: "訊息類型（text, image, file 等）" })
  messageType: string;

  @Column({ type: "text", nullable: false, comment: "訊息內容" })
  content: string;

  @CreateDateColumn({ type: "datetime", comment: "訊息建立時間" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", comment: "訊息最後更新時間" })
  updatedAt: Date;

  //======= 關聯 =======

  // 關聯到任務
  @ManyToOne(() => Task, (task) => task.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "taskId" })
  task: Task;

  // 關聯到用戶
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user?: User;
}
