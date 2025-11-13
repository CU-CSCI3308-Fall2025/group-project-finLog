// ********************** Initialize server **********************************

const server = require('../../src/index.js'); //TODO: Make sure the path to your index.js is correctly added

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
  const str = randomString = Math.random().toString(36).substring(2, 15);
    it('GET /logout should redirect to /home (or render logout confirmation)', done => {
        chai
          .request(server)
          .get('/logout')
          .redirects(0)
          .end((err, res) => {
            if (err && !res) return done(err);
            if (res.status === 302 || res.status === 301) {
              expect(res).to.have.header('location');
              expect(res.header.location).to.include('/home.html');
              return done();
            }
            expect(res).to.have.status(200);
            expect(res.text.toLowerCase()).to.satisfy(txt => txt.includes('logged out') || txt.includes('logout') || txt.includes('you have been logged out'));
            done();
          });
    });

    it('Successful Registration', (done) => {
      chai
        .request(server)
        .post('/registration')
        .send({ username: str, password: 'password'})
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.equal('success');
          expect(res.body).to.have.property('user');
          expect(res.body.user.username).to.equal(randomUsername);
          done();
        });
    });
  
    it('Fail Registration', done => {
        chai
          .request(server)
          .post('/register')
          .type('form')
          .send({ username: str, password: 'password' }) 
          .end((err, res) => {
            expect(res).to.have.status(500);
            //expect(res.body.status).to.equals('error');
            done();
          });
    });
    
  });
  




// ********************************************************************************