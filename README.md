## TodoList

語言 Typescript
（如果是全端）前端框架優先 React
後端框架優先 Nest.js
資料庫不限語言
需要實現API文件
實作一個TodoList, 可參考Lark的任務功能。 只需要清單、清單需要考慮TodoList的全部功能、不需要分組、不需要協作清單

https://github.com/stark-tech-space/interview-todoList/blob/master/README_v2_zh.md
需要實現以下功能

- 註冊／登入
- 可以多人分享任務的團隊
- 任務增刪改查
  - 任務建立後可指派執行人及關注人
  - 登入的使用者需要可以看見自己的任務、被指派給自己執行的任務、自己有在關注的任務
  - 任務的子任務，子任務與任務結構相同，子任務完成後自動完成主任務
- 顯示任務歷史紀錄
  - 可以新增評論在歷史紀錄中
- 內容篩選（時段、創作人、任務人）
- 支援排序（建立時間、計劃完成時間、創建者、ID）
  以下功能使用文字敘述規劃schema架構、流程（包括使用的功能、服務等）即可
  - 實現訊息提醒任務即將到期
  - 定時重複任務
- 部署採用dockerfile（資料庫可使用docker建置）

## 說明

以下功能使用文字敘述規劃schema架構、流程（包括使用的功能、服務等）即可

- 實現訊息提醒任務即將到期 - CronService
  - 有一個corn job 每一分鐘會檢查一次最近到期的任務，然後去新增使用者通知前端再透過call API的方式取得提醒訊息
  - 目前採用簡單做法，可靠性差（當服務器中斷時會有通知未送達），
    當前這種方式不支援橫向擴展，如果要支援橫向擴展 就要使用分布式鎖，
    或是 將來可以 使用 bullmq的延遲任務 來做更複雜的排程 ，
    並將該方法改為冪等性設計，將任務放入消息隊列並將消息id 記入資料庫表示已完成，
    下次執行時跳過已完成通知的訊息
- 定時重複任務 - CycleEventsService
  - 當任務完成的時候根據 corn 語法，計算期周期性與推算dueAt時間來產生下一個 Task
- 資料表都有註解，主要就是兩張表User與Task請參考 src/entities 資料夾

## 啟動

```bash
yarn demo
# or
docker-compose up --build
```

- Database Admin - http://127.0.0.1:8080
  - root / rootpassword
- App - http://127.0.0.1:3000

## CURL api 說明

- 需要使用 jq docker yarn

```bash
# 用戶相關 API

# 註冊用戶
curl -X POST localhost:3000/user/register \
  --data '{"username":"ted"}' \
  -H "Content-Type: application/json"

curl -X POST localhost:3000/user/register \
  --data '{"username":"ben"}' \
  -H "Content-Type: application/json"

# 用戶登入
curl -X POST localhost:3000/user/login \
  --data '{"username":"ted"}' \
  -H "Content-Type: application/json"

# 獲取用戶資訊 (需要 token) 包含 通知資訊，前端可以使用 polling 方式處理資訊
# 通知資訊，將來可以設計成 WebSocket / SSE / long polling 這是長連線消耗支援比較大 要獨立設計
export TOKEN=$(curl -X POST localhost:3000/user/login --data '{"username":"ted"}' -H "Content-Type: application/json" -s | jq ".data.accessToken" -r)
echo "TOKEN=$TOKEN"
curl localhost:3000/user/info \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN"

# 任務相關 API

# 新增任務
curl -X POST localhost:3000/todos \
  --data '{"title":"完成專案","description":"完成 TodoList 專案","assigneeId":1,"dueAt":"2024-12-31T23:59:59Z"}' \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN"

# 修改任務
curl -X POST localhost:3000/todos/1 \
  --data '{"title":"更新後的任務標題"}' \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN"

# 獲取單個任務 可以得到完整資訊 包含留言
curl -X GET localhost:3000/todos/1 \
  -H "authorization: Bearer $TOKEN"


# 獲取用戶任務列表
curl -X GET localhost:3000/todos \
  -H "authorization: Bearer $TOKEN"

# 獲取用戶任務列表 (帶篩選條件)
curl -X GET "localhost:3000/todos?assigneeId=1&creatorId=1&startDate=2024-01-01&endDate=2024-12-31&orderBy=createdAt&order=DESC" \
  -H "authorization: Bearer $TOKEN"

# 新增任務訊息/評論
curl -X POST localhost:3000/todos/1/messages \
  --data '{"content":"這是一個評論"}' \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN"

# 關注任務
curl -X POST localhost:3000/todos/1/follow \
  -H "authorization: Bearer $TOKEN"

# 取消關注任務
curl -X DELETE localhost:3000/todos/1/follow \
  -H "authorization: Bearer $TOKEN"

# "完成任務" 完成任務加入 completedAt即可，將來可以獨立新的API，會比較有語意
NOW=$(date -u -v+1M +"%Y-%m-%dT%H:%M:%SZ")
curl -X POST localhost:3000/todos/1 \
  --data "{\"completedAt\":\"$NOW\"}" \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN"


# 刪除任務
curl -X DELETE localhost:3000/todos/1 \
  -H "authorization: Bearer $TOKEN"



```

