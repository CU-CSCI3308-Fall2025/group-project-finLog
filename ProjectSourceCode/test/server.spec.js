// ********************** Initialize server **********************************

const server = require('../../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************


// *********************** ADDITIONAL UNIT TESTCASES **************************

describe('Additional Server endpoints', () => {
    it('GET /logout should redirect to /login (or render logout confirmation)', done => {
        chai
          .request(server)
          .get('/logout')
          // prevent chai-http from following redirects so we can inspect the initial response
          .redirects(0)
          .end((err, res) => {
            // If request failed completely, surface the error
            if (err && !res) return done(err);
    
            // If the server responds with a redirect (common behavior)
            if (res.status === 302 || res.status === 301) {
              expect(res).to.have.header('location');
              expect(res.header.location).to.include('/login');
              return done();
            }
    
            // Otherwise some apps render a logout confirmation page (200). Be permissive:
            expect(res).to.have.status(200);
            // check for some common logout wording in the response body — update if your app uses different text
            expect(res.text.toLowerCase()).to.satisfy(txt => txt.includes('logged out') || txt.includes('logout') || txt.includes('you have been logged out'));
            done();
          });
    });
  
    it('POST /upload should accept a file and return success JSON', done => {
      chai
        .request(server)
        .post('/upload')
        .attach('file', Buffer.from('this is a test file'), 'test.txt')
        .field('title', 'test upload') 
        .end((err, res) => {
          if (err && !res) return done(err);
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('status');
          expect(res.body.status).to.equal('success');
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });
  




// ********************************************************************************