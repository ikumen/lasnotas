'use strict';

angular.module('lasnotas', [
	'ngResource',
	'ngRoute',
  'ngSanitize',
  'ngAnimate',
  'ui.bootstrap',
	'ui.ace'
])

/* Configure this modules routes */
.config(['$routeProvider', '$locationProvider', '$httpProvider',
		function ($routeProvider, $locationProvider, $httpProvider) {
	$httpProvider.interceptors.push('securityInterceptor');

	$routeProvider.when('/', { templateUrl: '/app/partials/editor.html', controller: 'editorCtrl' });
	$routeProvider.when('/new', { templateUrl: '/app/partials/editor.html', controller: 'editorCtrl' });
	$routeProvider.when('/:id', { templateUrl: '/app/partials/editor.html', controller: 'editorCtrl' });
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
.run(['$route', '$rootScope', '$location',
	function ($route, $rootScope, $location) {
		var origPathFn = $location.path;
		$location.path = function (path, preventReload) {
			if(preventReload === true) {
				var lastRoute = $route.current;
				var unload = $rootScope.$on('$locationChangeSuccess', function() {
					$route.current = lastRoute;
					unload();
				})
			}
			return origPathFn.apply($location, [path])
		}
}])

