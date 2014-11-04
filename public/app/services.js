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
 * Intercept unauthorized access errors.
 */
.factory('securityInterceptor', ['$q', '$window',
		function ($q, $window) {
	return {
		'responseError' : function (resp) {
			if(resp.status === 401) 
				$window.location.href = '/signout';
			return $q.reject(resp);
		},
		'response' : function (resp) {
			return resp;
		}
	}		
}])

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

/** Service responsible for interacting with Note API */
.factory('NoteService', ['$resource', function ($resource) {
	return $resource('/api/notes/:id', { id: '@id' }, { 
		'query': { isArray: false },
		'publish': {method: 'POST', url: '/api/notes/:id/publish' },
		'unpublish': {method: 'POST', url: '/api/notes/:id/unpublish' }
	});

}])

/** 
 * Service for managing the editing actions on a Note. 
 */
.factory('Editor', ['$interval', 'NoteService', 'Note', 'appUtils', 
		function ($interval, NoteService, Note, appUtils) {

	var $editor;		// external editor we've wrapped
	var $note;			// note currently opened in editor
	var $autosave;
	var $configured = false;
	// map of states and functions that act on them
	var $emitter = {
		'configured': [],			// when a new note is saved
		'saved': [],			// when an existing note is saved
		'opened': [],				// when a new/existing note is opened
		'published': [],	
		'unpublished': [],
		'removed': []
	}

	/**
	 * Main interface that controllers will be interacting with.
	 */
	var editorService = {
		/* pseudo observer/listener/fsm. register actions on a state */
		on: function (state, fn) {
			var added = false;
			if(typeof fn === 'function') {
				for(var s in $emitter) {
					if(s === state && $emitter[s].indexOf(fn) === -1) {
						added = true
						$emitter[s].push(fn);
						break;
					}
				}
			}
			if(!added) {
				throw new Error("State '" + state + "' does not exists!") 
			}
			return this;
		},

		/* emit a state and call it's actions */
		emit: function () {
			// arguments is a special array, let's slice out just that parts we need
			var args = Array.prototype.slice.call(arguments);
			// the first arg is state, rest are actual arguments
			var state = args.shift() 

			for(var i=0; i < $emitter[state].length; i++) {
				// if we simple passed args, it would get wrapped in another array
				// so we need to apply
				$emitter[state][i].apply(this, args)
			}
		},
		
		/* what to do when content changes, assign this to onChange 
		 * events for external editor. Ideally we programmatically assign
		 * it in here, but it's not working. So this is exposed and assigned
		 * at the controller/view level.
		 */
		contentChange: function () {
			$note.content = $editor.getValue();
		},

		/* 
		 * Configures this editor service. Expects the following
		 *
		 * @param editor external editor we're wrapping 
		 * @param opts
		 *		autosave @see autosave section
		 * @param [callback] optional callback once we're done, otherwise we
		 *		return an instance of ourselves for fluent api
		 */
		config: function (editor, opts, callback) {
			if(!editor || arguments.length !== 2)
				throw new Error('config not called with enough arguments!')

			$editor = editor;
			$editor.setShowPrintMargin(false);
			$editor.setHighlightActiveLine(false);
			$autosave = new Autosave(this, opts.autosave);

			if(callback) {
				callback(this);
			} else {
				return this;
			}
		},

		/* 
		 * For clients to call when they're done with configuration
		 * and registering actions on our emitters 
		 */ 
		done: function () {
			$configured = true;
			this.emit('configured', this)
		},

		isConfigured: function() { 
			return $configured 
		},

		emptyNote: function () {
			return new Note();
		},
	
		// this is pretty UI specific, but right now 
		focus: function() {
			if($editor.clearSelection) $editor.clearSelection();
			if($editor.navigateTo) $editor.navigateTo(0,0);
			if($editor.focus) $editor.focus();
		},

		/*
		 * Manages opening a Note. It's overloaded to open a Note with
		 * given id or a new Note if id is invalid.
		 * 
		 * @param [id] of note we're opening, otherwise open new Note
		 * @param [callback] optional callback when we're done
		 */
		openNote: function (id, callback) {
			if(typeof id === 'function') {
				callback = id;
				id = null;
			}

			var self = this;

			// some things we need to do for each Note
			function done (note) {
				//console.info("Opened note: ", note);
				$autosave.cancel(); // stop the autosave on existing Note
				$note = note;	
				$editor.setValue($note.content); // set editor interface with Note we just opened
				self.emit('opened', $note); // lets listeners know we've open a note
				$autosave.start();	// start autosave
				if(callback) {
					callback($note);
				}
			}

			// check if id is valid
			if(appUtils.isObjectId(id)) {
				NoteService.get({ id: id}, function (resp, headers) {
					done(new Note(resp.note));
				}, function (err) {
					// fail silently and open new Note
					done(self.emptyNote());
				})
			} 
			// create a new Note
			else {
				done(self.emptyNote());
			}
		},

		openNewNote: function (callback) { 
			this.openNote(null, callback); 
		},

		getNote: function () {
			return $note;
		},

		listNotes: function (callback) {
			NoteService.query(
				function (resp, headers){
					callback(resp.notes);
				}, 
				function (errResp){})
		},

		saveNote: function (note, callback) {
			var self = this
			NoteService.save({id: $note.id}, $note, 
				function (resp, headers) {
					var saved = resp.note
					$note.id = $note.id || saved.id;
					$note.modifiedAt = saved.modifiedAt;
					$note.createdAt = saved.createdAt;
					$note.publishedAt = saved.publishedAt;
					$note.title = saved.title;
					// this will reset Note._origContent to Note._content
					$note.isDirty = false;
					callback($note);
					self.emit('saved', $note);
				}, 
				callback 
			);
		},

		removeNote: function (note, callback, errCallback) {
			var toRemove = { id: note.id, title: (note.title || note.id) }

			function done () {
				// not using self, since when in modal scope "this" is undefined
				editorService.openNewNote();
				editorService.emit('removed', toRemove)
				if(callback) {
					callback(toRemove)
				}
			}

			if(toRemove.id) {
				NoteService.remove({ id: toRemove.id }, 
					function (resp, headers) {
						done()
					},
					errCallback);
			} else {
				done()
			}
		},

		canPublishNote: function () {
			return !(!$note.id || !$note.publishedAt && $note.isEmpty());
		},

		canRemoveNote: function () {
			return ($note.id || !$note.isEmpty());
		},

		pubUnpubNote: function () {
			var self = this;
			if(self.canPublishNote()) {
				if($note.publishedAt) 
					self.unpublishNote();
				else
					self.publishNote();
			}
		},

		publishNote: function () {
			var self = this;
			NoteService.publish(
				{ id: $note.id, post: { date: $note.post.date }}, 
				function (resp, headers) {
					$note.publishedAt = resp.note.publishedAt
					$note.modifiedAt = resp.note.modifiedAt
					self.emit('published', $note);
				}, 
				function () {
					//error
				}
			);
		},

		unpublishNote: function () {
			var self = this;
			NoteService.unpublish(
				{ id: $note.id }, 
				function (resp, headers) {
					$note.publishedAt = null;
					self.emit('unpublished', $note);
				}, 
				function () {
					//error
				}
			);
		}
	}

	/**
	 * Provides auto saving functionality to this Editor.  
	 */
	function Autosave (opts) {
		opts = (opts || { enabled: true })	// autosave is enabled by default

		var delay = (opts.delay || 10000); 	// 10 second default
		var onSuccess = (opts.onSuccess || appUtils.noOpt);
		var onError = (opts.onError || appUtils.noOpt);
		var intPromises = [];
		var enabled = ((typeof opts.enabled === 'undefined') || opts.enabled)

		return {
			cancel: function () {
				for(var i=0; i < intPromises.length; i++) {
					$interval.cancel(intPromises.splice(i, 1)[0]);
				}
			},

			start: function () {
				if(!enabled)
					return;

				this.cancel();
				var intPromise = $interval(
					function () { 
						if($note && $note.isDirty) {
							//console.log("autosave: saving note ...");
							editorService.saveNote(onSuccess, onError) 
						} else {
							//console.log('autosave: nothing to save!')
						}
					}, 
					delay, false
				);
				// saved the interval promise
				intPromises.push(intPromise)
			},
		}
	}


	return editorService;

}])

