import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserNotification } from "./UserNotification";

@Entity("users")
@Index("uk_username", ["username"], { unique: true })
export class User {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true, comment: "使用者唯一識別碼" })
  id: number;

  @Column({ type: "varchar", length: 100, comment: "使用者名稱（唯一）" })
  username: string;

  @CreateDateColumn({ type: "datetime", comment: "建立時間" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", comment: "更新時間" })
  updatedAt: Date;

  //======= 關聯 =======

  // 關聯到Notification
  @OneToMany(() => UserNotification, (userNotification) => userNotification.user)
  notifications: UserNotification[];
}
