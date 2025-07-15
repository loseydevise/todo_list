export class Exection extends Error {
  code: string;
  httpStatus: number;

  constructor(message: string, code?: string, httpStatus?: number) {
    super(message);
    this.code = code ?? "server error";
    this.httpStatus = httpStatus ?? 500;
  }
}

export const Oops = (message: string, code?: string, httpStatus?: number): Exection => {
  return new Exection(message, code, httpStatus);
};
