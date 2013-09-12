'use strict';

/* Controllers */

var app = angular.module('hn.controllers', ['ezfb']);

app.controller('MainCtrl', function ($scope, $FB, $location) {
    $scope.loggedIn = false;
    $scope.location;
    $scope.friends = [];
    $scope.locations = [];

    $scope.login = function () {
        $FB.login(function (res) {
            if (res.authResponse) {
                //Check status
                getStatus();
            }
        }, { scope: 'user_about_me,user_location,user_friends,friends_hometown,friends_location,read_friendlists' });
    };

    $scope.logout = function () {
        $FB.logout(function () {
            $scope.loggedIn = false;
            $location.path("/login");
        });
    };

    $scope.init = function () {
        getStatus();
    }

    function getStatus() {
        $FB.getLoginStatus(function (res) {
            $scope.loggedIn = (res.status == 'connected' && res.status != 'not_authorized');
            if ($scope.loggedIn)
                getLocation();
                $location.path("/start");
        });
    }

    function getLocation() {
        $FB.api('/me', function (res) {
            $scope.location = res.location.name;
        });

        $FB.api('/fql?q=select%20last_name,%20first_name,hometown_location,uid,pic_square%20from%20user%20where%20uid%20in%20(select%20uid2%20from%20friend%20where%20uid1%20%3D%20me())', function (res) {
            //angular.forEach(res.data, function (friend) {
            //    $scope.friends.push({ id: friend.uid, name: friend.first_name + ' ' + friend.last_name, location: friend.hometown_location });
            //});
            $scope.friends = res.data;
        });
    }
})


.controller('Login', function () {

})

.controller('Start', function ($scope, $FB) {
    //$scope.showMap = false; //Par défaut, la map n'est pas affichée

    //$scope.start = function () {
    //    //Initialisation de la map (crédits OpenStreetMap)
    //    var map = L.map('map').setView([51.505, -0.09], 13);
    //    L.tileLayer('http://{s}.tile.cloudmade.com/API-key/997/256/{z}/{x}/{y}.png', {
    //        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
    //        maxZoom: 18
    //    }).addTo(map);

    //    //Affichage de la map
    //    $scope.showMap = true;
    //}
});