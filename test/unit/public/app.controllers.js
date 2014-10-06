'use strict';

describe('editor controllers', function() {
		
		// references to the inject angular resources
	var _$scope, 			
		_$location,
		_$routeParams,
		_noteService,
		_appUtils,

		// helper for creating editorCtrl	
		editorCtrl,

		// mock the ace editor instance
		_aceEditor = {	
			value: '',
			gotoLine: function() {},
			focus: function() {},
			getValue: function() { return this.value },
			setValue: function (value) { this.value = value }
		};


	beforeEach(function() {
		// load the module under test
		module('lasnotas')

		// have angular mock inject us some resources
		inject(function ($rootScope, $controller, $location, $routeParams, noteService, appUtils) {
			// create a new $scope for our controller
			_$scope = $rootScope.$new();
			_$location = $location
			_$routeParams = $routeParams
			_noteService = noteService
			_appUtils = appUtils

			_noteService.get = function (params, callback) {
				callback(utils.newNote({ id: params.id, content: '' }))
			}

			// using the injected angular resources, let's create an instance of our
			// controller that we're testing. This approach allows for some custom init.
			editorCtrl = function() {
				return $controller('editorCtrl', {
					$scope: _$scope,
					$location: _$location,
					$routeParams: _$routeParams,
					noteService: _noteService
				})
			}

		})
	})

	describe('editor initialization', function() {
		it('editor should not be defined', function() {
			editorCtrl();
			expect(_$scope.editor).not.toBeDefined()
		})
		
		it('editor is initialized', function() {
			// given an editor
			editorCtrl();
			// and external editor is loaded
			_$scope.editorLoaded(_aceEditor)
			
			// then editor reference should be in scope
			expect(_$scope.editor).toBeDefined();
			// and a new Note is initialized in scope
			expect(_$scope.note).toBeDefined();

		})


	})

})