# lasnotas

Create simple Markdown-driven blogs.

<a href="https://travis-ci.org/ikumen/lasnotas"><img src="https://travis-ci.org/ikumen/lasnotas.svg?branch=master"/></a>

## About

I wanted to learn the JavaScript stack&mdash;specifically [MEAN](http://en.wikipedia.org/wiki/MEAN)&mdash;and blog what I've learn for reference. [Github Pages](https://pages.github.com) was the obvious choice to host the blog, but in the end I decided to [eat my own dog food](http://en.wikipedia.org/wiki/Eating_your_own_dog_food) and build one&mdash;it'll be more fun and challenging then another [Todo app](http://todomvc.com/).

## Notes

### Initial checkin
- Installed Node.js and Express
- `npm init` to generate `package.json`
- [`express-generator`](http://expressjs.com/guide.html#executable) to create skeleton app

### Let's try TDD
I'm familiar with unit testing and TDD/BDD, mainly on Java stack. On the JavaScript stack, I'm at a complete lost. It's not so much the concepts, instead it's a test framework overload&mdash;there are dozens of libraries and lots of overlap. I'll just pick one and get some work done! I see references to [Mocha] quite a bit so I'll start there. 

Ideally I'd start with a unit test, but I'm still a little uncomfortable with how to do mocks and spies in JavaScript, so I'll do a simple integration type of test.

```javascript
// test/routes-notes-test.js

var request = require('superagent')
    , mongoose = require('mongoose')
    , should = require('should');

function getPath (path) {
    return 'localhost:8080' + path;
}

/* Test routes for Note - /notes */
describe('Route /notes', function() {
    var savedNotes = []
        , notesToSave = [
            { title: 'note1' , content: 'note1 content'}
            , { title: 'note2', content: 'note2 content' }]
        , headers = {
            contentType: ['Content-Type', 'application/json']}

    // seed with some test data
    before(function (done) {
        // with unit test, we would just mock this stuff
        mongoose.connect('mongodb://localhost/lasnotas');
        var Note = require('../server/models/notes')()

        Note.remove(function (err) {
            if(err) throw err

            Note.create(notesToSave, function (err, saved1, saved2) {
                if(err) throw err;

                savedNotes.push(saved1);
                savedNotes.push(saved2);
                done();
            })
        })
    })

    describe('GET /:id', function() {
        it('should return 404 when id not found', function (done) {
            request.get(getPath('/notes/12345'))
                .end(function (res) {
                    res.status.should.eql(404);
                    done();
                })
        })
        it('should return a Note given an id', function (done) {
            request.get(getPath('/notes/' + savedNotes[0]._id))
                .end(function (res) {
                    res.status.should.eql(200);

                    should.exists(res.body.note);
                    var saved = res.body.note;

                    should.exists(saved.content)
                    saved.content.should.eql(savedNotes[0].content)

                    done();
                })
        })
    })
})
```

Running these 2 initial tests will yield

```shell
$ mocha test/routes-notes-test.js

# output
Route /notes
    GET /:id
      ✓ should return 404 when id not found (200ms)
      1) should return a Note given an id


  1 passing (252ms)
  1 failing

  1) Route /notes GET /:id should return a Note given an id:

      Uncaught AssertionError: expected 404 to equal 200
      + expected - actual

      +200
      -404
```

Yeah our first failing test, our passing 404 test is expected since any routes for Note. Let's add route to handle returning a Note given an id.

```javascript
/* GET a Note */
router.get('/:id', function (req, res, next) {
    var id = req.params.id // gets from path variable
    // simple test if id is valid ObjectId
    if(id && id.match(/^[0-9a-fA-F]{24}$/)) {
        Note.findById(req.params.id, function (err, found) {
            if(err)
                return next(err)
            else
                res.status(200).send({ note: found })
        })
    }
    else {
        // helper for sending 404 status
        sendNotFound(res);
    }
});
```

Running our tests again and we get

```shell
$ mocha test/routes-notes-test.js 

# output
  Route /notes
    GET /:id
      ✓ should return 404 when id not found 
      ✓ should return a Note given an id 


  2 passing (62ms)
```

Sweet! Continue with several more iterations of write test, fail test, implement feature, pass test and we'll eventually have our feature set and tests to back them up.

Next I'll look into some mocking frameworks and rewrite the test so that I'm testing in isolation&mdash;a single unit of work&mdash;which is our ultimate goal.

### CI with Travis
To start, I dded a `.travis.yml` YAML file to the project (NOTE: don't use tabs), then configured with the following.

```yaml
language: node_js
node_js:
  - "0.10"
services: 
  - mongodb  
before_script:
  - node bin/www &
env:
  - env=development
```

The first two entries and last are pretty self-explanatory. 

```yaml
services:
  - mongodb
```
Travis can provides [services](http://docs.travis-ci.com/user/database-setup/) for your application during testing&mdash;MongoDB in my case.

```yaml
before_script:
  - node bin/www &
```

`before_script` is one of the events of a [complete Travis life cycle](http://docs.travis-ci.com/user/build-lifecycle/). It's called before the test script, so it's a good place to put dependencies&mdash;like starting your application if you're running an integration style test. I used [`&`](http://www.thegeekstuff.com/2010/05/unix-background-job/) put my script to the background otherwise the life cycle will hang waiting for control to be handed back to it before executing the test scripts.

# Stories
Let's hash out some requirements and a backlog.

As a user I want an online blog/note taking app
    1. should be able to access the app online
    2. should be able to create a note
        1. should be able to edit the note in Markdown
        2. should be able to preview the note as I edit
    3. should be able to publish/share the note
        1. the Markdown note should be converted html
        2. the publishing should be as simple as possible
        
    


# Normalizing Model.id
By default, Mongoose creates a virtual getter `id` which returns the document `_id` field. To use this field, you can pass the `toObject/toJSON` functions an option to enable it on a per-instance basis. 

```javascript
doc.toObject({ virtuals: true })
doc.toJSON({ virtuals: true })
```

Or enable it at the schema level for all instances of a schema

```javascript
schema.set('toObject', { virtuals: true })
schema.set('toJSON', { virtuals: true })

doc.toJSON() //-> { _id: 542a5f6b655fdc7e24043e16, id: 542a5f6b655fdc7e24043e16, .... }
```

But you'll notice that both _id and id are returned. These isn't a big deal on the back-end but at the API level response to client, it might be a good idea to remove the _id and only send back id. So I added a simple normalizing function to remove `_id` on `toJSON` calls, and enable use of `id` to both toObject and toJSON. 

```javascript
var schemaUtils = {
  remove_id: function (doc, ret, options) {
    delete ret._id;
  }
  , normalize_id: function (schema) {
    schema.set('toObject', { transform: virtuals: true });
    schema.set('toJSON', { transform: this.remove_id, virtuals: true });
    return schema;
  }
  ...
}

// normalize id for NoteSchema
schemaUtils.normalize_id(NoteSchema);
```

# 2. should be able to create a note


# Markdown Parser
Although creating a Markdown parser would have been a cool and challenging project, I decided to use a third party lib&mdash;specifically [marked](https://github.com/chjj/marked). Notes will be submitted in raw Markdown to server, there it will get saved. 




