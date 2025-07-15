import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity("user_notifications")
@Index("idx_user_id", ["userId"])
@Index("idx_created_at", ["createdAt"])
export class UserNotification {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true, comment: "通知唯一識別碼" })
  id: number;

  @Column({ type: "bigint", unsigned: true, nullable: false, comment: "接收通知的用戶 ID" })
  userId: number;

  @Column({ type: "varchar", length: 255, nullable: false, comment: "通知標題" })
  message: string;

  @CreateDateColumn({ type: "datetime", comment: "通知建立時間" })
  createdAt: Date;

  //======= 關聯 =======

  // 關聯到用戶
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user?: User;

  // 關聯到任務（可選）
  // @ManyToOne(() => Task, { onDelete: "CASCADE" })
  // @JoinColumn({ name: "taskId" })
  // task: Task;
}
