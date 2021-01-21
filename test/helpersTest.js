const { assert } = require('chai');

const { lookupEmail } = require('../helpers.js');
const { lookupID} = require('../helpers');
const { lookupURLs } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

describe('lookupEmail', function() {
  it('should return true if email matches on in database', function() {
    const user = lookupEmail("user@example.com", testUsers);
    const expectedOutput = 'true';
    assert((user, expectedOutput), true);
  });
});

describe('lookupID', function (){
  it('Return user ID if given an email or false if no email exists', function (){
    const user = lookupID("user@example.com", testUsers);
    const expectedOutput = 'userRandomID'; 
    assert((user, expectedOutput), true)
    
  })
  it("Returns false if email doesn't exist", function(){
    const user = lookupID("user3@example.com", testUsers);
    const expectedOutput = 'false';
    assert((user,expectedOutput), true);
  })
})

describe('lookupURLs', function(){
  it('Should return an object with the URLs available to that user', function (){
    const user = lookupURLs('userRandomID', urlDatabase);
    const expectedOutput = {  "b2xVn2": {
      longURL: "http://www.lighthouselabs.ca",
      userID: "userRandomID"
    }, };
    assert((user, expectedOutput), true)
  })
})