/**
 *
 */
.service('Note', ['noteConverter', 
		function (noteConverter) {

	function Post (post) {
		var _content = "", _date;

		if(post) {
			_content = post.content || "";
			_date = post.date || null;
		}

		Object.defineProperties(this, {
			'content': {
				get: function () { return _content },
				set: function (val) { _content = val },
				enumerable: true 
			},
			'date': {
				get: function () { return _date },
				set: function (val) { _date = val },
				enumerable: true
			}
		})
	}

	function Note (note) {	
		note = (note || {}); 
		this.id = (note.id || null)
		this.title = (note.title || null)
		this.publishedAt = (note.publishedAt || null)
		this.post = new Post(note.post)

		var _origContent = '';
		var _content = '';
		
		Object.defineProperties(this, {
			'isDirty': {
				get: function () { 
					return (_content !== _origContent); 
				},
				set: function (v) { 
					if(!v) { _origContent = _content; }
				},
				enumerable: false
			},
			'content': {
				get: function () { 
					return _content 
				},
				set: function (val) {
					// set the content
					_content = val;
					// side affects of setting content
					// 1) convert content to a post (this is used for live preview)
					this.post.content = noteConverter(val);
					// 2) extract title from our content, first look for headings
					var regResults = /^#{1,6}(.*)/.exec(val.trim())
					if(regResults && regResults.length > 1)
						this.title = regResults[1].trim();
					// 3) extract title, if no headings, grab the first couple of words
					else if(val) {
						var text = angular.element(this.post.content).text().substring(0, 60);
						this.title = (text.substring(0, text.lastIndexOf(' ')) || text)
					}
				},
				enumerable: true
			},
			'createdAt': {
				value: note.createdAt,
				writable: true,
				enumerable: true
			},
			'modifiedAt': {
				value: note.modifiedAt,
				writable: true,
				enumerable: true
			}
		})

		// after we've defined the hooked setter/getter for content, 
		// lets set it if passed in note has any
		if(note.content) {
			var content = note.content.trim();
			this.content = content;
			_origContent = content;
		}
	}

	Note.prototype.isEmpty = function () {
		return ((this.content || '').trim().length === 0);
	}
	Note.prototype.isNew = function () {
		return (this.isEmpty() && !this.id)
	}

	return Note;
}])

