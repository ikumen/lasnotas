'use strict';

(function(exports) {
	// local scope holders
	var _parser 
		, _hljs;

	// load marked.js parser and highlight.js if the context
	// we're in has not already done so
	if(typeof marked === 'undefined') {
		if(!(typeof require === 'undefined')) {
			console.log("Can't find marked.js trying to load via 'require'.");
			_parser = require('marked')
			_hljs = require('./highlight.js')
		}
	} else {
		// they exists on external context, we're probably in browser
		// let's set them to local scope
		_parser = marked;
		_hljs = hljs;
	}

	// verify parser loading was successful
	if(typeof _parser === 'undefined')
		throw new Error('Unable to load marked.js parser!');
	 if(typeof _hljs === 'undefined')
	 	throw new Error('Unable to load highlight.js!');

	// configure marked.js parser
	_parser.setOptions({
		gfm: true
		// , highlight: function (code) {
		// 	return _hljs.highlightAuto(code).value}
		, pedantic: true
		, sanitize: false
	}); 

	/*
	 * Parses Markdown content to HTML.
	 * 	- content is assumed to be markdown
	 *		- returns HTML
	 */
	exports.parse = function (content) {
		return _parser(content);
	}

})(typeof exports === 'undefined' ? this['note-parser']={} : exports);