'use strict';

/* Directives */

var app = angular.module('hn.directives', []);

/* Timer (largement inspir� d'Angular Timer par Siddique Hameed http://siddii.github.io/angular-timer/) */
app.directive('timer', function ($compile) {
    return  {
        restrict: 'E',
        replace: false,
        scope: {
            oneSecondAttr: '@oneSecond' //Utilis� pour dire qu'une seconde r�elle doit �tre consid�r�e comme x secondes par le timer
        },
        controller: function ($scope, $element) {
            //Si l'�l�ment est utilis� vide, on affichera des millisecondes
            if ($element.html().trim().length === 0) {
                $element.append($compile('<span>{{millis}}</span>')($scope));
            }

            $scope.startTime = null;
            $scope.timeoutId = null;
            $scope.isRunning = false;
            $scope.oneSecondAs = $scope.oneSecondAttr && parseInt($scope.oneSecondAttr, 10) > 0 ? parseInt($scope.oneSecondAttr, 10) : undefined;

            $scope.$on('timer-start', function () {
                $scope.start();
            });

            $scope.$on('timer-resume', function () {
                $scope.resume();
            });

            $scope.$on('timer-stop', function () {
                $scope.stop();
            });

            /* R�initialisation du timeout */
            function resetTimeout() {
                if ($scope.timeoutId) {
                    clearTimeout($scope.timeoutId);
                }
            }

            //D�marrage du timer
            $scope.start = function () {
                $scope.startTime = new Date();
                $scope.oneSecondAs = $scope.oneSecondAttr && parseInt($scope.oneSecondAttr, 10) > 0 ? parseInt($scope.oneSecondAttr, 10) : undefined;
                resetTimeout();
                tick();
            };

            //Reprise du timer apr�s pause
            $scope.resume = function () {
                resetTimeout();
                $scope.startTime = new Date() - ($scope.stoppedTime - $scope.startTime);
                tick();
            };

            //Arr�t du timer
            $scope.stop = $scope.pause = function () {
                $scope.stoppedTime = new Date();
                resetTimeout();
                $scope.$emit('timer-stopped', {millis: $scope.millis, seconds: $scope.seconds, minutes: $scope.minutes, hours: $scope.hours, days: $scope.days});
                $scope.timeoutId = null;
            };

            $element.bind('$destroy', function () {
                resetTimeout();
            });

            //Calcule des jours / heures / minutes / secondes �coul�es
            function calculateTimeUnits() {
                $scope.seconds = Math.floor(($scope.millis / 1000) % 60);
                $scope.minutes = Math.floor((($scope.millis / (60000)) % 60));
                $scope.hours = Math.floor((($scope.millis / (3600000)) % 24));
                $scope.days = Math.floor((($scope.millis / (3600000)) / 24));
            }

            //Initialisation
            $scope.millis = 0;
            calculateTimeUnits();

            //Ex�cut�e � chaque "tick" du timer
            var tick = function () {
                $scope.millis = new Date() - $scope.startTime;
                var adjustment = $scope.millis % 1000;

                if ($scope.oneSecondAs) {
                    $scope.millis *= $scope.oneSecondAs;
                }

                calculateTimeUnits();

                $scope.timeoutId = setTimeout(function () {
                    tick();
                    $scope.$apply();
                }, $scope.interval - adjustment);

                $scope.$emit('timer-tick', {timeoutId: $scope.timeoutId, millis: $scope.millis});
            };
        }
    };
});
