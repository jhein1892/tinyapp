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
 
//setting up cookie parsing
const cookieSession = require('cookie-session');

const bodyParser = require("body-parser");
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({
  extended: true
}));

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
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});
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
app.get('/login', (req, res) => {
  let user = req.session.user_id;
  let myID = users[user];
  const templateVars = {
    myID,
    urls: urlDatabase
  };
  res.render('login', templateVars);
});
app.get('/register', (req, res) => {
  let user = req.session.user_id;
  let myID = users[user];
  const templateVars = {
    myID,
    urls: urlDatabase
  };
  res.render('register', templateVars);
});
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
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = lookupID(req.body.email, users);
  res.redirect('/urls');
});
app.post("/login", (req, res) => {
  if (lookupID(req.body.email, users) !== false) {
    if (bcrypt.compareSync(req.body.password, users[lookupID(req.body.email, users)].password)) {
      req.session.user_id = lookupID(req.body.email, users);
      res.redirect('/urls');
    } else {
      res.sendStatus(403);
      res.redirect('/register');
    }
  } else if (lookupID(req.body.email, users) === false) {
    res.sendStatus(403);
  }
});
app.post('/logout', (req, res) => {
  res.redirect('/login');
});
app.get("/u/:shortURL", (req, res) => {
  req.session.unique = {ID: generateRandomString(), Date: Date()};
  let user = req.session.user_id;
  let myURL = lookupURLs(user, urlDatabase);
  if (!Object.keys(myURL).includes(req.params.shortURL)) {
    urlDatabase[req.params.shortURL].uniqueVisitors[req.session.unique.ID] = req.session.unique;
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
});
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
app.get("/urls/:shortURL", (req, res) => {
  let user = req.session.user_id;
  let myID = users[user];
  let myURL = lookupURLs(user, urlDatabase);
  let count =  myURL[req.params.shortURL].count;
  if (Object.keys(myURL).includes(req.params.shortURL)) {
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
app.delete("/urls/:shortURL", (req, res) => {
  let user = req.session.user_id;
  let myURL = lookupURLs(user, urlDatabase);
  if (Object.keys(myURL).includes(req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.sendStatus(403);
  }
});
app.put('/urls/:shortURL', (req, res) => {
  let user = req.session.user_id;
  let myID = users[req.session.user_id];
  let myURL = lookupURLs(user, urlDatabase);
  if (Object.keys(myURL).includes(req.params.shortURL)) {
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
  // res.render('urls_index', templateVars) // Respond with 'Ok' (we will replace this)
});
app.get("*", (req, res) => {
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
}); console;
