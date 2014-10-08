'use strict';

angular.module('lasnotas', [
	'ngResource',
	'ngRoute',
  'ngSanitize',
	'ui.ace'
])
/* Configure this modules routes */
.config(['$routeProvider', function ($routeProvider) {
	$routeProvider.when('/', { templateUrl: '/app/partials/editor.html', controller: 'editorCtrl' });
	$routeProvider.when('/new', { templateUrl: '/app/partials/editor.html', controller: 'editorCtrl' });
	$routeProvider.when('/:id', { templateUrl: '/app/partials/editor.html', controller: 'editorCtrl' });
}])
