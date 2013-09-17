'use strict';

/* Controllers */

var app = angular.module('hn.controllers', ['ezfb', 'ngCookies']);


/****************************
        Principal
*****************************/

app.controller('MainCtrl', function ($scope, $FB, $location, $cookieStore) {
    $scope.loggedIn = false;
    $scope.userinfo = [];
    $scope.friends = [];
    $scope.usercity = {name: 'N/A', found: false};

    /* Connexion */
    $scope.login = function () {
        $FB.login(function (res) {
            if (res.authResponse) {
                $scope.getStatus();
            }
        }, { scope: 'user_about_me,user_location,user_friends,friends_hometown,friends_location,read_friendlists' }); //autorisations
    };

    /* Déconnexion */
    $scope.logout = function () {
        $cookieStore.put('loggedin', ''); //Suppression du cookie
        $scope.loggedIn = false;
        $location.path("/login");
    };

    /* Fonction exécutée au chargement de la page */
    $scope.init = function () {
        $scope.loggedIn = $cookieStore.get('loggedin');
        if ($scope.loggedIn)
            $scope.getStatus();
    }

    /* Récupère le statut FB. Redirige vers la page principale si tout est ok */
    $scope.getStatus = function() {
        $FB.getLoginStatus(function (res) {
            $scope.loggedIn = (res.status == 'connected' && res.status != 'not_authorized'); //check que la connexion est ok et qu'on a les droits nécessaires
            if ($scope.loggedIn) {
                //Si ok : mise en place du cookie, récupération des données et redirection vers la page principale
                $cookieStore.put('loggedin', 'true');
                $scope.getFbData();
                $location.path("/start");
            }
        });
    }

    /* Récupère les données FB (localisation de l'utilisateur et de ses amis) */
    $scope.getFbData = function() {
        $FB.api('/fql?q=select%20name,current_location,uid,pic_square%20from%20user%20where%20uid%20%3D%20me()', function (res) {
            if (res.data)
            {
                $scope.userinfo = res.data[0];
                if($scope.userinfo.current_location != undefined)
                    $scope.usercity = {name: $scope.userinfo.current_location.name, found: true};
                
                //On ne charge la liste des amis que si les données de l'utilisateur ont bien été récupérées
                $FB.api('/fql?q=select%20name,current_location,uid,pic_square%20from%20user%20where%20uid%20in%20(select%20uid2%20from%20friend%20where%20uid1%20%3D%20me())', function (res) {
                    $scope.friends = res.data;
        
                    //Prévenir que les infos ont bien été chargées
                    $scope.$broadcast('UserInfoLoaded');
                });
            }
        });
    }
})


/****************************
            Map
*****************************/

