'use strict';

angular.module('lasnotas')

/**
 * Base controller with some common functionality (e.g, alert messages)
 */
.controller('baseCtrl', ['$scope', '$routeParams', '$timeout', 'flashService', '$route',
			function ($scope, $routeParams, $timeout, flashService, $route) {

	$scope.alerts = [];

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

}])


/**
 * Manages editor interactions (e.g. initializing editor, saving, opening files)
 */
.controller('editorCtrl', ['$controller', '$route', '$scope', '$routeParams', '$location', '$filter', '$modal', 'Editor', 'appUtils', 'User',
			function ($controller, $route, $scope, $routeParams, $location, $filter, $modal, Editor, appUtils, User) {	

	/* inherit baseCtrl functionality */
	angular.extend(this, $controller('baseCtrl', { $scope: $scope, $routeParams: $routeParams }))			

	console.info("Start editorCtrl ..")

	var lastRoute = $route.current;
	var notesPattern = /^\//;
	$scope.$on('$locationChangeSuccess', function (event) {
		//console.log('current: %s %s', $route.current.$$route.originalPath, $route.current.params.id)
    if($route.current && notesPattern.test($route.current.$$route.originalPath) &&
    		notesPattern.test(lastRoute.$$route.originalPath)) {
	    if($scope.note.id !== $route.current.params.id) {
		    Editor.openNote($route.current.params.id)
	    }
	    $route.current = lastRoute;
	  }
	});

	// load user
	User.current(function (user) {
		$scope.user = user;
	})

	$scope.openNewNote = function() {
		$location.path('/new');
	}

	/**
	 * Gets the Note status, which can be:
	 * 	New
	 *	Draft
	 *	Saved - use optional format argument to return long or short version of this status
	 *		short: "Saved", long: "Saved on Oct 16, 2014 11:55:27 PM"
	 */ 
	$scope.noteStatus = function (note, format) {
		return (!note || !note.id) ? 'New' :
			( note.isDirty ? 'Draft' : 'Saved'  + ((format && format === 'l') ? 
				(' on ' + $filter('date')(note.modifiedAt, 'medium')) : '')); 
	}

	/**
	 * 0 - nothing to publish
	 * 1 - not published yet
	 * 2 - published 
	 * 3 - published with changes
	 */
	$scope.publishStatus = function () {
		var note = $scope.note
		if(!note || !note.id)
			return 0;
		else if(note.modifiedAt && !note.publishedAt)
			return 1;
		else if(note.publishedAt === note.modifiedAt)
			return 2;
		else 
			return 3;
	}

	$scope.isPublished = function (note) {
		return (note.publishedAt !== null &&
			(typeof note.publishedAt !== 'undefined')) 
	}

	function getNoteTitleOrId (note) {
		return (note.title || note.id);
	}

	function getNoteIdParam() {
		return (typeof $routeParams.id === 'undefined' ? null : $routeParams.id);
	}

	function loadNote() {
		Editor.openNote(getNoteIdParam());
	}

	$scope.defaultDateFormat = 'yyyy-MM-dd';
	$scope.postBackdate = $scope.defaultDateFormat;

	function setPostBackdate (date) {
		if(date) {
			$scope.postBackdate = $filter('date')(date, $scope.defaultDateFormat);
		}
	}

	/**
	 * Handles editor "onLoad" event. We're given the editor on this event,
	 * which we set it to local scope and peform an additional initialization.
	 */
	$scope.editorLoaded = function (wrappedEditor) {
		if(!Editor.isConfigured()) {
			Editor.config(
				wrappedEditor, {
					autosave: {
						enabled: true
					}
			})
			.on('saved', function (note) {
				$scope.note = note;
				setPostBackdate(note.post.date);
				if(note.id !== getNoteIdParam()) {
					$location.path('/' + note.id);
				}
			})
			.on('opened', function (note) {
				$scope.note = note;
				setPostBackdate(note.post.date);
				Editor.focus();
			})
			.on('published', function (note) {
				$scope.successAlert("'" + getNoteTitleOrId(note) + "' published!");
			})
			.on('unpublished', function (note) {
				$scope.alert("'" + getNoteTitleOrId(note) + "' unpublished!");
			})
			.on('removed', function (note) {
				$scope.alert("'" + getNoteTitleOrId(note) + "' removed!");
			})
			.on('configured', function (editor) {
				editor.openNote(getNoteIdParam());
			})
			.done();
		}

		$scope.editorContentChanged = Editor.contentChange;
	}

	$scope.handleError = function (err, redirect) {
		console.log("error: ", err)
		if(redirect) {
			$scope.openNewNote();
		}
	}

	$scope.publishNote = function () {
		if($scope.publishStatus() === 0) {
			$scope.alert("Hey, there's nothing to publish!");
		} else {
			Editor.publishNote();
		}
	}

	$scope.unpublishNote = function () {
		if($scope.publishStatus() <= 1) {
			$scope.alert("Hey, there's nothing to unpublish!");
		} else {
			Editor.unpublishNote();
		}
	}

	$scope.publishBackdate = function () {
		if(/^\d{4}-\d{2}-\d{2}/.test($scope.postBackdate)) {
			$scope.note.post.date = $scope.postBackdate;
			$scope.publishNote();
		}
	}

	$scope.removeNote = function (note, callback) {
		var titleOrId = getNoteTitleOrId(note);
		if(Editor.canRemoveNote() && window.confirm('Remove "' + titleOrId + '"')) {
			Editor.removeNote(note)
		}
	}

	/*
	 */
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

	$scope.showNotesModal = function () {
		Editor.listNotes( function (notes) {
			var removeNote = Editor.removeNote
			if(notes) {
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
						notes: function () { return notes }
					}
				});

				modalInstance.result.then(function (noteId) {
					$location.path('/' + noteId)
				});
			} 
		});
	}
	
}])