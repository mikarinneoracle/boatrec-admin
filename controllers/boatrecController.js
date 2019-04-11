app.controller('boatrecController', function($location, $http, $rootScope, $scope, $routeParams, $interval, $timeout)
{
	$scope.dbtestuser = null;
    $scope.data = {};
    $scope.data.uuid = 'urn:mrn:signalk:uuid:3a528d02-e2a1-4e1a-86b9-4de94433543f';

	if($location.path() == '/')
	{
		var data = [];
        $http.get('/data').success(function(response, err) {
            var s = JSON.stringify(response);
            var s2 = replaceAll(s, $scope.data.uuid, 'uuid');
            response = JSON.parse(s2);
            for(var i = 0; i < response.length; i++) {
                console.log(response[i]);
                var row = {};
                row.navigation  = response[i].uuid.navigation;
                row.performance = response[i].uuid.performance;
                row.environment = response[i].uuid.environment;
                data.push(row);
            }
            $scope.boatrecData = data;
        });
	}
    
    $scope.testconnection = function() {
        $http.get('/testconnection').success(function(response, err) {
            console.log(response);
            $scope.dbtestuser = response.user;
        });
    }
    
    $scope.setUuid = function(uuid) {
        $scope.data.uuid = uuid;
        console.log($scope.data.uuid);
        var data = [];
        $http.get('/data').success(function(response, err) {
            var s = JSON.stringify(response);
            var s2 = replaceAll(s, $scope.data.uuid, 'uuid');
            response = JSON.parse(s2);
            for(var i = 0; i < response.length; i++) {
                console.log(response[i]);
                var row = {};
                row.navigation  = response[i].uuid.navigation;
                row.performance = response[i].uuid.performance;
                row.environment = response[i].uuid.environment;
                data.push(row);
            }
            $scope.boatrecData = data;
        });
    }
    
});

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
