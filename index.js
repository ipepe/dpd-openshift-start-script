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
		if ( typeof after_start_callback !== "undefined" ) after_start_callback();
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
