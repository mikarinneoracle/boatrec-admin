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

//return an array of values that match on a certain key
function getValues(obj, key) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getValues(obj[i], key));
        } else if (i == key) {
            console.log(obj[i]);
            objects.push(obj[i]);
        }
    }
    return objects;
}

app.post('/uploadrecording', function(req, res) {
    console.log("Uploading recording ... ");
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
            console.log(req.body);
            if(req.body.sensorData)
            { 
                console.log("parsing ... ");
                var data = req.body.sensorData;
                var keys = Object.keys(data);
                console.log(keys);
                for (i in keys) {
                    var s = JSON.stringify(data[i]);
                    console.log(s);
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
                }
            } else {
                connection.close(function(err) {
                    if (err) {
                        console.log(err);
                        var response = {};
                        response.error = err;
                        res.send(JSON.stringify(response));
                    } else {
                        var response = {};
                        response.fail = "'sensorData' not found in POST data.";
                        res.send(response);
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
                'SELECT recording FROM j_boatrec', // WHERE JSON_EXISTS (recording, "$.key1")',
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
                                    var data = {};
                                    data = JSON.parse(result.rows[i]);
                                    data.id = i + 1;
                                    response.data.push(data);
                                }
                                console.log(response.data);
                                res.setHeader("Content-Type", "application/json");
                                res.send(response.data);
                            }
                        });
                    }
            });
        }
    });
});

app.get('/posts', function(req, res) {
    request('http://jsonplaceholder.typicode.com/posts', function (error, response, body) {
        if(!error && response)
        {
            res.setHeader("Content-Type", "application/json");
            res.send(body);
        } else {
            var response = {};
            response.error = error;
            res.send(JSON.stringify(response));
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

var dodropview = function (conn, cb) {
    conn.execute(
    `BEGIN
        EXECUTE IMMEDIATE 'DROP VIEW j_boatrec_view'; EXCEPTION WHEN OTHERS THEN
        IF SQLCODE <> -942 THEN
                 RAISE;
               END IF;
    END;`,
    function(err) {
      if (err) {
        return cb(err, conn);
      } else {
        console.log("View j_boatrec_view dropped."); return cb(null, conn);
      }
    });
};

var docreate = function (conn, cb) {
    conn.execute(
    `CREATE TABLE j_boatrec (
        recording VARCHAR2(32000) CONSTRAINT ensure_rec_json CHECK (recording IS JSON),
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
  /*
  var response = {};
  response.success = "Creating database.";
  res.send(JSON.stringify(response));
  */
  async.waterfall(
  [
    doconnect,
    doconstraintdrop,
    dodrop,
    dodropview,
    docreate,
    docreateview
  ],
  function (err, conn) {
    if (err) { 
        console.error("In waterfall error: ==>", err, "<==");
    } else {
        console.log("Database created succesfully.");
    }
    if (conn)
    {
        dorelease(conn);
    }
  });
});
