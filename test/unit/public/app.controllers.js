'use strict';

describe('Editor Controllers', function() {
		
		// references to the inject angular resources
	var _$scope, 			
		_$location,
		_$routeParams,
		_noteService,
		_appUtils,
		_noteTemplates,

		// helper for creating editorCtrl	
		editorCtrl,

		// mock the ace editor instance
		_aceEditor = {	
			value: '',
			gotoLine: function() {},
			focus: function() {},
			getValue: function() { return this.value },
			setValue: function (value) { this.value = value }
		},

		savedNoteId = '541763d53002b5c27b2e755a',
		sampleContent = '# How to test angular applications';


	beforeEach(function() {
		// load the module under test
		module('lasnotas')

		// have angular mock inject us some resources
		inject(function ($rootScope, $controller, $location, 
					$routeParams, noteService, appUtils, noteTemplates) {
			// create a new $scope for our controller
			_$scope = $rootScope.$new();
			_$location = $location
			_$routeParams = $routeParams
			_noteService = noteService
			_appUtils = appUtils
			_noteTemplates = noteTemplates

			_noteService.get = function (params, callback) {
				callback(utils.newNote({ id: params.id, content: _noteTemplates.emptyNote + '\n' + sampleContent }))
			}
			_noteService.save = function (note, callback) {
				callback({ note: {
						id: savedNoteId,
						createdAt: new Date(),
						modifiedAt: new Date(),
						content: (note.content || null),
						title: (note.title || null)
					}
				})
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

	describe('Editor initialization', function() {
		it('should not be defined if ace not loaded', function() {
			editorCtrl();
			
			expect(_$scope.editor).not.toBeDefined()
		})
		
		it('should be initialized with empty Note', function() {
			// given an editor
			editorCtrl();
			// and external editor is loaded
			_$scope.editorLoaded(_aceEditor)
			
			// then editor reference should be in scope
			expect(_$scope.editor).toBeDefined();
			// and a new Note is initialized in scope
			expect(_$scope.note).toBeDefined();
			expect(_$scope.note.content).toEqual(_noteTemplates.emptyNote)
			expect(_aceEditor.getValue()).toEqual(_noteTemplates.emptyNote)
		})

		it('should be initialized with existing Note', function() {
			_$routeParams.id = '1234567890'
			editorCtrl();
			_$scope.editorLoaded(_aceEditor) 
			expect(_$scope.note).toBeDefined();
			expect(_$scope.note.content).toMatch(sampleContent)
		})
	})

	describe('Editor saving', function() {
		it('should save new content added to ace editor', function() {
			editorCtrl();
			_$scope.editorLoaded(_aceEditor);
			_aceEditor.setValue(sampleContent);

			expect(_$scope.note).toBeDefined();
			expect(_$scope.note.id).toBe(null);

			_$scope.editorChanged({})		// trigger editor change		
			expect(_$scope.note.content).toMatch(sampleContent)
			_$scope.saveNote()	// gets new content from editor

			expect(_$scope.note.id).toBe(savedNoteId);

		})
	})

})