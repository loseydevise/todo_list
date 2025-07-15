import { Body, Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../app/auth.guard";
import { User } from "../entities/User";
import { UsersService } from "./users.service";

@Controller("user")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 註冊
  // curl -X POST localhost:3000/user/register --data '{"username":"ted"}' -H "Content-Type: application/json"
  @Post("register")
  async register(@Body() data: { username: string }) {
    console.log("Registering user:", data);

    await this.usersService.register(data);
  }

  // login
  @Post("login")
  async login(@Body() dto: { username: string }) {
    return await this.usersService.login(dto);
  }

  // 獲取使用者資訊
  @UseGuards(AuthGuard)
  @Get("info")
  async getUserInfo(@Headers("x-user-id") userId: string): Promise<User> {
    return await this.usersService.getById(+userId);
  }
}
