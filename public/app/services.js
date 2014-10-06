'use strict';

angular.module('lasnotas')

/* Returns a Note converter (/lib/note-converters) that was configured */
.factory('noteConverter', function() {
	//TODO: better way to source this in?
	return noteConverter;
})

.factory('appUtils', function() {
	if(angular.isUndefined(lasnotasUtils))
		throw new Error('Missing external lib "lasnotasUtils"')
	return lasnotasUtils;
})

/* Returns service responsible for interacting with Note api */
.factory('noteService', ['$resource', function ($resource) {
	return $resource('/api/notes/:id');
}])
