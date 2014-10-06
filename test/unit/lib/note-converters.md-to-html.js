var converter = require('../../../lib/note-converters/md-to-html'),
	utils = require('../../../lib/utils'),
	should = require('should');

var testMarkdown = "---\n"+
	"title: \"Spring Security\"\n"+ 
	"tags: dev, java, spring\n"+
	"date: 2012-01-15\n---\n"+
	"On a recent project ...\n\n"+
	"## Heading two\n\n"+
	"-some em-\n\n"+
	"Here's a list of stuff\n"+
	"- dsfsdfdsf\n"+
	"- sdfdsfds\n"+
	"- sdfsdf\n";

describe('Convert Note to HTML', function() {
	describe('Convert content', function() {
		it('should return HTML from given Markdown', function() {
			converter({ content: testMarkdown }, function (err, converted) {
				// verify converted is obj of form { content: .., title:, tags:, publishedAt: }
				(!utils.isUndefined(converted) &&
					!utils.isUndefined(converted.content) &&
					!utils.isUndefined(converted.tags) &&
					!utils.isUndefined(converted.publishedAt) &&
					!utils.isUndefined(converted.title)
				).should.be.true;

				converted.content.should.match(/^<p>On a recent/);
				converted.title.should.match(/Spring Security/)
				converted.publishedAt.should.match(/2012-01-15/)
				converted.tags.should.be.instanceof(Array).and.have.lengthOf(3)
			})
		})
	});

})