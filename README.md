# dpd-openshift-start-script
Node module that wrap around configuring and starting deployd instance on localhost and openshift in a lazy way.

Author: Patryk "ipepe" Ptasiński

Mail:		npmjs@ipepe.pl

# credits
Based on code: schettino72
http://blog.schettino72.net/posts/mongodb-setup-deployd-heroku.html

# license
Apache License v2

# changelog

- v2.3.0 - added callback so You know when Deployd is started. Useful for using dpd-internalClient, added changelog to readme
- v2.2.0 - refactored exporting of object, adjusted readme
- v2.1.0 - added dpd-internalClient into returned object
- v2.0.0 - first version of creating real module with export
- v1.1.0 - added optional heroku env strings to uncomment
- v1.0.0 - project started

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
var deployd_instance = deployd_setup(deploydStartedCallback);
var colors = deployd_instance.colors;

function deploydStartedCallback(){
	//some code that requires deployd, maybe some operations on dpd-internalClient?
	console.log('You started deployd server by: ' + colors.magenta('dpd-openshift-start-script'));
	deployd_instance.dpd_ic.logger.post( {time: Date.now(), body: "Deployd server started"}, console.log)
}
```

Objects returned:
```javascript
deployd_instance.deployd = require('deployd');
deployd_instance.internalClient = require('deployd/lib/internal-client');
deployd_instance.url = require('url');
deployd_instance.colors = require('colors');
deployd_instance.server_env = process.env.NODE_ENV || 'development';
deployd_instance.server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
deployd_instance.server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
deployd_instance.db_ip_address = process.env.OPENSHIFT_MONGODB_DB_HOST || deployd_instance.server_ip_address;
deployd_instance.db_url_address = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://deployd:deployd@'+deployd_instance.db_ip_address+':27017/deployd';
deployd_instance.db_parsed_url = deployd_instance.url.parse(deployd_instance.db_url_address);

deployd_instance.server = deployd_instance.deployd({
	port: deployd_instance.server_port,
	env: deployd_instance.server_env,
	db: {
		host: deployd_instance.db_parsed_url.hostname,
		port: parseInt(deployd_instance.db_parsed_url.port),
		name: deployd_instance.db_parsed_url.pathname.slice(1),
		credentials: {
			username: deployd_instance.db_parsed_url.auth.split(':')[0],
			password: deployd_instance.db_parsed_url.auth.split(':')[1]
		}
	}
});
//internal client is not defined until deployd server starts, You shouldn't use it before my script runs Your callback.
deployd_instance.dpd_ic = deployd_instance.internalClient.build(process.server);

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

# code inside v2.3
```javascript
//Author: Patryk "ipepe" Ptasiński npm@ipepe.pl, credit to: schettino72
module.exports = function (after_start_callback) {
	var deployd_instance = {};
	deployd_instance.deployd = require('deployd');
	deployd_instance.internalClient = require('deployd/lib/internal-client');
	deployd_instance.url = require('url');
	deployd_instance.colors = require('colors');
	// ==================== Server Envs
	deployd_instance.server_env = process.env.NODE_ENV || 'development';
	deployd_instance.server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
	deployd_instance.server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
	// ==================== Database Envs
	deployd_instance.db_ip_address = process.env.OPENSHIFT_MONGODB_DB_HOST || deployd_instance.server_ip_address;
	// OPENSHIFT DB ADDRESS
	deployd_instance.db_url_address = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://deployd:deployd@'+deployd_instance.db_ip_address+':27017/deployd';
	// HEROKU DB ADDRESS
	// var db_url_address = process.env.MONGOHQ_URL || 'mongodb://deployd:deployd@'+deployd_instance.db_ip_address+':27017/deployd';
	deployd_instance.db_parsed_url = deployd_instance.url.parse(deployd_instance.db_url_address);
	// ==================== Output current app config
	console.log( deployd_instance.colors.yellow(deployd_instance.server_env) );
	console.log( deployd_instance.colors.yellow(deployd_instance.server_ip_address + ':' + deployd_instance.server_port) );
	console.log( deployd_instance.colors.yellow(deployd_instance.db_url_address) );
	// ==================== Configure DeployD instance
	deployd_instance.server = deployd_instance.deployd({
		port: deployd_instance.server_port,
		env: deployd_instance.server_env,
		db: {
			host: deployd_instance.db_parsed_url.hostname,
			port: parseInt(deployd_instance.db_parsed_url.port),
			name: deployd_instance.db_parsed_url.pathname.slice(1),
			credentials: {
				username: deployd_instance.db_parsed_url.auth.split(':')[0],
				password: deployd_instance.db_parsed_url.auth.split(':')[1]
			}
		}
	});
	// ==================== Listen
	deployd_instance.server.listen(deployd_instance.server_port, deployd_instance.server_ip_address);
	deployd_instance.server.on('listening', function() {
		deployd_instance.dpd_ic = deployd_instance.internalClient.build(process.server);
		console.log( deployd_instance.colors.green('Server is listening') );
		if ( typeof after_start_callback !== undefined ) after_start_callback();
	});
	// ==================== Catch Errors
	deployd_instance.server.on('error', function(err) {
		console.error( deployd_instance.colors.red(err) );
		// Give the server a chance to return an error
		process.nextTick(function() {
			process.exit();
		});
	});
	return deployd_instance;
};

```
