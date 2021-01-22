// set up the server
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const methodOverride = require('method-override');
app.set("view engine", "ejs");
const bcrypt = require("bcrypt");
const {
  generateRandomString,
  lookupEmail,
  lookupID,
  lookupURLs
} = require('./helpers');
 
//Allows for Cookies
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

// Allows for using methods apart from GET and POST
app.use(methodOverride('_method'));

// Objects that are used
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    count: 0,
    uniqueVisitors: {}
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
    count: 0,
    uniqueVisitors: {}
  }
};

const users = {
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
 
// Creating endpoints

// Redirects to home page if user has account, or to login if there isn't one on file
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/register');
  }
});
// Generates home page with list of shortened URLs by user
app.get("/urls", (req, res) => {
  let user = req.session.user_id;
  let myID = users[user];
  let URLS = lookupURLs(user, urlDatabase);
  const templateVars = { 
    URLS,
    myID,
  };
  res.render('urls_index', templateVars);
});
// Login page
app.get('/login', (req, res) => {
  let user = req.session.user_id;
  let myID = users[user];
  const templateVars = {
    myID,
    urls: urlDatabase
  };
  res.render('login', templateVars);
});
// when being directed tp Registration page
app.get('/register', (req, res) => {
  let user = req.session.user_id;
  let myID = users[user];
  const templateVars = {
    myID,
    urls: urlDatabase
  };
  res.render('register', templateVars);
});
// When submitting email and password on registration page
app.post('/register', (req, res) => {
  let id = generateRandomString();
  if (req.body.email === '' || req.body.password === '') {
    res.sendStatus(400);
  }
  let myEmail = req.body.email;
  if (!lookupEmail(myEmail, users)) {
    res.sendStatus(400);
  }
  users[id] = {
    id: id,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10) // hashing Password
  };
  req.session.user_id = lookupID(req.body.email, users);
  res.redirect('/urls');
});
// when entering credientals for login page
app.post("/login", (req, res) => {
  if (lookupID(req.body.email, users) !== false) {
    // Comparing password with one on file (which is encrypted)
    if (bcrypt.compareSync(req.body.password, users[lookupID(req.body.email, users)].password)) {
      req.session.user_id = lookupID(req.body.email, users);
      res.redirect('/urls');
    } else {
      // if the password is wrong
      res.sendStatus(403);
      res.redirect('/register');
    }
  } else if (lookupID(req.body.email, users) === false) {
    // if we don't have record of the email
    res.sendStatus(403);
  }
});
// Logout route
app.post('/logout', (req, res) => {
  res.redirect('/login');
});
// Re-routes client to longURL, and tracks unique visitors to be displayed
app.get("/u/:shortURL", (req, res) => {
  // Creates a cookie with a random ID and an associate date
  req.session.unique = {ID: generateRandomString(), Date: Date()};
  let user = req.session.user_id;
  let myURL = lookupURLs(user, urlDatabase);
  // if the url isn's associated with the user
  if (!Object.keys(myURL).includes(req.params.shortURL)) {
    // adding the cookie object uniqueVisitors object in urlDatabase
    urlDatabase[req.params.shortURL].uniqueVisitors[req.session.unique.ID] = req.session.unique;
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
});
// When creating a new ShortURL
app.get("/urls/new", (req, res) => {
  let user = req.session.user_id;
  let myID = users[user];
  const templateVars = {
    myID,
    urls: urlDatabase
  };
  if (user === undefined) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});
// Renders page where user can see stats on shortURL, and edit it
app.get("/urls/:shortURL", (req, res) => {
  let user = req.session.user_id;
  let myID = users[user];
  let myURL = lookupURLs(user, urlDatabase);
  let count =  myURL[req.params.shortURL].count;
  // if the user owns the short URL
  if (Object.keys(myURL).includes(req.params.shortURL)) {
    // increase the amount of times that page has been viewed
    urlDatabase[req.params.shortURL].count += 1;
    const templateVars = {
      myID,
      shortURL: req.params.shortURL,
      longURL: myURL[req.params.shortURL].longURL,
      count: count,
      myVisitors: urlDatabase[req.params.shortURL].uniqueVisitors
    };    
    res.render('urls_show', templateVars);
  } else {
    res.status(404);
    res.send("This isn't your key!");
  }
});
// Will delete a shortURL
app.delete("/urls/:shortURL", (req, res) => {
  let user = req.session.user_id;
  let myURL = lookupURLs(user, urlDatabase);
  //if user is the owner of that shortURL
  if (Object.keys(myURL).includes(req.params.shortURL)) {
    // delete the shortURL
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.sendStatus(403);
  }
});
// Will edit a particular shortURL
app.put('/urls/:shortURL', (req, res) => {
  let user = req.session.user_id;
  let myID = users[req.session.user_id];
  let myURL = lookupURLs(user, urlDatabase);
  // if the user owns the shortURL
  if (Object.keys(myURL).includes(req.params.shortURL)) {
    // edit the assigned longURL
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    const templateVars = {
      myID,
      shortURL: req.params.shortURL,
      longURL: req.body.longURL,
      count: myURL[req.params.shortURL].count,
      myVisitors: urlDatabase[req.params.shortURL].uniqueVisitors
    };
    res.render('urls_show', templateVars);
  } else {
    res.sendStatus(403);
  }
});
// Generates home page while updating the database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let myID = req.session.user_id;
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: myID,
    count: 1,
    uniqueVisitors: {}
  };
  const templateVars = {
    id: users[myID].email,
    shortURL,
    myID,
    longURL,
    URLS: lookupURLs(myID, urlDatabase)
  };
  res.render('urls_index', templateVars);
});
// Catch route, will redirect anything that isn't previously specified to login page
app.get("*", (req, res) => {
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
}); console;
