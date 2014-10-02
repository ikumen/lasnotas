(function() {

	// private variables
	var _parser, 
		_hljs;

	// load marked.js parser and highlight.js if the context
	// we're in has not already done so
	if(typeof marked === 'undefined') {
		if(!(typeof require === 'undefined')) {
			console.log("Can't find marked.js trying to load via 'require'.");
			_parser = require('marked')
			_hljs = require('../highlight.js')
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


	// configure marked.js parser with some
	// sensible defaults
	_parser.setOptions({
		gfm: true,
		pedantic: true,
		sanitize: false,
		highlight: function (code) {
			return _hljs.highlightAuto(code).value
		}
	}); 


	/* 
	 * Converts Note to HTML. 
	 * 
	 * @param src expects String or Note.content attribute containing Markdown 
	 * @param opts optional object containing options
	 * @param callback optional callback(err, obj) see below for obj 
	 *
	 * returns Object if there's no callback. The Object will contain
	 * 	{
	 *			meta : {
	 *				title: String or null
	 *				tags: [String] or empty []
	 *				publishedAt: Date or null
	 *			},
	 *			content: converted Markdown as HTML String
	 *		}
	 */
	// function convert (src, opts, callback) {
	// 	if(typeof callback === 'undefined' && opts instanceof Function) {
	// 		callback = opts;
	// 		opts = {};	
	// 	}
			
	// 	var html = _parser(src, opts);


	// }

	// function parseMeta (src, callback) {

	// }


	/**
	 * Expose public methods
	 */
	var converter = function (src, opts, callback) {
		if(typeof callback === 'undefined' && opts instanceof Function) {
			callback = opts;
			opts = {};
		}
		return _parser(src, opts, callback)
	}
	converter.convert = _parser;
	converter.options = function (opts) {
		if(typeof opts === 'object') 
			_parser.setOptions(opts);
	}



	if(typeof exports === 'object')
		module.exports = converter
	else
		this.noteConverter = converter

})();
