// set up the server
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bcrypt = require("bcrypt");
//setting up cookie parsing
const cookieSession = require('cookie-session');
// const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}))
app.use(bodyParser.urlencoded({
  extended: true
}));

// Objects that are used
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
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

// Helper Functions
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
function lookupPassword(password, database) {
  let boolean = false; 
  for (let user in database) {
    if (database[user].password === password) {
      return true;
    }
  };
  return boolean;
}
function lookupURLs(userID){
  let myURLS = {}
  for (let url in urlDatabase){
    if (urlDatabase[url].userID === userID){
      // myURLS.push(url);
      myURLS[url] = {
        longURL: urlDatabase[url].longURL,
        id: url
      }
    }
  }
  return myURLS;
}

// app.use(cookieParser());

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
  let URLS = lookupURLs(user)
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
  if (req.body.email === '' || req.body.password === ''){
    res.sendStatus(400); 
  };
  let myEmail = req.body.email
  if (!lookupEmail(myEmail, users)){
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
  console.log("In register", users)
})
app.post("/login", (req, res) => {
  if (lookupID(req.body.email, users) !== false) {
    if (bcrypt.compareSync(req.body.password, users[lookupID(req.body.email, users)].password))
    {
      req.session.user_id = lookupID(req.body.email, users)
      res.redirect('/urls');
    } else {
      res.sendStatus(403);
    }
  } else if (lookupID(req.body.email, users) === false) {
    res.sendStatus(403);
  }
}) 
app.post('/logout', (req,res) => {
  console.log("In logout", users)
  res.clearCookie(req.session.user_id)
  let user = req.session.user_id
  let myID = users[user]
  const templateVars = {
    myID,
    urls: urlDatabase
  };
  res.render('login', templateVars )
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
  if (user === undefined){
    res.redirect("/login");
  } else {  
    res.render("urls_new", templateVars);
  }


  
});
app.get("/urls/:shortURL", (req, res) => {
  let user = req.session.user_id
  let myID = users[user]
  let myURL = lookupURLs(user)
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
app.get("/urls/:shortURL/delete", (req, res) => {
  let user = req.session.user_id
  let myID = users[user]
  let myURL = lookupURLs(user)
  if (Object.keys(myURL).includes(req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.sendStatus(403)
  }
})
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
}) 
app.get('/urls/:shortURL/update', (req,res) => {
  let user = req.session.user_id
  let myID = users[user]
  let myURL = lookupURLs(user)
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
app.post('/urls/:shortURL/update', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect("/urls")
})
app.post("/urls", (req, res) => { 
  const shortURL = generateRandomString();
  let longURL = req.body.longURL
  // let user = req.cookies['user_id']
  let myID = req.session.user_id
  urlDatabase[shortURL] ={
    longURL: req.body.longURL,
    userID: myID
  };
  const templateVars = {
    shortURL,
    myID,
    longURL,
    urls: urlDatabase
  }
  res.render('urls_show',templateVars)
  // res.render('urls_index', templateVars) // Respond with 'Ok' (we will replace this)
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});  