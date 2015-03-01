# dpd-openshift-start-script
My own, universal start script for developing on my computer and no changes needs to be done to make it work on openshift.

# credits
Based on code: schettino72

http://blog.schettino72.net/posts/mongodb-setup-deployd-heroku.html

# pre-usage
Install mongodb:

http://docs.mongodb.org/manual/installation/

You should have configured database with login/pass/database name: deployd/deployd/deployd. To configure run in bash:
```bash
mongo shell
```

create user deployd with password deployd in database name: deployd
```javascript
use admin
db.addUser( { user: "deployd", pwd: "deployd", roles: [ "userAdminAnyDatabase" ] } )
use deployd
db.addUser( { user: "deployd", pwd: "deployd", roles: [ "readWrite", "dbAdmin" ] } )
```

# usage

You should have mongoDB running in background as a service or in separate terminal window with 
```bash
sudo mongod
```

Example code in unix terminal:
```bash
mkdir testproject
cd testproject
npm init
npm i deployd --save
npm i dpd-openshift-start-script --save
node dpd-openshift-start-script\server.js
```

# code
```javascript
//Author: Patryk "ipepe" Ptasiński npm@ipepe.pl, credit to: schettino72
// ==================== Load dependencies
var deployd = require('deployd');
var url = require('url');
// ==================== Server Envs
var server_env = process.env.NODE_ENV || 'development';
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
// ==================== Database Envs
var db_ip_address = process.env.OPENSHIFT_MONGODB_DB_HOST || server_ip_address;
// OPENSHIFT DB ADDRESS
var db_url_address = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://deployd:deployd@'+db_ip_address+':27017/deployd';
// HEROKU DB ADDRESS
// var db_url_address = process.env.MONGOHQ_URL || 'mongodb://deployd:deployd@'+db_ip_address+':27017/deployd';
var db_parsed_url = url.parse(db_url_address);
// ==================== Output current app config
console.log(server_env);
console.log(server_ip_address + ':' + server_port);
console.log(db_url_address);
// ==================== Configure DeployD instance
var server = deployd({
	port: server_port,
	env: server_env,
	db: {
		host: db_parsed_url.hostname,
		port: parseInt(db_parsed_url.port),
		name: db_parsed_url.pathname.slice(1),
		credentials: {
			username: db_parsed_url.auth.split(':')[0],
			password: db_parsed_url.auth.split(':')[1]
		}
	}
});
// ==================== Listen
server.listen(server_port, server_ip_address);
server.on('listening', function() {
	console.log("Server is listening");
});
// ==================== Catch Errors
server.on('error', function(err) {
	console.error(err);
	// Give the server a chance to return an error
	process.nextTick(function() {
		process.exit();
	});
});
```