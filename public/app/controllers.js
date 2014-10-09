'use strict';

angular.module('lasnotas')

/**
 * Manages editor interactions (e.g. initializing editor, saving, opening files)
 */
.controller('editorCtrl', ['$log', '$scope', '$routeParams', '$location', '$modal', 'noteService', 'appUtils', 'noteTemplates', 'noteConverter',
			function ($log, $scope, $routeParams, $location, $modal, noteService, appUtils, noteTemplates, noteConverter) {	
	$log.info("Starting editorCtrl");

	$scope.note = {}	// note we're editing
	$scope.post = {}	// a converted note, available for previewing	

	/**
	 * Helper for loading the initial Note and setting it to scope. First check 
	 * to see if we have a Note id in path variable and load it, then delegate
	 * to setNote() to normal the return Note and set it to scope. If this is 
	 * a request for a brand new Note, then simply call setNote without any Note
	 * params and it will create an empty one to put into scope.
	 */
	function initNote (callback) {
		// 1) load existing Note based on path variable id
		if(angular.isDefined($routeParams.id)) {
			noteService.get({ id: $routeParams.id }, function (resp, header) {
				$scope.setNote($scope, resp.note, callback);
			}, function (errResp) {
				//console.log(errResp)
				// unable to load the existing note, load a new one
				$scope.openNewNote();
			});
		} else {
			// 2) create a new Note (default action for setNote)
			$scope.setNote($scope, callback);
		}
	}

	$scope.openNewNote = function() {
		$location.path('/new')
	}

	/**
	 * Helper for normalizing Note data from any given source. The normalized
	 * note is then made available to the given scope. The function is overloaded
	 * to create a new Note if no source Note was given.
	 * 
	 * setNote(scope [, note] [, callback])
	 *
	 * @param scope where to set the normalized note
	 * @param note optional note to normalize, otherwise create a new Note
	 * @param callback optional callback(note), otherwise return the Note
	 */
	$scope.setNote = function(scope, note, callback) {
		if(angular.isUndefined(callback) && angular.isFunction(note)) {
			callback = note;
		}
		note = (note || {})
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
	 * Handles editor "onLoad" event. We're given the editor on this event,
	 * which we set it to local scope and peform an additional initialization.
	 */
	$scope.editorLoaded = function (editor) {
		if(!$scope.editor) {
			$scope.editor = editor;
			initNote(function (note) {
				// editor starts off blank, lets add some content
				$scope.editor.setValue(note.content);
				$scope.editor.clearSelection();
				$scope.editor.focus();
				// manually convert a note here to start so we have a post/preview
				$scope.convertNote(note);
			})
		}
	}

	$scope.handleError = function (err) {
		//console.log("error: ", err)
		$scope.openNewNote();
	}

	$scope.editorChanged = function (v) {
		$scope.note.content = $scope.editor.getValue();
		$scope.convertNote($scope.note);
	}

	$scope.saveNote = function (toSave) {
		noteService.save(toSave, function (resp) {
			if(!$routeParams.id) {
				$location.path('/' + resp.note.id)
			} else {
				$scope.setNote($scope, resp.note, function (note) {
				})
			}
		}, function(errResp) {
			handleError(errResp.data)
		})
	}

	$scope.convertNote = function (note) {
		noteConverter.convert(note, function (err, post) {
			$scope.post = post;
			$scope.note.title = (post.title || '');
		})
	}

	$scope.removeNote = function (note, callback) {
		if(note.id && window.confirm('Remove "' + note.id + '"')) {
			noteService.remove({ id: note.id }, function (resp) {
				if(callback && (typeof callback === 'function'))
					callback(resp.note)
				else
					$scope.openNewNote();
			})
		}
	}

	$scope.showNotesModal = function () {
		noteService.query(function (resp) {
			var removeNote = $scope.removeNote
			if(resp) {
				var modalInstance = $modal.open({
					templateUrl: '/app/partials/modal.html',
					controller: function ($scope, $modalInstance, notes) {
						$scope.notes = notes;
						$scope.openNote = function (note) {
							$modalInstance.close(note.id)
							
						}

						$scope.deleteNote = function (note) {
							removeNote(note, function (removed) {
								$scope.notes.splice($scope.notes.indexOf(note), 1);
							})
						}

					},
					size: 'md',
					resolve: {
						notes: function () { return resp.notes }
					}
				});

				modalInstance.result.then(function (noteId) {
					if(noteId) {
						$location.path('/' + noteId)
					}
				});
			} 
		});
	}
	
}])