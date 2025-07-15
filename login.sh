curl -X POST localhost:3000/user/register --data '{"username":"ted"}' -H "Content-Type: application/json" -s | jq
export TOKEN=$(curl -X POST localhost:3000/user/login --data '{"username":"ted"}' -H "Content-Type: application/json" -s | jq ".data.accessToken" -r)
curl localhost:3000/user/info  -H "Content-Type: application/json" -H "authorization: Bearer $TOKEN" -s | jq
