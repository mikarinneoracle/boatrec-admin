app.controller('boatrecController', function($location, $http, $rootScope, $scope, $routeParams, $interval, $timeout)
{
	$scope.dbtestuser = null;

	if($location.path() == '/')
	{
		var data = [];
        $http.get('/data').success(function(response, err) {
            for(var i = 0; i < response['data'].length; i++) {
                var row = {};
                row.key1 = response['data'][i].key1;
                row.key2 = response['data'][i].key2;
                row.key3 = response['data'][i].key3;
                row.key4 = response['data'][i].key4;
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
