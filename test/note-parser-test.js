var parser = require('../lib/note-parser')
	, should = require('should');


describe('Note Parser', function() {
	describe('Creating new parser', function() {
		it('should fail if dependencies are missing', function() {
				// should(function() { require('../lib/note-parser') })
				// 	.throw(Error)
		})		
	});

	describe('Parsing content', function() {
		it('should return HTML from given Markdown', function() {
			var html = parser.parse('# big heading')
			html.should.eql('<h1 id=\"big-heading\">big heading</h1>\n')
		})
	});

	
})