## 使用範例

### 註冊用戶、登入

```bash
echo "註冊用戶"
curl -X POST localhost:3000/user/register --data '{"username":"testuser"}' -H "Content-Type: application/json"

# 2. 登入獲取 token
export TOKEN=$(curl -X POST localhost:3000/user/login --data '{"username":"testuser"}' -H "Content-Type: application/json" -s | jq ".data.accessToken" -r)
echo "登入獲取 token $TOKEN"

export TOKEN2=$(curl -X POST localhost:3000/user/login --data '{"username":"ted"}' -H "Content-Type: application/json" -s | jq ".data.accessToken" -r)
echo "登入獲取 toke $TOKEN2"
```

### 創建任務、創建子任務、完成子任務

```bash

# 3. 創建任務
echo "創建任務"
NOW=$(date -u -v+1M +"%Y-%m-%dT%H:%M:%SZ")
TASK_ID=$(curl -X POST localhost:3000/todos \
  --data "{\"title\":\"測試任務\",\"description\":\"這是一個測試任務\",\"assigneeId\":1,\"dueAt\":\"$NOW\"}" \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN" -s | jq ".data.id" -r)
echo "任務 ID: $TASK_ID $NOW"

echo "創建任務子任務"
NOW=$(date -u -v+1M +"%Y-%m-%dT%H:%M:%SZ")
TASK_ID=$(curl -X POST localhost:3000/todos \
  --data "{\"title\":\"測試任務\",\"description\":\"這是一個測試任務\",\"assigneeId\":1,\"dueAt\":\"$NOW\",\"parentTaskId\":\"$TASK_ID\"}" \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN" -s | jq ".data.id" -r)
echo "任務 ID: $TASK_ID $NOW"

echo "完成子任務"
NOW=$(date -u -v+1M +"%Y-%m-%dT%H:%M:%SZ")
curl -X POST localhost:3000/todos/$TASK_ID \
  --data "{\"completedAt\":\"$NOW\"}" \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN"

# 父任務會自動完成
```

### 建立週期性任務、關注任務、新增評論、完成週期性任務

```bash
# 週期性任務，當完成時會加入一個新任務
# 一天週期代表 0 0 * * *
# 一週週期代表 0 0 * * 0


## 建立週期性任務
NOW=$(date -u -v+1M +"%Y-%m-%dT%H:%M:%SZ")
TASK_ID=$(curl -X POST localhost:3000/todos \
  --data "{\"title\":\"測試任務\",\"description\":\"這是一個測試任務\",\"assigneeId\":1,\"dueAt\":\"$NOW\",\"notification\":\"beforeDue/-1\",\"cycle\":\"0 0 * * 0\"}" \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN" -s | jq ".data.id" -r)
echo "任務 ID: $TASK_ID $NOW"

# 關注任務 (可以使用其他 token登入去關注)
curl -X POST localhost:3000/todos/$TASK_ID/follow \
  -H "authorization: Bearer $TOKEN2"

# sleep 1 minute 使用者訊息列表會有通知
sleep 70

echo "新增評論"
curl -X POST localhost:3000/todos/$TASK_ID/messages \
  --data '{"content":"任務很有趣"}' \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN"


# 獲取單個任務 可以得到完整資訊 包含留言
curl -X GET localhost:3000/todos/$TASK_ID \
  -H "authorization: Bearer $TOKEN"

## 完成週期性任務
NOW=$(date -u -v+1M +"%Y-%m-%dT%H:%M:%SZ")
curl -X POST localhost:3000/todos/$TASK_ID \
  --data "{\"completedAt\":\"$NOW\"}" \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $TOKEN"
# 週期性任務會自動建立下一個任務
```
