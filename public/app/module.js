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
.config(['$routeProvider', function ($routeProvider) {
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
