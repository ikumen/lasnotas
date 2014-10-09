'use strict';

angular.module('lasnotas')

/* 
 * Returns a Note converter (/lib/note-converters) that is assumed to 
 * be source in at global scope 
 * TODO: better way to source in? look at requirejs
 */
.factory('noteConverter', function() {
	return noteConverter;
})

/**
 * Provides access to external utils.
 */
.factory('appUtils', function() {
	if(angular.isUndefined(lasnotasUtils))
		throw new Error('Missing external lib "lasnotasUtils"')
	return lasnotasUtils;
})

/**
 * Manages flash objects between route changes
 */
.factory('flashService', ['$rootScope', function ($rootScope) {
	var flashes = {};
	var currentFlashes = {};

	// after route changes, get the next flash
	$rootScope.$on("$routeChangeSuccess", function() {
		for(var type in flashes) {
			currentFlashes[type] = flashes[type].shift() || null;
		}
	});

	return {
		// called before we do route change
		setFlash: function (type, flash) {
			if(!flash.hasOwnProperty(type)) {
				flashes[type] = [];
				currentFlashes[type] = null;
			}
			flashes[type].push(flash);
		},
		// called after route change
		getFlash: function(type) {
			return currentFlashes[type];
		}
	}

}])

/**
 * Returns service responsible for interacting with Note api 
 */
.factory('noteService', ['$resource', function ($resource) {
	return $resource('/api/notes/:id', {}, { 
		'query': { isArray: false }
	});
}])

/**
 * 
 */
.factory('noteTemplates', [function () {
	return {
		emptyNote: '---\ntitle:\ndate:\ntags:\n---\n'
	}
}])