'use strict';

/* Controllers */

var app = angular.module('hn.controllers', ['ezfb']);

app.controller('MainCtrl', function ($scope, $FB, $location) {
    $scope.loggedIn = false;

    $scope.login = function () {
        $FB.login(function (res) {
            if (res.authResponse) {
                $scope.loggedIn = true;
                $location.path("/start");
            }
        }, { scope: 'user_about_me,user_location,user_friends,friends_hometown,friends_location,read_friendlists' });
    };

    $scope.logout = function () {
        $FB.logout(function () {
            $scope.loggedIn = false;
            $location.path("/login");
        });
    };

    $scope.getStatus = function() {
        $FB.getLoginStatus(function (res) {
            $scope.loggedIn = (res.status == 'connected' && res.status != 'not_authorized');
        });
    }
})


.controller('Login', function () {

})

.controller('Start', function ($scope, $FB) {
    $scope.showMap = false; //Par défaut, la map n'est pas affichée
    $scope.location = '';

    $scope.getLocation = function () {
        $FB.api('/me', function (res) {
            $scope.location = res.location.name;
        });
    }

    $scope.start = function () {
        //Initialisation de la map (crédits OpenStreetMap)
        var map = L.map('map').setView([51.505, -0.09], 13);
        L.tileLayer('http://{s}.tile.cloudmade.com/API-key/997/256/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
            maxZoom: 18
        }).addTo(map);

        //Affichage de la map
        $scope.showMap = true;
    }
});