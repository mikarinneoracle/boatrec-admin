app.controller('boatrecController', function($location, $http, $rootScope, $scope, $routeParams, $interval, $timeout)
{
	$scope.dbtestuser = null;

	if($location.path() == '/')
	{
		var data = [];
        $http.get('/data').success(function(response, err) {
            for(var i = 0; i < response.length; i++) {
                var row = {};
                row.data = response[i].urn:mrn:signalk:uuid:3a528d02-e2a1-4e1a-86b9-4de94433543f;
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
