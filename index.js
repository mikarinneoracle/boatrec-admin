var http = require('http');
var oracledb = require('oracledb');
var dbConfig = require('./dbconfig.js'); let error;
console.log("starting");
console.log(dbConfig);
let user;
    oracledb.getConnection({
        user: dbConfig.dbuser,
        password: dbConfig.dbpassword,
    },
    function(err, connection) {
        if (err) {
            error = err;
            console.log(error);
            console.log("Exiting..");
return; }
connection.execute('select user from dual', [], function(err, result) {
            if (err) {
                error = err;
return; }
user = result.rows[0][0];
console.log('Check to see if your database connection worked at  http://localhost:4001/');
            error = null;
connection.close(function(err) { if (err) {
                    console.log(err);
                }
}); })
} );
http.createServer(function(request, response) { response.writeHead(200, {
        'Content-Type': 'text/plain'
    });
if (error === null) {
response.end('Connection test succeeded. You connected to ATP as ' + user + '!');
} else if (error instanceof Error) {
response.write('Connection test failed. Check the settings and redeploy app!\n');
        response.end(error.message);
    } else {
response.end('Connection test pending. Refresh after a few seconds...');
    }
}).listen(4001);
