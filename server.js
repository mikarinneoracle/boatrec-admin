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

var insertRow = function (data, key, count, callback)
{
    oracledb.getConnection({
                user: dbConfig.dbuser,
                password: dbConfig.dbpassword,
                connectString: dbConfig.connectString
            },
            function(err, connection) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('=========================================');
                    console.log("Inserting row " + count + " key:" + key);
                    console.log(data);
                    console.log('=========================================');
                    connection.execute(
                        'INSERT INTO j_boatrec (recording) VALUES (:bv)',
                        [data], // bind the JSON string for inserting into the JSON column. 
                        { autoCommit: true }, function(err) {
                            if (err) {
                                var response = {};
                                console.log(err);
                                console.log("===> INSERT error");
                                callback(false);
                            } else {
                                connection.close(function(err) {
                                    if (err) {
                                        console.log("===> connection close error");
                                        console.log(err);
                                        callback(false);
                                    } else {
                                        console.log("======= ALL OK ========= ");
                                        callback(true);
                                    }
                                });
                            }
                    });
                }            
            });
}

app.post('/uploadrecording', function(req, res) {
    var uuid = 'urn:mrn:signalk:uuid:3a528d02-e2a1-4e1a-86b9-4de94433543f';  
    console.log("Uploading recording ... ");
    console.log(req.body);
    if(req.body.sensorData)
    { 
        console.log("parsing ... ");
        var data = req.body.sensorData;
        var keys = Object.keys(data);
        console.log(keys);
        var error;
        var count = 0;
        for(i=0; i < keys.length; i++) 
        {
            var s = JSON.stringify(data[keys[i]]);
            console.log(keys[i] + " ===> ");
            console.log(s);
            var s2 = "";
            if(s.indexOf(uuid))
            {
                s2 = replaceAll(s, uuid, 'uuid');
                    
            } else {
                s2 = s;
            }
            insertRow(s2, keys[i], i+1, function(result) {
                count++;
                if(!result)
                {
                    console.log("Error!");
                    var response = {};
                    response.fail = "Error inserting data.";
                    res.send(response);
                } else if(count >= keys.length)
                {
                    console.log("Rows inserted = " + count);
                    var response = {};
                    response.success = "Data inserted successfully. Rows = " + count;
                    res.send(response);       
                }
            });
        }
    } else {
        var response = {};
        response.fail = "'sensorData' not found in POST data.";
        res.send(response);
    }
});

app.post('/uploadgeo', function(req, res) {
    console.log("Uploading geo json ... ");
    console.log(req.body);
    if(req.body.sensorData)
    { 
        console.log("parsing ... ");
        var data = JSON.stringify(req.body.sensorData);
        insertRow(data, 'geoData', 1, function(result) {
            if(!result)
            {
                var response = {};
                response.fail = "Error inserting geo data.";
                res.send(response);
            } else {
                var response = {};
                response.success = "Geo data inserted successfully.";
                res.send(response);   
            }
        });
    } else {
        var response = {};
        response.fail = "'sensorData' not found in POST data.";
        res.send(response);
    }
});

app.post('/uploadmultiple', function(req, res) {
    console.log("Uploading recording ... ");
    console.log(req.body);
    if(req.body.sensorData)
    { 
        console.log("parsing ... ");
        var data = req.body.sensorData.features;
        var keys = Object.keys(data);
        console.log(keys);
        var error;
        var count = 0;
        for(i=0; i < keys.length; i++) 
        {
            var s = JSON.stringify(data[keys[i]]);
            console.log(keys[i] + " ===> ");
            console.log(s);
            insertRow(s, keys[i], i+1, function(result) {
                count++;
                if(!result)
                {
                    console.log("Error!");
                    var response = {};
                    response.fail = "Error inserting data.";
                    res.send(response);
                } else if(count >= keys.length)
                {
                    console.log("Rows inserted = " + count);
                    var response = {};
                    response.success = "Data inserted successfully. Rows = " + count;
                    res.send(response);       
                }
            });
        }
    } else {
        var response = {};
        response.fail = "'sensorData' not found in POST data.";
        res.send(response);
    }
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
                                console.log('=========================================');
                                console.log(JSON.stringify(response.data));
                                res.setHeader("Content-Type", "application/json");
                                res.send(response.data);
                            }
                        });
                    }
            });
        }
    });
});

app.get('/geodata', function(req, res) {
    console.log("Getting geo data ... ");
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
                                    var data = JSON.parse(result.rows[i]);
                                    if(data.type && data.geometry && data.properties)
                                    {
                                        console.log("IS GEO");
                                        console.log(data);
                                        response.data.push(data);
                                    }
                                }
                                console.log('================ GEO =========================');
                                console.log(JSON.stringify(response.data));
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
    `CREATE VIEW j_boatrec_view AS SELECT rec.recording.navigation, rec.recording.performance, rec.recording.environment FROM j_boatrec rec`,
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

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

