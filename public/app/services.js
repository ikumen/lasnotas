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

/**
 * Provides Note service for instantiating a new Note. Note instances
 * come with life-cycle management features (delegate to underlying 
 * $resource provider). 
 */
.service('Note', ['NoteService', 'noteConverter', 'appUtils', '$interval',
		function (NoteService, noteConverter, appUtils, $interval) {

	/* 
	 * Post are published content of a Note. The Post here exists only 
	 * to support live previewing feature in the editor. As Note is being
	 * edited (changed), it's contents are converted into a Post and bind
	 * to preview view. 
	 * 
	 * enumerable is set to false for post.content because server will 
	 * handle real job of converting a Note content during publishing
	 * process.
	 */
	function Post (post) {
		var _content, _date;

		if(post) {
			_content = post.content || null;
			_date = post.date || null;
		}

		Object.defineProperties(this, {
			'content': {
				get: function () { return _content },
				set: function (val) { _content = val },
				enumerable: false 
			},
			'date': {
				get: function () { return _date },
				set: function (val) { _date = val },
				enumerable: true
			}
		})
	}

	//function Note (note, editor, opts) {
	function Note (note, opts) {	
		note = (note || {}); 

		this.id = (note.id || null)
		this.title = (note.title || null)
		this.publishedAt = (note.publishedAt || null)
		this.post = new Post(note.post)

		var _origContent = '\n',
				_content = '\n'
				//_editor = editor;

		Object.defineProperties(this, {
			'isDirty': {
				get: function () { 
					return (_content !== _origContent); 
					//return (_editor.getValue() !== _origContent)
				},
				set: function (v) { 
					if(!v) { _origContent = _content; }
					//if(!v) { _origContent = _editor.getValue() }
				},
				enumerable: false
			},
			'content': {
				get: function () { 
					return _content 
					//return _editor.getValue()
				},
				set: function (val) {
					// set the content
					_content = val;
					//_editor.setValue(val)
					
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
				enumerable: false
			},
			'modifiedAt': {
				value: note.modifiedAt,
				writable: true,
				enumerable: false
			}
		})

		// after we've defined the hooked setter/getter for content, 
		// lets set it if passed in note has any
		if(note.content) {
			this.content = _origContent = '\n' + note.content.trim();
		}

		var _autosave = {}
		// configure opts
		if(opts && opts.autosave) {
			_autosave = {
				interval: opts.autosave.interval || 30000, // 30secs
				onsuccess: opts.autosave.onsuccess || function (obj) { console.log(obj) },
				onerror: opts.autosave.onerror || function (obj) { console.log(obj); }
			}

			var _note = this;
			$interval(function () {
					if(_note.isDirty) {
						if((_content || '').trim().length === 0) {
							console.log(_content)
							_autosave.onerror("Nothing to save!")
						}
						else {
							_note.$save(
								function (resp) {
									_autosave.onsuccess(resp)
								}, 
								function (errResp) {
									_autosave.onerror(errResp);
							}); // end $save
						}
					}
				}, 
				_autosave.interval, 
				false
			);
		}
	}


	/**
	 * Saves the passed in instance
	 */
	Note.save = function (toSave, callback, errCallback) {
		if((toSave.content || '').trim().length === 0 || !toSave.isDirty)
			errCallback('Nothing to save!')
		else 
			NoteService.save(toSave, callback, errCallback);	
	}

	/**
	 * Saves the instance
	 */
	Note.prototype.$save = function (callback, errCallback) {
		var _note = this; 
		Note.save(this, 
			function (resp, headers) {
				if(resp.note) {
					var saved = resp.note;
					_note.id = saved.id;
					_note.createdAt = saved.createdAt;
					_note.modifiedAt = saved.modifiedAt;
					_note.publishedAt = saved.publishedAt;
					_note.content = saved.content;
					_note.title = saved.title;
					_note.isDirty = false;
					callback(resp.note)
				} else {
					callback({})
				}
			}, 
			errCallback
		);
	}

	Note.remove = NoteService.remove;
	Note.get = NoteService.get
	Note.query = NoteService.query

	Note.publish = function (toPublish, callback, errCallback) {
		NoteService.publish({ id: toPublish.id, 
			post: { date: toPublish.post.date }}, function (resp, headers) {
				toPublish.publishedAt = resp.note.publishedAt
				callback(resp, headers)
			}, errCallback
		);
	}

	Note.unpublish = function (toUnpublish, callback, errCallback) {
		NoteService.unpublish({ id: toUnpublish.id }, function (resp, headers) {
				toUnpublish.publishedAt = null;
				callback(resp, headers)
		}, errCallback);
	}

	return Note;

}])


.factory('UserService', ['$resource', function ($resource) {
	return $resource('/api/users/:id', { id: '@id' });
}])

.service('AuthService', ['$window', 'UserService', function ($window, UserService) {
	return {
		currentUserName: function () {
			return _currentUserName_;
		}
	}
}]) 



