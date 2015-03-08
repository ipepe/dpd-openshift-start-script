# dpd-openshift-start-script
Node module that wrap around configuring and starting deployd instance on localhost and openshift in a lazy way.

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

# usage for v2.x
MongoDB start (or have you should have it running as a service)

```bash
sudo mongod
```

Create an index.js file in Your project:

```javascript
// ==================== Load/start dependencies
var deployd_setup = require('dpd-openshift-start-script');
var deployd_instance = deployd_setup(); //starting deployd server, also this object contains everything included into starting server
var colors = deployd_instance.colors; //colors dependency

//...
console.log('You started deployd server by: ' + colors.magenta('dpd-openshift-start-script'));

```

Objects returned:
```javascript
module.exports = function () {
	return {
		deployd: server,
		server_env: server_env,
		server_port: server_port,
		server_ip_address: server_ip_address,
		db_ip_address: db_ip_address,
		db_url_address: db_url_address,
		colors: colors };
};
```

# usage for v1.x

You should have mongoDB running in background as a service or in separate terminal window with 
```bash
sudo mongod
```

Example code in unix terminal:
```bash
mkdir testproject
cd testproject
touch server.js
npm init
npm i deployd --save
npm i dpd-openshift-start-script --save
cp node_modules/dpd-openshift-start-script/server.js  ./
mkdir resources
node server.js
```

# code inside v2.0
```javascript
//Author: Patryk "ipepe" Ptasiński npm@ipepe.pl, credit to: schettino72
// ==================== Load dependencies
var deployd = require('deployd');
var internalClient = require('deployd/lib/internal-client');
var url = require('url');
var colors = require('colors');
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
console.log( colors.yellow(server_env) );
console.log( colors.yellow(server_ip_address + ':' + server_port) );
console.log( colors.yellow(db_url_address) );
// ==================== Configure DeployD instance
var dpd_ic;
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
	dpd_ic = internalClient.build(process.server);
	console.log( colors.green('Server is listening') );
});
// ==================== Catch Errors
server.on('error', function(err) {
	console.error( colors.red(err) );
	// Give the server a chance to return an error
	process.nextTick(function() {
		process.exit();
	});
});

module.exports = function () {
	return {
		deployd: server,
		dpd_ic: dpd_ic,
		server_env: server_env,
		server_port: server_port,
		server_ip_address: server_ip_address,
		db_ip_address: db_ip_address,
		db_url_address: db_url_address,
		colors: colors };
};

```