/** Service for interacting with User API */
.service('User', ['$resource', function ($resource) {
	/* Where the magic happens */	
	var userResource = $resource('/api/users/:id', { id: '@id' }, {
			'current': {  method: 'GET', url: '/api/users/@current', isArray: false},
			'isNameAvailable': {  method: 'GET', url: '/api/users/@:name/avail', isArray: false},
			'update': {  method: 'PUT', url: '/api/users/:id', isArray: false}
		});

	function User (user) {
		this.name = user.name
		this.id = user.id
		this.title = user.title
		this.description = user.description
		this.fullName = user.fullName
	}

	/* Returns the currently authenticated User */
	User.current = function (callback) {
		userResource.current(function (resp, headers) {
			callback(new User(resp.user));
		});
	}
	/* Check API if choosen user name is available */
	User.isNameAvailable = function (user, callback) {
		userResource.isNameAvailable({ name: user.name }, 
			function(resp, headers) {
				callback(resp.avail)
		});
	}
	/* Performs update of user profile (e.g. user name, fullname) */
	User.prototype.$update = function (update, callback) {
		var self = this;
		userResource.update({ id: update.id }, update, 
			function (resp, headers) {
				var user = resp.user
				if(user) {
					self.name = user.name,
					self.fullName = user.fullName
					self.title = user.title
					self.description = user.description
				}
				callback(user)
		})
	}

	return User;

}])
