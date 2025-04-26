# parse-server-example

Parse Server Example with SSL and File System Storage using docker-compose

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

### File System Storage Adapter

Make sure the following folder is created with writing rights enabled (All parse-server instances need to be able to read and write to the same storage)

```
mkdir ./api/files
```

Note: Enable File upload by public to avoid errors

### Maintenance during deploy

Keep the size of log files (for example: /var/lib/docker/containers/_/_-json.log) below a default limit or delete them after reaching that size. For example, list files larger than 100MB:

```
find / -size +100MB -ls
```

To delete the mentioned log file you can use the command:

```
truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### Update the react app

To update the react app, you can use the following command:

```bash
./scripts/update-app.sh
```
