import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";

import { getDatabaseConfig } from "../config/database";
import { AppExceptionFilter } from "./app-exception.filter";
import { UsersModule } from "../users/users.module";
import { ResponseInterceptor } from "./response.interceptor";
import { AppController } from "./app.controller";
import { JwtModule } from "@nestjs/jwt";
import { jwtSecret } from "../config/secret";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { TodosModule } from "../todos/todos.module";

@Module({
  controllers: [AppController],
  imports: [
    UsersModule,
    TodosModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: jwtSecret(),
      signOptions: { expiresIn: "60m" },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        console.log("Database Config:", config);

        return config;
      },
    }),
  ],
})
export class AppModule {
  static async bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalFilters(new AppExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.listen(process.env.PORT ?? 3000);
  }
}
