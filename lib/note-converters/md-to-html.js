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

	// looks for front matter denoted by starting and ending '---'.
	// this will produce an array of matches when 'exec'
	var frontMatterRE = /---([\s\S]*?)---/i;
	// looks for the following metadata attributes in our front matter
	var matterAttrRE = /(tags|title|date):([\s\S]*)/i;
	// check if string contains date format 'yyyy-mm-dd'
	var pubDateRE = /\d{4}-\d{2}-\d{2}/;

	//TODO: how to share between browser and node if in external utils
	function _isUndefined (obj) {
		return (typeof obj === 'undefined')
	}
	function _isFunction (obj) {
		return (!_isUndefined(obj) && typeof obj === 'function')
	}

	function _execRE(RE, src, matches, onMatch) {
		var results = RE.exec(src);
		if(Array.isArray(results) && results.length >= matches) 
			onMatch(results);
	}

	// Parses a comma delim list of zero or more tags
	function _parseTagsAttr (value) {
		var tags = []
		var values = value.split(',');
		if(Array.isArray(values) && values.length > 0) {
			for(var i=0; i < values.length; i++) {
				var tag = values[i].trim();
				if(tag && tags.indexOf(tag) == -1) {
					tags.push(tag)
				}
			}
		}
		return tags
	}
	// doesn't really parse the date, just checks 
	// string is in correct format
	function _parseDateAttr (value) {
		if(pubDateRE.test(value)) 
			return value;
		return null;
	}

	/**
	 * Parse the src for inclusion of front matter attributes (e.g title, tags)
	 * Note: frontMatterRE regex will produce: 
	 *		['---\ntitle: Spring Security\ntags: dev, java, spring\ndate: 2012-12-01\n---',
	 *			'\ntitle: Spring Security\ntags: dev, java, spring\ndate: 2012-12-01\n',
	 *			index: 0, -- the match
	 *			input: src ]
  	 */
	function _parseFrontMatter (src, callback) {
		var matter = {}
		// extract the front matter
		_execRE(frontMatterRE, src, 2, function (results) {
			// split each line of front matter
			var attrs = results[0].trim().split('\n');
			// for each front matter, try to parse for it's attribute value
			for(var i=0; i < attrs.length; i++) {
				_execRE(matterAttrRE, attrs[i].trim(), 3, function (attr) {
					var name = (attr[1] || '').trim(),
						value = (attr[2] || '').trim();

					if('tags' == name) 
						matter.tags = _parseTagsAttr(value);
					else if('title' == name)
						matter.title = value
							.replace(/^['|"]/, '')	// unquote beginning
							.replace(/['|"]$/, ''); // unquote ending
					else if('date' == name)
						matter.publishedAt = _parseDateAttr(value)
				})
			}
		});

		callback(null, matter);
	}

	/** 
	 * Parses input source (actual string or object containing content) and 
	 * converts into Object containing HTML equivalent content and it's matter data.
	 *
	 * @param src String/Object.content containing the Markdown to parse and convert
	 * @param [opts] Object containing parsing instructions
	 * @param [callback] on success the function call, given err and converted obj
	 *
	 * callback(err, {
	 *		matter: {
	 *			title: String,
	 *			tags: String Array or [],
	 *			publishedAt: Date or null
	 *		},
	 *		content: HTML String (parsed from Markdown)
	 *	});
	 * 
	 */
	function convert (src, opts, callback) {
		if(_isUndefined(callback) && _isFunction(opts)) {
			callback = opts;
			opts = {};	
		}
		// make sure we work with content (e.g. string), not object (e.g Note)
		var content = ((src instanceof Object ? src.content : src) || '')

		// just body, with no front matter
		var body = content.replace(frontMatterRE, '');
		// parse body to HTML (done by external lib marked.js)
		_parser(body, opts, function (err, html) {
			if(err)
				callback(err);
			else {
				// if body was successful, let's also parse front matter
				_parseFrontMatter(content, function(err, matter) {
					callback(null, {
						content: html,
						title: matter.title,
						tags: matter.tags,
						publishedAt: matter.publishedAt
					})
				})
			}
		})
	}


	/**
	 * Expose public methods
	 */
	var converter = convert;
	converter.convert = convert;
	converter.options = function (opts) {
		if(typeof opts === 'object') 
			_parser.setOptions(opts);
	}


	// export converter
	if(typeof exports === 'object')
		module.exports = converter
	else
		this.noteConverter = converter

})();
