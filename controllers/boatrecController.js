app.controller('boatrecController', function($location, $http, $rootScope, $scope, $routeParams, $interval, $timeout)
{
	$scope.dbtestuser = null;

	if($location.path() == '/')
	{
		var data = [];
        $http.get('/data').success(function(response, err) {
            for(var i = 0; i < response['data'].length; i++) {
                console.log(response['data'][i]);
                var row = {};
                row.sensorData = response['data'][i];
                console.log(Object.keys(row.sensorData));
                console.log(Object.values(row.sensorData));
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
    
});
