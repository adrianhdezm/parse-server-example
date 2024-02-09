# parse-server-example

Parse Server Example with SSL using docker-compose

## Prerequisites

Make sure the following folders are created with writing rights enabled or create them using :
mkdir ./db
mkdir ./db/data
mkdir ./db/logs
mkdir ./api/logs
mkdir ./web/logs

### Environment variables

Make sure the following environment variables are defined in a `.env` file:

```
APP_NAME=AppName
APP_DB_NAME=appdb
APP_ID=appid
APP_MASTER_KEY=secretappkey
SERVER_HOST=localhost
SERVER_PORT=8085
PARSE_DASHBOARD_USER=admin
PARSE_DASHBOARD_USE_ENCRYPTED_PASSWORD=false
PARSE_DASHBOARD_PASSWORD=secretpassword
```
### SSL certificates

Create SSL certificates and store them in the following folder:
mkdir ./web/cert

