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

.factory('appUtils', function() {
	if(angular.isUndefined(lasnotasUtils))
		throw new Error('Missing external lib "lasnotasUtils"')
	return lasnotasUtils;
})

/* Returns service responsible for interacting with Note api */
.factory('noteService', ['$resource', function ($resource) {
	return $resource('/api/notes/:id', {}, { 
		'query': { isArray: false }
	});
}])

.factory('noteTemplates', [function () {
	return {
		emptyNote: '---\ntitle:\ndate:\ntags:\n---\n'
	}
}])