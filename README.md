# lasnotas

Create simple Markdown-driven blogs.

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


