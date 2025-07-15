import "reflect-metadata";
import { AppDataSource } from "./config/database";
import { Task } from "./entities/Task";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("數據庫連接已建立");

    // 示例：創建一個新的 Todo
    const todoRepository = AppDataSource.getRepository(Task);
    const todo = new Task();
    todo.title = "學習 TypeORM";
    todo.description = "完成 TypeORM 的基本設置";

    await todoRepository.save(todo);
    console.log("Todo 已保存:", todo);

    // 示例：查詢所有 Todo
    const todos = await todoRepository.find();
    console.log("所有 Todo:", todos);
  } catch (error) {
    console.error("數據庫連接錯誤:", error);
  }
}

void main();
