import { DataSource, DataSourceOptions } from "typeorm";

export const getDatabaseConfig = (): DataSourceOptions => ({
  type: (process.env.DB_TYPE as "mysql") || "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_DATABASE || "test_todo",
  synchronize: process.env.NODE_ENV === "development" ? true : false,
  logging: process.env.DB_LOGGING === "true",
  // entities: [User],
  entities: ["dist/entities/*.{js,ts}"],
  migrations: ["src/migrations/*.{js,ts}"],
  subscribers: [],
  migrationsTableName: "migrations",
  migrationsRun: false,
});

export const AppDataSource = new DataSource(getDatabaseConfig());
