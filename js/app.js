'use strict';


// Declare app level module which depends on filters, and services
angular.module('hn', ['hn.filters', 'hn.services', 'hn.directives', 'hn.controllers', 'ezfb']).
  config(function ($routeProvider, $FBProvider) {
      $routeProvider.when('/login', { templateUrl: 'partials/login.html', controller: 'Login' });
      $routeProvider.when('/start', { templateUrl: 'partials/start.html', controller: 'Start' });
      $routeProvider.otherwise({ redirectTo: '/login' });

      $FBProvider.setInitParams({
          appId: '145337779008834'
      });
  });
