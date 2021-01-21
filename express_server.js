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
} = require('./helpers')
 
//setting up cookie parsing
const cookieSession = require('cookie-session');

const bodyParser = require("body-parser");
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}))

app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({
  extended: true
}));

// Objects that are used
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
  res.send("Hello!");
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/urls", (req, res) => {
  let user = req.session.user_id
  let myID = users[user]
  let URLS = lookupURLs(user, urlDatabase)
  // console.log(myID)
  // console.log("In the /urls", Object.keys(URLS))
  const templateVars = {
    URLS,
    myID,
  }
  res.render('urls_index', templateVars);

});
app.get('/login', (req, res) => {
  req.session.user_id
  let myID = users[user]
  const templateVars = {
    myID,
    urls: urlDatabase
  }
  res.render('login', templateVars)
})
app.get('/register', (req, res) => {
  res.render('register')
})
app.post('/register', (req, res) => {
  let id = generateRandomString()
  if (req.body.email === '' || req.body.password === '') {
    res.sendStatus(400);
  };
  let myEmail = req.body.email
  if (!lookupEmail(myEmail, users)) {
    res.sendStatus(400)
  };
  // const hashedPassword = bcrpyt.hashSync()
  users[id] = {
    id: id,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  }
  req.session.user_id = lookupID(req.body.email, users)
  res.redirect('/urls');
})
app.post("/login", (req, res) => {
  if (lookupID(req.body.email, users) !== false) {
    if (bcrypt.compareSync(req.body.password, users[lookupID(req.body.email, users)].password)) {
      req.session.user_id = lookupID(req.body.email, users)
      res.redirect('/urls');
    } else {
      res.sendStatus(403);
    }
  } else if (lookupID(req.body.email, users) === false) {
    res.sendStatus(403);
  }
})
app.post('/logout', (req, res) => {
  console.log("In logout", users)
  req.session = null
  const templateVars = {
    urls: urlDatabase
  };
  res.render('login', templateVars)
})
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL].longURL)
})
app.get("/urls/new", (req, res) => {

  let user = req.session.user_id
  let myID = users[user]
  console.log(user)

  const templateVars = {
    myID,
    urls: urlDatabase
  }
  if (user === undefined) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }



});
app.get("/urls/:shortURL", (req, res) => {
  let user = req.session.user_id
  let myID = users[user]
  let myURL = lookupURLs(user, urlDatabase)
  console.log(myURL.length)
  if (Object.keys(myURL).includes(req.params.shortURL)) {
    const templateVars = {
      myID,
      shortURL: req.params.shortURL,
      longURL: myURL[req.params.shortURL].longURL
    };
    res.render('urls_show', templateVars);
  } else {
    res.status(404);
    res.send("This isn't your key!")
  }
})
app.delete("/urls/:shortURL", (req, res) => {
  let user = req.session.user_id
  let myID = users[user]
  let myURL = lookupURLs(user, urlDatabase)
  if (Object.keys(myURL).includes(req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.sendStatus(403)
  }
})

app.put('/urls/:shortURL/update', (req, res) => {
  let user = req.session.user_id
  let myID = users[user]
  let myURL = lookupURLs(user, urlDatabase)
  if (Object.keys(myURL).includes(req.params.shortURL)) {
    const templateVars = {
      myID,
      shortURL: req.params.shortURL,
      longURL: myURL[req.params.shortURL].longURL
    };
    res.render('urls_show', templateVars)
  } else {
    res.sendStatus(403)
  }
})
// app.put('/urls/:shortURL/update', (req, res) => {
//   urlDatabase[req.params.shortURL] = req.body.longURL
//   res.redirect("/urls")
// })
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  let longURL = req.body.longURL
  // let user = req.cookies['user_id']
  let myID = req.session.user_id
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: myID
  };
  const templateVars = {
    shortURL,
    myID,
    longURL,
    urls: urlDatabase
  }
  res.render('urls_show', templateVars)
  // res.render('urls_index', templateVars) // Respond with 'Ok' (we will replace this)
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});