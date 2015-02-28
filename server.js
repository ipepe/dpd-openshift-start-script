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
var db_url_address = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://deployd:deployd@'+db_ip_address+':27017/';
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