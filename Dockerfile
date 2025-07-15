FROM node:22-alpine AS builder

WORKDIR /app

# 啟用 Corepack 以使用正確的 Yarn 版本
RUN corepack enable

# 複製 package.json、yarn.lock 和配置文件
COPY package.json yarn.lock .yarnrc.yml ./

# 安裝依賴（這會重新下載 .yarn 目錄）
RUN yarn install --immutable

# 複製源代碼
COPY . .

# 構建應用程式
RUN yarn build

# 生產階段
FROM node:22-alpine AS production

WORKDIR /app

# 啟用 Corepack 以使用正確的 Yarn 版本
RUN corepack enable

# 複製 package.json、yarn.lock 和配置文件
COPY package.json yarn.lock .yarnrc.yml ./

# 僅安裝生產依賴
RUN yarn install --immutable

# 從構建階段複製構建產物
COPY --from=builder /app/dist ./dist

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 更改所有權
RUN chown -R nestjs:nodejs /app
USER nestjs

# 暴露端口
EXPOSE 3000

# 啟動命令
CMD ["node", "dist/main"]
