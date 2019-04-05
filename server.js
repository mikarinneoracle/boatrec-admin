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

app.post('/uploadrecording', function(req, res) {
    //data.push(req.body.recordedData);
    console.log("Uploading recording ... ");
    console.log(req.body.recordedData);
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
            if(req.body.recordedData)
            { 
                var s = JSON.stringify(req.body.recordedData);
                connection.execute(
                    'INSERT INTO j_boatrec (recording) VALUES (:bv)',
                    [s], // bind the JSON string for inserting into the JSON column. 
                    { autoCommit: true }, function(err) {
                        if (err) {
                            var response = {};
                            response.error = err;
                            res.send(JSON.stringify(response));
                        } else {
                            connection.close(function(err) {
                                if (err) {
                                    console.log(err);
                                    var response = {};
                                    response.error = err;
                                    res.send(JSON.stringify(response));
                                } else {
                                    var response = {};
                                    response.success = "Data inserted successfully.";
                                    res.send(JSON.stringify(response));
                                }
                            });
                        }
                });
            } else {
                connection.close(function(err) {
                    if (err) {
                        console.log(err);
                        var response = {};
                        response.error = err;
                        res.send(JSON.stringify(response));
                    } else {
                        var response = {};
                        response.fail = "'recordedData' not found in POST data.";
                        res.send(JSON.stringify(response));
                    }
                });
            }
        }
    });
});

app.get('/data', function(req, res) {
    console.log("Getting recordings ... ");
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
            connection.execute(
                'SELECT * FROM j_boatrec_view',
                function(err, result) {
                    if (err) {
                        var response = {};
                        response.error = err;
                        res.send(JSON.stringify(response));
                    } else {
                        console.log("Data read successfully.");
                        console.log(result);
                        connection.close(function(err) {
                            if (err) {
                                console.log(err);
                                var response = {};
                                response.error = err;
                                res.send(JSON.stringify(response));
                            } else {
                                var response = {};
                                console.log("rows found " + result.rows.length);
                                //response.data = result.rows;
                                // let's loop thru the result set
                                response.data = [];
                                for(var i=0; i < result.rows.length; i++)
                                {
                                    console.log(result.rows[i]);
                                    response.data.push(result.rows[i]);
                                }
                                res.send(JSON.stringify(response));
                            }
                        });
                    }
            });
        }
    });
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
                connection.close(function(err) {
                    if (err) {
                        console.log(err);
                        var response = {};
                        response.error = err;
                        res.send(JSON.stringify(response));
                    } else {
                        console.log(user);
                        var response = {};
                        response.user = user;
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

var doconstraintdrop = function (conn, cb) {
    conn.execute(
    `BEGIN
        EXECUTE IMMEDIATE 'ALTER TABLE j_boatrec DROP CONSTRAINT ensure_rec_json'; EXCEPTION WHEN OTHERS THEN
        IF SQLCODE <> -942 THEN
                 RAISE;
               END IF;
    END;`,
    function(err) {
      if (err) {
        return cb(err, conn);
      } else {
        console.log("Constraint ensure_rec_json dropped."); return cb(null, conn);
      }
    });
};

var dodrop = function (conn, cb) {
    conn.execute(
    `BEGIN
        EXECUTE IMMEDIATE 'DROP TABLE j_boatrec'; EXCEPTION WHEN OTHERS THEN
        IF SQLCODE <> -942 THEN
                 RAISE;
               END IF;
    END;`,
    function(err) {
      if (err) {
        return cb(err, conn);
      } else {
        console.log("Table j_boatrec dropped."); return cb(null, conn);
      }
    });
};

var docreate = function (conn, cb) {
    conn.execute(
    `CREATE TABLE j_boatrec (
        recording VARCHAR2(4000) CONSTRAINT ensure_rec_json CHECK (recording IS JSON),
        image CLOB
    )`,
    function(err) {
      if (err) {
        return cb(err, conn);
      } else {
        console.log("Table j_boatrec and constraint ensure_rec_json created");
        return cb(null, conn);
      }
    });
};

var docreateview = function (conn, cb) {
    conn.execute(
    `CREATE VIEW j_boatrec_view AS SELECT rec.recording.key1, rec.recording.key2 FROM j_boatrec rec`,
    function(err) {
      if (err) {
        return cb(err, conn);
      } else {
        console.log("View j_boatrec_view created");
        return cb(null, conn);
      }
    });
};

app.get('/createdb', function(req, res) {
  async.waterfall(
  [
    doconnect,
    doconstraintdrop,
    dodrop,
    docreate,
    docreateview
  ],
  function (err, conn) {
    if (err) { 
        console.error("In waterfall error: ==>", err, "<==");
    }
    if (conn)
    {
        dorelease(conn);
    }
  });
});
