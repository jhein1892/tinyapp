function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16);
}
function lookupEmail(email, database){
  let boolean = true; 
  for (let user in database) {
    if (database[user].email === email) {
      return false;
    }
  };
  return boolean;
};
function lookupID(email, database){
  let boolean = false; 
  for (let user in database) {
    if (database[user].email === email) {
      return database[user].id
    }
  };
  return boolean;
}
function lookupURLs(userID, database){
  let myURLS = {}
  for (let url in database){
    if (database[url].userID === userID){
      myURLS[url] = {
        longURL: database[url].longURL,
        id: url
      }
    }
  }
  return myURLS;
}

module.exports = {
  generateRandomString,
  lookupEmail,
  lookupID,
  lookupURLs
}