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

.factory('securityInterceptor', ['$q', '$window',
		function ($q, $window) {
	return {
		'responseError' : function (resp) {
			if(resp.status === 401) 
				$window.location.href = '/notessdf';
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

/**
 * Returns service responsible for interacting with Note api 
 */
.factory('NoteService', ['$resource', function ($resource) {
	return $resource('/api/notes/:id', { id: '@id' }, { 
		'query': { isArray: false },
		'publish': {method: 'POST', url: '/api/notes/:id/publish' },
		'unpublish': {method: 'POST', url: '/api/notes/:id/unpublish' }
	});

}])

.factory('Editor', ['$interval', 'NoteService', 'Note', 'appUtils', 
		function ($interval, NoteService, Note, appUtils) {

	var $editor;		// external editor we've wrapped
	var $note;			// note currently opened in editor
	var $autosave;
	var $configured = false;
	var $emitter = {
		'configured': [],			// when a new note is saved
		'saved': [],			// when an existing note is saved
		'opened': [],				// when a new/existing note is opened
		'published': [],	
		'unpublished': [],
		'removed': []
	}

	function Autosave (editor, opts) {
		var editor = editor;
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
							editor.saveNote(onSuccess, onError) 
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

	var editorService = {
		on: function (state, fn) {
			if(typeof fn === 'function') {
				for(var s in $emitter) {
					if(s === state && $emitter[s].indexOf(fn) === -1) {
						$emitter[s].push(fn);
						break;
					}
				}
			}
			return this;
		},

		emit: function () {
			var args = Array.prototype.slice.call(arguments);
			var state = args.shift()
			for(var i=0; i < $emitter[state].length; i++) {
				$emitter[state][i].apply(this, args)
			}
		},
		
		contentChange: function () {
			$note.content = $editor.getValue();
		},

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

		done: function () {
			$configured = true;
			this.emit('configured', this)
		},

		isConfigured: function() { return $configured },

		emptyNote: function () {
			return new Note();
		},
	
		focus: function() {
			$editor.clearSelection();
			$editor.navigateTo(0,0);
			$editor.focus();
		},

		openNote: function (id, callback) {
			if(typeof id === 'function') {
				callback = id;
				id = null;
			}

			var self = this;

			function done (note) {
				//console.info("Opened note: ", note);
				$autosave.cancel();
				$note = note;
				$editor.setValue($note.content)
				self.emit('opened', $note);
				$autosave.start();
				if(callback) {
					callback($note);
				}
			}

			if(appUtils.isObjectId(id)) {
				NoteService.get({ id: id}, function (resp, headers) {
					done(new Note(resp.note));
				}, function (err) {
					done(self.emptyNote());
				})
			} else {
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

	return editorService;

}])

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

.service('User', ['$resource', function ($resource) {
	
	var userResource = $resource('/api/users/:id', { id: '@id' }, {
			'current': {  method: 'GET', url: '/api/users/@current', isArray: false},
			'isNameAvailable': {  method: 'GET', url: '/api/users/@:name/avail', isArray: false},
			'update': {  method: 'PUT', url: '/api/users/:id', isArray: false}
		});

	function User (user) {
		this.name = user.name
		this.id = user.id
		this.fullName = user.fullName
	}

	User.current = function (callback) {
		userResource.current(function (resp, headers) {
			callback(new User(resp.user));
		});
	}

	User.isNameAvailable = function (user, callback) {
		userResource.isNameAvailable({ name: user.name }, 
			function(resp, headers) {
				callback(resp.avail)
		});
	}

	User.prototype.$update = function (update, callback) {
		var self = this;
		userResource.update({ id: update.id }, update, 
			function (resp, headers) {
				var user = resp.user
				if(user) {
					self.name = user.name,
					self.fullName = user.fullName
				}
				callback(user)
		})
	}

	return User;

}])
// .factory('location', [
//     '$location',
//     '$route',
//     '$rootScope',
//     function ($location, $route, $rootScope) {
//         var page_route = $route.current;

//         $location.skipReload = function () {
//             //var lastRoute = $route.current;
//             var unbind = $rootScope.$on('$locationChangeSuccess', function () {
//                 $route.current = page_route;
//                 unbind();
//             });
//             return $location;
//         };

//         if ($location.intercept) {
//             throw '$location.intercept is already defined';
//         }

//         $location.intercept = function(url_pattern, load_url) {

//             function parse_path() {
//                 var match = $location.path().match(url_pattern)
//                 if (match) {
//                     match.shift();
//                     return match;
//                 }
//             }

//             var unbind = $rootScope.$on("$locationChangeSuccess", function() {
//                 var matched = parse_path();
//                 if (!matched || load_url(matched) === false) {
//                   return unbind();
//                 }
//                 $route.current = page_route;
//             });
//         };

//         return $location;
//     }
// ])