'use strict';

angular.module('lasnotas')

/**
 * Base controller with some common functionality (e.g, alert messages)
 */
.controller('baseCtrl', ['$scope', '$routeParams', '$timeout', 'flashService', 'User',
			function ($scope, $routeParams, $timeout, flashService, User) {

	$scope.alerts = [];

	// load user
	User.current(function (user) {
		$scope.user = user;
	})

	// handles closing/removing current alert
	$scope.closeAlert = function (index) {
		$scope.alerts.splice(index, 1);
	}

	$scope.addAlert = function (alert, useFlash) {
		if(useFlash) {
			flashService.setFlash('alert', alert)
		}	else {
			$scope.alerts.push(alert);
			$timeout(function() {
				$scope.alerts.splice($scope.alerts.indexOf(alert), 1);
			}, 3000);
		}	
	}

	$scope.errorAlert = function (msg, surviveRedirect) {
		$scope.addAlert({ type: 'alert-danger', msg: msg }, surviveRedirect);
	}

	$scope.alert = function (msg, surviveRedirect) {
		$scope.addAlert({ type: 'alert-warning', msg: msg }, surviveRedirect);
	}

	$scope.successAlert = function (msg, surviveRedirect) {
		$scope.addAlert({ type: 'alert-success', msg: msg }, surviveRedirect);	
	}

	// wait until we've successfully loaded, then check flash
	// if we have any alerts
	$scope.$on("$routeChangeSuccess", function() {
		$timeout(function() {
			if(flashService.getFlash('alert')) {
				$scope.addAlert(flashService.getFlash('alert'))
			}
		}, 500);
	});

	$scope.$on()
}])


/**
 * Manages editor interactions (e.g. initializing editor, saving, opening files)
 */
.controller('editorCtrl', ['$controller', '$scope', '$routeParams', '$location', '$filter', '$modal', 'Note', 'appUtils', 'User', 'UserService',
			function ($controller, $scope, $routeParams, $location, $filter, $modal, Note, appUtils, User, UserService) {	

	/* inherit baseCtrl functionality */
	angular.extend(this, $controller('baseCtrl', { $scope: $scope }))			

	console.info("Starting editorCtrl");

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
			Note.get({ id: $routeParams.id }, function (resp, header) {
				$scope.setNote($scope, resp.note, callback);
			}, function (errResp) {
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

		// creates from copy of given note or defaults
		//scope.note = new Note(note, $scope.editor, { autosave: { interval: 10000 } });
		scope.note = new Note(note, { 
			autosave: { 
				interval: 10000,
				onsuccess: function (note) {
					var idParam = ($routeParams.id || 'new')
					if(note.id && idParam === 'new') {
						$location.path('/' + note.id, true)
					}
				}
			}
		});

		if(angular.isFunction(callback)) {
			callback(scope.note);
		} else {
			return scope.note;
		}
	}

	/**
	 * Gets the Note status, which can be:
	 * 	New
	 *	Draft
	 *	Saved - use optional format argument to return long or short version of this status
	 *		short: "Saved", long: "Saved on Oct 16, 2014 11:55:27 PM"
	 */ 
	$scope.noteStatus = function (note, format) {
		return ((note && note.id) ? (
				note.isDirty ? 'Draft' : ( 'Saved' +
					((format && format === 'l') ? (' on ' + $filter('date')(note.modifiedAt, 'medium')) : '')
			)) : 'New')
	}

	$scope.isPublished = function (note) {
		return (note.publishedAt !== null &&
			(typeof note.publishedAt !== 'undefined')) 
	}

	$scope.hasUnpublishedChanges = function (note) {
		return $scope.isPublished(note) && note.publishedAt !== note.modifiedAt
	}

	/**
	 * Handles editor "onLoad" event. We're given the editor on this event,
	 * which we set it to local scope and peform an additional initialization.
	 */
	$scope.editorLoaded = function (editor) {
		if(!$scope.editor) {
			$scope.editor = editor;
			editor.setShowPrintMargin(false);
			editor.setHighlightActiveLine(false);
			initNote(function (note) {
				// editor starts off blank, lets add some content
				$scope.editor.setValue(note.content);
				$scope.editor.clearSelection();
				$scope.editor.navigateTo(0,0);
				$scope.editor.focus();
			})
		}
	}

	$scope.handleError = function (err, redirect) {
		console.log("error: ", err)
		if(redirect) {
			$scope.openNewNote();
		}
	}

	$scope.editorChanged = function (v) {
		$scope.note.content = $scope.editor.getValue();
	}

	$scope.publishNote = function (note) {
		if(!note.id || note.content.length === 0) {
			$scope.alert("Hey, there's nothing to publish!")
		} else {
			if(note.publishedAt) {
				Note.unpublish(note, function (resp) {
					$scope.alert("'" + note.title + "' has been unpublished.")
				})
			} else {
				Note.publish(note, function (resp) {
					$scope.successAlert("'" + note.title + "' has been published.")
				})
			}
		}
	}

	$scope.removeNote = function (note, callback) {
		var noteId = (note.title || note.id)
		if(note.id && window.confirm('Remove "' + noteId + '"')) {
			Note.remove({ id: note.id }, function (resp) {
				var successMsg = "Note '" + noteId + "' has been deleted!";
				if(callback && (typeof callback === 'function')) {
					callback(resp.note);
					$scope.alert(successMsg)				
					if(note.id === $routeParams.id)
						$scope.openNewNote();
				}
				else {
					$scope.alert(successMsg, true)				
					$scope.openNewNote();
				}
			})
		}
	}

	/* Manage profile modal */
	$scope.showProfileModal = function () {
		var parentScope = $scope
		var modalInstance = $modal.open({
			templateUrl: '/app/partials/profile.html',
			controller: function ($scope, $modalInstance, user) {
				$scope.user = user
				$scope.saveProfile = function (user) {
					User.isNameAvailable({ name: user.name }, function (avail) {
						if(avail) {
							parentScope.user.$update(user, function (updated) {
								if(updated) {
									$scope.user = {
										name: updated.name,
										id: updated.id,
										fullName: updated.fullName
									}
									parentScope.successAlert('Your profile has been updated!');
								}
							})
						} else {
							parentScope.errorAlert("'" + user.name + 
									"' is unavailable, please try another!");
						}
					});
				}
			},
			size: 'md',
			resolve: {
				user: function() { 
					return new User({
						name: parentScope.user.name, 
						id: parentScope.user.id,  
						fullName: parentScope.user.fullName
					})
				}
			}
		});
	}

	/* Manage open notes modal */
	$scope.showNotesModal = function () {
		Note.query(function (resp) {
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