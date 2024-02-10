# parse-server-example

Parse Server Example with SSL using docker-compose

## Prerequisites

Make sure the following folders are created with writing rights enabled or create them using :

```
mkdir ./db
mkdir ./db/logs
mkdir ./api/logs
mkdir ./web/logs
```

### Environment variables

Make sure the following environment variables are defined in a `.env` file:

```
APP_NAME=AppName
APP_DB_NAME=appdb
APP_ID=appid
APP_MASTER_KEY=secretappkey
SERVER_HOST=localhost
SERVER_PORT=443
PARSE_DASHBOARD_USER=admin
PARSE_DASHBOARD_USE_ENCRYPTED_PASSWORD=false
PARSE_DASHBOARD_PASSWORD=secretpassword
```
If you are deploying the server on the internet replace the SERVER_HOST=localhost with SERVER_HOST=[your_server_name.domain.com].

### SSL certificates

Create SSL certificates using Certbot (https://certbot.eff.org/) instructions and modify docker-compose.yml file accordinly.