.controller('MapCtrl', function ($scope, $timeout) {
    /* Paramètres de propagation
    On va partir du principe qu'un zombie contamine en moyenne 3 personnes / heure, et que la densité moyenne de population est de 45 personnes au km².
    Bien sûr, c'est totalement faux...
    En vrai, il faudrait au minimum prendre en compte les densités de population par pays, les types de terrain, les déplacements, les actions de quarantaine et de résistance, les temps d'incubation...
    Enfin bref, OSEF quoi....
    */
    $scope.densiteMoyenne = 45;
    $scope.propSpeed = 3;
    $scope.infected = 0;
    $scope.started = false;

    /* Propriétés de la map */
    $scope.map = null;
    $scope.mapCircle = null; //Zone de contamination, représentée par un cercle sur la map
    $scope.markers = new L.MarkerClusterGroup();
    $scope.usermarker = null;

    /* Détermine quelle checkbox est cochée */
    $scope.useLoc = false;

    /* Infos amis */
    $scope.locatedFriends = 0;
    $scope.infectedFriends = [];
    $scope.lastInfectedFriend = '-';

    /* Initialisation dès que les infos de l'utilisateur ont bien été chargées */
    $scope.$on('UserInfoLoaded', function() {
        $scope.useLoc = ($scope.usercity.found ? 1 : 2);
        $scope.loadMap();
    });

    /* Initialisation de la map */
    $scope.loadMap = function () {
        if ($scope.map == null) {
            //Initialisation de la map, centrée sur l'utilisateur
            $scope.map = L.map('map', {
                center: [0, 0],
                zoom: 12,
                worldCopyJump: true
            }).on('click', function(e) {
                //Si on choisit l'option "manuelle" (et si la contamination n'a pas encore été lancée), on place le marqueur utilisateur au clic sur la map 
                if ($scope.useLoc == 2 && !$scope.started)
                    $scope.createUserMarker(e.latlng.lat, e.latlng.lng);
            });
            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; OpenStreetMap contributors',
                maxZoom: 12,
                minZoom: 3
            }).addTo($scope.map);
            
            //Ajout du marker utilisateur
            $scope.createDefaultUserMarker();

            //Ajout des markers amis
            angular.forEach($scope.friends, function (friend) {
                if (friend.current_location != undefined) {
                    $scope.locatedFriends++;
                    var popHtml = (friend.pic_square != undefined ? '<img src="' + friend.pic_square + '" /><br /><br />' : '')  + "<span>" + friend.name + "</span>";
                    $scope.createMarker(friend.current_location.latitude, friend.current_location.longitude, popHtml, 'buddy', false);
                }
            });

            //Affichage des markers
            $scope.map.addLayer($scope.markers);
        }
    }

    /* Ajout d'un marker sur la map avec icône personnalisée */
    $scope.createMarker = function(lat, lng, html, iconName, drag) {
        var CustIcon = L.Icon.extend({
            options: {
                shadowUrl: '',
                iconSize:     [32, 37],
                shadowSize:   [0, 0],
                iconAnchor:   [16, 37],
                shadowAnchor: [0, 0],
                popupAnchor:  [0, -38]
            }
        });
        var newIcon = new CustIcon({iconUrl: 'img/' + iconName + '_icon.png'});
        var marker = new L.marker([lat, lng], {icon: newIcon, draggable: drag}).bindPopup(html); //Le marqueur pourra être déplacé si on a choisi l'option "manuelle"
        $scope.markers.addLayer(marker);

        return marker; //au cas où on en aurait besoin
    }

    /* Créer le marqueur de l'utilisateur */
    $scope.createUserMarker = function(lat, lng) {
        //S'il existe déjà, on l'enlève avant de le remettre
        if ($scope.usermarker != null)
            $scope.markers.removeLayer($scope.usermarker);
        
        var userPopHtml = ($scope.userinfo.pic_square != undefined ? '<img src="' + $scope.userinfo.pic_square + '" /><br /><br />' : '') + "<span>" + $scope.userinfo.name + "</span>";
        $scope.usermarker = $scope.createMarker(lat, lng, userPopHtml, 'rad', true);

        //Recentrer la vue et réinitialiser le zoom
        $scope.map.setView([lat, lng], 12);
    }

    /* Créer le marqueur de l'utilisateur (en prenant sa position FB) */
    $scope.createDefaultUserMarker = function() {
        var userLocation = $scope.userinfo.current_location;
        if ($scope.useLoc == 1)
            $scope.createUserMarker(userLocation.latitude, userLocation.longitude);
    }

    /* Débuter l'infection */
    $scope.start = function() {
        //Initialisation de l'infection
        $scope.infected = 1; //Vous
        $scope.$broadcast('timer-start'); //On lance le timer
        $scope.started = true;

        //Dessiner le cercle de contamination
        $scope.reloadCircle();
    }

    /* Affichage de la zone de contamination (cercle) */
    $scope.reloadCircle = function () {
        if ($scope.map != null) {
            var userLocation = $scope.usermarker.getLatLng();

            //Calculer le rayon
            var rayon = $scope.infected / $scope.densiteMoyenne;

            //Dessiner le cercle s'il n'existe pas, l'agrandir sinon
            if ($scope.mapCircle == null) {
                $scope.mapCircle = L.circle([userLocation.lat, userLocation.lng], rayon, {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5
                }).addTo($scope.map);
            }
            else
                $scope.mapCircle.setRadius(rayon);

            //Vérifier chaque marqueur "ami". S'ils entrent dans la zone, modifier leur icône et afficher le nom du dernier infecté.
            $scope.markers.eachLayer(function(marker) { 
                if (marker != $scope.usermarker)
                {
                    var mapCircleBounds = $scope.mapCircle.getBounds();
                    var markerCoords = marker.getLatLng();
                    if (mapCircleBounds.contains(markerCoords) && $scope.infectedFriends.indexOf(marker) == -1)
                    {
                        marker.setIcon(L.icon({
                            iconUrl: 'img/zombie_icon.png',
                            shadowUrl: '',
                            iconSize:     [32, 37],
                            shadowSize:   [0, 0],
                            iconAnchor:   [16, 37],
                            shadowAnchor: [0, 0],
                            popupAnchor:  [0, -38]
                        }));
                        $scope.infectedFriends.push(marker);
                        $scope.lastInfectedFriend = $(marker._popup._content).text(); //Un peu crade, pour récupérer le nom de l'ami
                    }
                }
            });

            //On adapte le niveau de zoom à la taille du cercle, sans dépasser le niveau de zoom minimum
            if ($scope.map.getZoom() > $scope.map.getMinZoom())
                $scope.map.fitBounds($scope.mapCircle.getBounds());
        }
    }

    /* Toutes les secondes, on va redessiner le cercle comme si 1h réelle s'était écoulée */
    $timeout(function contamine() {

        if ($scope.mapCircle == null)
        {
            $timeout(contamine, 1000);
        }
        else
        {
            //Recalcul du nombre de personnes infectées après 1h
            $scope.infected = $scope.infected * $scope.propSpeed;

            var mapCircleBounds = $scope.mapCircle.getBounds();
            var mapBounds = $scope.map.getBounds();
            //On définit un rectangle, dont la longueur est celle de la map, et la largeur celle du cercle
            mapBounds.extend(new L.LatLng(mapCircleBounds.getNorth(), mapCircleBounds.getCenter().lng))
                     .extend(new L.LatLng(mapCircleBounds.getSouth(), mapCircleBounds.getCenter().lng));

            //On agrandit et redessine le cercle tant que celui-ci tient sur le map, à son niveau de zoom minimum
            if (mapBounds.contains(mapCircleBounds)) {
                $scope.reloadCircle();
                $timeout(contamine, 1000);
            }
            else {
                $scope.$broadcast('timer-stop');
            }
        }
    }, 1000);
});