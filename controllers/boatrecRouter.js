var app = angular
  .module('boatrec', [
    'ngRoute'
  ])

  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '../views/admin.html',
        controller: 'boatrecController'
      })
      .when('/geo', {
        templateUrl: '../views/geo.html',
        controller: 'boatrecController'
      })
      .when('/dbtest', {
        templateUrl: '../views/dbtest.html',
        controller: 'boatrecController'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
