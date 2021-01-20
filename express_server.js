const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')

app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16);
}
app.use(cookieParser());
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
  let username = req.cookies['username']

    const templateVars = {
      username,
      urls: urlDatabase
    }
    res.render('urls_index', templateVars);

});
// app.get("/login", (req, res) => {
//   res.render('login')
// })
app.get('/register', (req, res) => {
  res.render('register')
})
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username)
  let username = req.body.username
  
      const templateVars = {
      username,
      urls: urlDatabase
    }
    res.render('urls_index', templateVars);

}) 
app.post('/logout', (req,res) => {
  res.clearCookie('username')
  res.cookie('username', req.body.username)
  let username = req.body.username
  delete req.cookies['username'];
  const templateVars = {
    username,
    urls: urlDatabase
  };
  res.render('urls_index', templateVars )
})
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL])
})
app.get("/urls/new", (req, res) => {
  let username = req.cookies['username']

  const templateVars = {
    username,
    urls: urlDatabase
  }
  res.render("urls_new", templateVars);
});
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
})
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
}) 
app.post('/urls/:shortURL/update', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect("/urls")
})
app.post("/urls", (req, res) => {
  const short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  console.log(req.body); // Log the POST request body to the console
  let username = req.cookies['username']

  const templateVars = {
    username,
    urls: urlDatabase
  }
  res.redirect(`/urls/${short}`)
  res.render('urls_index', templateVars) // Respond with 'Ok' (we will replace this)
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
}); 