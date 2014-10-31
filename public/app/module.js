'use strict';

angular.module('lasnotas', [
	'ngResource',
	'ngRoute',
  'ngSanitize',
  'ngAnimate',
  "ngQuickDate",
  'ui.bootstrap',
	'ui.ace'
])

/* Configure this modules routes */
.config(['$routeProvider', '$locationProvider', '$httpProvider',
		function ($routeProvider, $locationProvider, $httpProvider) {

	$httpProvider.interceptors.push('securityInterceptor');
	//$locationProvider.html5Mode(true);

	$routeProvider.when('/:id', { templateUrl: '/app/partials/editor.html', controller: 'editorCtrl' });
	$routeProvider.when('/', { templateUrl: '/app/partials/editor.html', controller: 'editorCtrl' });

}])

/* Simply displays wrapped post variable in given template */
.directive('postPreview', function() {
	return {
		restrict: 'E',
		scope: {
			post: '=',
			note: '='
		},
		templateUrl: function (elem, attrs) {
			return (attrs.templateUrl || '/app/partials/preview.html')
		}
	}
})

/* Hack $location.path to make not reloading optional */
// .run(['$route', '$rootScope', '$location',
// 	function ($route, $rootScope, $location) {
// 		var origPathFn = $location.path;
// 		$location.path = function (path, preventReload) {

// 			var lastRoute = $route.current;
// 			console.log("route.current:", $route.current)
// 			console.log("lastRoute:", lastRoute)
			
// 			if(preventReload === true) {
// 				var unload = $rootScope.$on('$locationChangeSuccess', function() {
// 					$route.current = lastRoute;
// 					unload();
// 				})
// 			}
// 			return origPathFn.apply($location, [path])
// 		}
// }])
// .run(['$route', '$rootScope', '$location',
// 	function ($route, $rootScope, $location) {
// 		var initial = true;
// 		var notesPattern = /\/notes/;
// 		$rootScope.$on('$locationChangeStart', function (event, next, last) {
// 			if(!initial && notesPattern.test(next) && notesPattern.test(last)) {
// 				event.preventDefault();
// 			}
// 			initial = false;
// 			console.log("next=", next);
// 			console.log("last=", last)
// 			//event.preventDefault();
// 		})

// }])
