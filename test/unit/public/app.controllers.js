'use strict';

describe('Controllers', function() {
		
	// references to the inject angular resources
	var _$scope, 			
		_$location,
		_$routeParams,
		_noteService,
		_noteConverter,
		_appUtils,
		_noteTemplates;

	// controller under test
	var controller;

	// mock the ace editor instance
	var	_aceEditor = {	
			value: '',
			gotoLine: function() {},
			focus: function() {},
			clearSelection: function() {},
			getValue: function() { return this.value },
			setValue: function (value) { this.value = value }
		}

	// new note
	var newNote = utils.createNote();
	// existing note
	var existingNote = utils.createNote({ 
			id: utils.NOTE_ID,
			content: utils.NOTE_CONTENT,
			title: utils.NOTE_TITLE
		});

	describe('Editor controller', function() {
		beforeEach(function(done) {
			// load the module under test
			module('lasnotas')

			// have angular mock inject us some resources
			inject(function ($rootScope, $controller, $location, 
						$routeParams, noteService, appUtils, noteTemplates, noteConverter) {
				// create a new $scope for our controller
				_$scope = $rootScope.$new();
				_$location = $location;
				_$routeParams = $routeParams;
				_noteService = noteService;
				_noteConverter = noteConverter;
				_appUtils = appUtils;
				_noteTemplates = noteTemplates;

				_noteService.get = function (params, callback) {
					params = (params || {})
					if(params.id === existingNote.id) {
						callback({ note: existingNote })
					}
					else
						callback({ note: utils.createNote(params) })
				}
				_noteService.remove = function (params, callback) {
					callback(params)
				}
				_noteService.save = function (note, callback) {
					note = (note || newNote)
					var now = new Date();
					note.id = utils.NOTE_ID;
					note.modifiedAt = now;
					note.createdAt = (note.createdAt || now);
					callback({note: note})
				}

				// using the injected angular resources, let's create an instance of our
				// controller that we're testing. This approach allows for some custom init.
				controller = function() {
					return $controller('editorCtrl', {
						$scope: _$scope,
						$location: _$location,
						$routeParams: _$routeParams,
						noteService: _noteService
					})
				}
			})
		
			done()
		})


		/* ........................................ */
		/* .......... Start Tests ................. */
		/* ........................................ */

		/* Tests controller as it startup */
		describe('On startup, controller', function() {
			it('should fail to load if ace not loaded', function() {
				controller();
				// _$scope.editor is only available if ace was loaded
				expect(_$scope.editor).not.toBeDefined();
				// TODO: expect an error here
			});

			it('should be initialized with following if editing new note', function() {
				controller();
				// simulate ace editor onload event, which triggers editorLoaded handler
				_$scope.editorLoaded(_aceEditor);

				// properly initialized editor ctrl should have following
				expect(_$scope.editor).toBeDefined();
				// and a new Note is initialized in scope
				expect(_$scope.note).toBeDefined();
				expect(_$scope.note.id).toEqual(null)
				expect(_$scope.note.content).toEqual(_noteTemplates.emptyNote)
				expect(_aceEditor.getValue()).toEqual(_noteTemplates.emptyNote)
			});

			it('should be initialized with following if editing existing note', function() {
				// make sure noteservice was called to get Note
				spyOn(_noteService, 'get').and.callThrough();

				// simulate having an id in path variable e.g, /#/some_note_id
				_$routeParams.id = existingNote.id;
				controller();
				// simulate ace editor onload event, which triggers editorLoaded handler
				_$scope.editorLoaded(_aceEditor);

				// initialized with an existing note in scope
				expect(_$scope.note).toBeDefined()
				expect(_$scope.note.id).toBeDefined(existingNote.id)
				expect(_noteService.get).toHaveBeenCalled()
			});

			it('should redirect to new note if error loading existing note', function() {
				// mock the noteService.get error
				_noteService.get = function (params, callback, errCallback) {
					errCallback({ error: { status: 404, message: 'Not Found', error: {} }})
				}
				// there should be a redirect to /new if error, spy the 
				// location to make sure it gets called
				spyOn(_$location, 'path')

				// given scope without note
				expect(_$scope.note).not.toBeDefined();

				// simulate request for existing note
				_$routeParams.id = existingNote.id;
				controller();
				_$scope.editorLoaded(_aceEditor);

				// did we get the redirect to /new
				expect(_$location.path).toHaveBeenCalledWith('/new');
			});

		}); // On startup controller tests...

		/* Tests controller during editing */
		describe('When editing, controller', function() {
			it('should save without redirect if existing note', function() {
				// simulate request for existing note
				_$routeParams.id = existingNote.id;
				controller();
				_$scope.editorLoaded(_aceEditor);

				// given an existing note has been loaded
				expect(_$scope.note).toBeDefined();
				expect(_$scope.note.id).toEqual(existingNote.id)
				expect(_$scope.note.modifiedAt).toEqual(existingNote.modifiedAt)
				expect(_$scope.note.content).toBeDefined()

				// lets update the content
				var updatedContent = _$scope.note.content + '\n## Heading 2\n*Updated*';
				_$scope.note.content = updatedContent;

				// when we save
				_$scope.saveNote(_$scope.note);

				// then we can expect
				expect(_$scope.note.id).toEqual(existingNote.id)
				expect(_$scope.note.modifiedAt).not.toEqual(existingNote.modifiedAt)
				expect(_$scope.note.content).toEqual(updatedContent)
			});

			it('should save and redirect if a new note', function() {
				controller();
				_$scope.editorLoaded(_aceEditor);

				// given an existing note has been loaded
				expect(_$scope.note).toBeDefined();
				expect(_$scope.note.id).toEqual(newNote.id)
				expect(_$scope.note.content).toEqual(newNote.content)

				// expect this to be called for redirect
				spyOn(_$location, 'path')

				// when we save
				_$scope.saveNote(_$scope.note)

				// then we can expect
				expect(_$location.path).toHaveBeenCalledWith('/' + utils.NOTE_ID)

			});

			it('should handle remove and redirect', function() {
				_$routeParams.id = existingNote.id;
				controller();
				_$scope.editorLoaded(_aceEditor);

				// for expecting confirm prompt when try to remove
				spyOn(window, 'confirm').and.returnValue(true);
				// do remove
				spyOn(_noteService, 'remove').and.callThrough();
				// for expecting redirect after remove
				spyOn(_$location, 'path');

				// when we remove
				_$scope.removeNote(_$scope.note);

				// then we can expect ...
				expect(_noteService.remove).toHaveBeenCalled();
				expect(window.confirm).toHaveBeenCalled()
				expect(_$location.path).toHaveBeenCalledWith('/new');
			})

		}); // When editing controller tests ...

		/* Tests for Note convertering process, triggered when a Note loaded/updated */
		describe('When a Note is loaded/updated, controller', function() {
			it('should create a Post if Note is loaded', function() {
				// assert we have no post in scope
				expect(_$scope.post).not.toBeDefined();
				controller();

				// assert the controller starts with empty post
				expect(_$scope.post.content).not.toBeDefined();
				expect(_$scope.post.title).not.toBeDefined()
				expect(_$scope.post.publishedAt).not.toBeDefined()

				// when editor is first loaded, some initialization takes place
				// to load an existing or new note, once it's loaded, converter
				// kicks in to also produce post and puts onto scope
				// when we intialize
				_$scope.editorLoaded(_aceEditor)

				// then we can expect
				expect(_$scope.post.content).toBeDefined();
				expect(_$scope.post.title).toBeDefined()
				expect(_$scope.post.publishedAt).toBeDefined()
				expect(_$scope.post.tags).toBeDefined()
				expect(_$scope.post.tags.length).toEqual(0)
				expect(_$scope.post.content).toEqual('') // we start with just front-matter, nothing else
			})

			it('should update a Post if Note is updated', function() {
				expect(_$scope.post).not.toBeDefined();
				controller();

				// assert the controller starts with empty post
				expect(_$scope.post.content).not.toBeDefined();
				expect(_$scope.post.title).not.toBeDefined()
				expect(_$scope.post.publishedAt).not.toBeDefined()

				// when editor is first loaded, some initialization takes place
				// to load an existing or new note, once it's loaded, converter
				// kicks in to also produce post and puts onto scope
				// when we intialize
				_$scope.editorLoaded(_aceEditor)
				_aceEditor.setValue(existingNote.content);
				_$scope.editorChanged({}); // normally triggered by _aceEditor

				expect(_$scope.post.content).toMatch(/<em>emphasized text<\/em>/)
				expect(_$scope.post.title).toMatch(/How to test angular applications/)
				expect(_$scope.post.tags).toContain('javascript')
				expect(_$scope.post.tags).toContain('angular')

			})
		})

	})


})