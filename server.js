var async = require('async');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var oracledb = require('oracledb');
var dbConfig = require('./dbconfig.js');
var port = 3000; //process.env.PORT || process.env.npm_package_config_port;
var app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname));

var data = [];

app.listen(port, function() {
  	console.log('server listening on port ' + port);
});

app.post('/uploadRecording', function(req, res) {
    data.push(req.body.recordedData);
    console.log(req.body.recordedData);
    var response = {};
    res.send(JSON.stringify(response));
});

app.get('/data', function(req, res) {
    console.log(data);
    var response = {};
    response.data = data;
    res.send(JSON.stringify(response));
});

app.get('/testconnection', function(req, res) {
    oracledb.getConnection({
        user: dbConfig.dbuser,
        password: dbConfig.dbpassword,
        connectString: dbConfig.connectString
    },
    function(err, connection) {
        if (err) {
            console.log(err);
            var response = {};
            response.error = err;
            res.send(JSON.stringify(response));
        } else {    
            connection.execute('select user from dual', [], function(err, result) {
                if (err) {
                    var response = {};
                    response.error = err;
                    res.send(JSON.stringify(response));
                }
                var user = result.rows[0][0];
                console.log(user);
                var response = {};
                response.user = user;
                res.send(JSON.stringify(response));
                connection.close(function(err) {
                    if (err) {
                        console.log(err);
                        var response = {};
                        response.error = err;
                        res.send(JSON.stringify(response));
                    }
                });
            });
        }
    });
});

var doconnect = function(cb) {
    oracledb.getConnection({
        user: dbConfig.dbuser,
        password: dbConfig.dbpassword, connectString: dbConfig.connectString
        },
    cb
)};

var dorelease = function(conn) {
  conn.close(function (err) {
    if (err)
      console.error(err.message);
    });
};

var dodrop = function (conn, cb) {
    conn.execute(
    `BEGIN
        EXECUTE IMMEDIATE 'ALTER TABLE j_boatrec DROP CONSTRAINT ensure_json';
        EXECUTE IMMEDIATE 'DROP TABLE j_boatrec'; EXCEPTION WHEN OTHERS THEN
        IF SQLCODE <> -942 THEN
                 RAISE;
               END IF;
    END;`,
    function(err) {
      if (err) {
        return cb(err, conn);
      } else {
        console.log("Table dropped"); return cb(null, conn);
      }
    });
};

var docreate = function (conn, cb) {
    conn.execute(
    `CREATE TABLE j_boatrec (
        recording VARCHAR2(4000) CONSTRAINT ensure_json CHECK (recording IS JSON),
        image CLOB
    )`,
    function(err) {
      if (err) {
        return cb(err, conn);
      } else {
        console.log("Table created");
        return cb(null, conn);
      }
    });
};

app.get('/createdb', function(req, res) {
  async.waterfall(
  [
    doconnect,
    dodrop,
    docreate
  ],
  function (err, conn) {
    if (err) { 
        console.error("In waterfall error cb: ==>", err, "<==");
    }
    if (conn)
    {
        dorelease(conn);
    }
  });
});
