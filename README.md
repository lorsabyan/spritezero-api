# spritezero-api
REST API based on @indoorequal/spritezero-cli

## How to run

### With node.js
`npm i`

`npm run start`

### With Docker Compose
`docker-compose up -d`

## Request example
```shell
curl --request POST \
  --url http://localhost:3000/sprite \
  --header 'Content-Type: multipart/form-data' \
  --form icons=@<absolute path to svg file> \
  --form icons=@<absolute path to another svg file>
```
