import { Controller, Get } from "@nestjs/common";

@Controller("app")
export class AppController {
  // 獲取所有使用者
  @Get("info")
  info() {
    return { info: "info" };
  }

  @Get("test")
  test() {
    return new Test("test");
  }
  // 獲取所有使用者
  @Get("error")
  error() {
    throw new Error("This is a test error");
    return { info: "info" };
  }
}

export class Test {
  constructor(public name: string) {}
}
