'use strict';

angular.module('lasnotas', [
	'ngResource',
	'ngRoute',
	'ui.ace'
])
/* Configure this modules routes */
.config(['$routeProvider', function ($routeProvider) {
	$routeProvider.when('/', { templateUrl: '/app/partials/editor.html', controller: 'editorCtrl' });
	$routeProvider.when('/:id', { templateUrl: '/app/partials/editor.html', controller: 'editorCtrl' });
}])
