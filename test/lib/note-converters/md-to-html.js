var converter = require('../../../lib/note-converters/md-to-html')
	, should = require('should');

describe('Convert Note to HTML', function() {
	describe('Convert content', function() {
		it('should return HTML from given Markdown', function() {
			var html = converter('# big heading')
			//console.log(new converter('# big heading'))
			html.should.eql('<h1 id=\"big-heading\">big heading</h1>\n')		
		})
	});

})