'use strict';

/* Configuration générale */

angular.module('hn', ['hn.filters', 'hn.services', 'hn.directives', 'hn.controllers', 'ezfb']).
  config(function ($routeProvider, $FBProvider) {

      //Routes
      $routeProvider.when('/login', { templateUrl: 'partials/login.html' });
      $routeProvider.when('/start', { templateUrl: 'partials/start.html', controller: 'MapCtrl' });
      $routeProvider.otherwise({ redirectTo: '/login' });

      //Initialisation SDK Facebook
      $FBProvider.setInitParams({
          appId: '145337779008834'
      });

  });
