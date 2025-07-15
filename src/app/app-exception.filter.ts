import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { Request, Response } from "express";
import { Exection } from "../common/exection";

@Catch(Error)
export class AppExceptionFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (error instanceof HttpException) {
      response.status(error.getStatus()).json({
        code: "error",
        message: error.message, //TODO: 不要直接返回 error.message，可能包含敏感信息
        stack: error.stack, //TODO: 不要直接返回 error.stack，可能包含敏感信息
      });
      return;
    }

    const exception = error instanceof Exection ? error : new Exection(error.message);

    response.status(exception.httpStatus).json({
      code: exception.code,
      message: exception.message, //TODO: 不要直接返回 error.message，可能包含敏感信息
      stack: exception.stack, //TODO: 不要直接返回 error.stack，可能包含敏感信息
    });
  }
}
