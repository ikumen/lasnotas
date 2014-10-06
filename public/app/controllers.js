'use strict';

angular.module('lasnotas')

/**
 * Manages editor interactions (e.g. initializing editor, saving, opening files)
 */
.controller('editorCtrl', ['$log', '$scope', '$routeParams', '$location', 'noteService', 'appUtils', 'noteTemplates',
			function ($log, $scope, $routeParams, $location, noteService, appUtils, noteTemplates) {	
	$log.info("Starting editorCtrl");

	/**
	 * Helper for normalizing Note data from any given source. The normalized
	 * note is then made available to the given scope.
	 * 
	 * setNote(scope [, note] [, callback])
	 *
	 * @param scope where to set the normalized note
	 * @param note optional note to normalize, otherwise create a new Note
	 * @param callback optional callback(note), otherwise return the Note
	 */
	function setNote (scope, note, callback) {
		if(angular.isUndefined(callback) && angular.isFunction(note)) {
			callback = note;
			note = {};
		}
		// creates from copy of given note or defaults
		scope.note = {
			createdAt: (note.createdAt || null),
			modifiedAt: (note.modifiedAt || null),
			id: (note.id || null),
			title: (note.title || null),
			content: (note.content || noteTemplates.emptyNote)
		}

		if(angular.isFunction(callback)) {
			callback(scope.note);
		} else {
			return scope.note;
		}
	}

	/**
	 * Loads the initial Note for a newly initialized editor.
	 */
	$scope.initNote = function (callback) {
		if(angular.isDefined($routeParams.id)) {
			noteService.get({ id: $routeParams.id }, function (note, header) {
				setNote($scope, note, callback);
			}, function (errResp) {
				$location.path('/new');
			});
		} else {
			setNote($scope, callback);
		}
	}

	/**
	 * Handles editor "onLoad" event. We're given the editor on this event,
	 * which we set it to local scope and peform an additional initialization.
	 */
	$scope.editorLoaded = function (editor) {
		if(!$scope.editor)
			$scope.editor = editor;
		$scope.initNote(function (note) {
			// set content, then move caret to end
			$scope.editor.setValue(note.content, 1)
			// then bring editor to focus
			$scope.editor.focus();
			
		})
	}

	
}])