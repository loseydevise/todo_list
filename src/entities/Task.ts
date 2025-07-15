import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { TaskMessage } from "./TaskMessage";
import { User } from "./User";
import { TaskFollower } from "./TaskFollower";
// import { TaskFollower } from "./TaskFollower";

@Entity("tasks")
@Index("idx_assignee_id", ["assigneeId"])
@Index("idx_due_at", ["dueAt"])
export class Task {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true, comment: "任務唯一識別碼" })
  id: number;

  @Column({ type: "datetime", nullable: true, comment: "任務完成時間（NULL 表示未完成）" })
  completedAt?: Date;

  @Column({ type: "varchar", length: 255, comment: "任務標題" })
  title: string;

  //TODO: text格式適合獨立表
  @Column({ type: "text", nullable: true, comment: "任務詳細描述" })
  description?: string;

  @Column({ type: "datetime", nullable: true, comment: "任務開始時間" })
  startAt?: Date;

  @Column({ type: "datetime", nullable: true, comment: "任務截止時間" })
  dueAt?: Date;

  // 通知方式
  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
    comment: "任務通知方式（如：beforeDue/-234, thatDay/18:00等）",
  })
  notification?: string;

  @Column({ type: "datetime", nullable: true, comment: "任務通知時間（計算後的時間）" })
  notificationAt?: Date; // 用於計算通知時間

  @Column({ type: "varchar", length: 255, nullable: false, comment: "任務路徑（用於樹狀結構，如：'0/123/45/'） " })
  parentPath: string;

  @Column({ type: "bigint", unsigned: true, nullable: true, comment: "父任務 ID（為 NULL 表示是最上層任務）" })
  parentTaskId: number;

  @Column({ type: "bigint", unsigned: true, nullable: true, comment: "任務負責人（對應 users.id）" })
  assigneeId: number;

  @Column({ type: "bigint", unsigned: true, nullable: true, comment: "任務創建者 ID（對應 users.id）" })
  creatorId: number;

  // 循環週期
  @Column({ type: "varchar", length: 50, nullable: true, comment: "任務週期（如：15 10 * * * * ）" })
  cycle: string;

  @CreateDateColumn({ type: "datetime", comment: "任務建立時間" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", comment: "任務最後更新時間" })
  updatedAt: Date;

  //======= 關聯 =======

  // 自引用關係：父任務
  @ManyToOne(() => Task, { onDelete: "CASCADE" })
  @JoinColumn({ name: "parentTaskId", referencedColumnName: "id" })
  parent: Task;

  // 自引用關係：子任務
  @OneToMany(() => Task, (todo) => todo.parent)
  children: Task[];

  // 關聯到負責人
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "assigneeId", referencedColumnName: "id" })
  assignee: User;

  // 關聯到創建者
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "creatorId", referencedColumnName: "id" })
  creator: User;

  // 關聯到任務訊息
  @OneToMany(() => TaskMessage, (message) => message.task)
  messages: TaskMessage[];

  // 關聯到關注者
  @OneToMany(() => TaskFollower, (taskFollower) => taskFollower.task)
  followers: TaskFollower[];
}
