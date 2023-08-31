const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { get } = require("request");

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};



function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
}


/*************************************  MIDDLEWARE *************************************/
/***************************************************************************************/


app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

/***************************************************************************************/
/***************************************************************************************/




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
  const userId = req.cookies.user_id;
  const user = users[userId];

  const templateVars = { 
    urls: urlDatabase,
    user: user
  };
  
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if(!longURL) {
    res.status(404).send("Not Found");
  } else {
    res.redirect(longURL);
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

/***************************************************************************************/
/********************************   POST ENDPOINTS  ************************************/


app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  if (longURL) {
    const id = generateRandomString();

    // Save new id-longURL pair to database
    urlDatabase[id] = longURL;

    // Redirect to /urls/:id
    res.redirect(`urls/${id}`);
  }
  console.log(urlDatabase);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (urlDatabase.hasOwnProperty(id)) {
    delete urlDatabase[id];
  }
  res.redirect(`/urls`);
});

app.post("/urls/:id/edit", (req,res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;

  if (urlDatabase.hasOwnProperty(id)) {
    urlDatabase[id].longURL = longURL;
  }
  res.redirect(`/urls`); 
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { username } = req.body;
  const user = users[username];

  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

// Implement logout endpoint and clear coookies
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Handle registration form submission
app.post("/register", (req, res) => {
  const newUser = { ...req.body };
  newUser.id = generateRandomString();

  // add a new user to users object
  users[newUser.id] = newUser;

  // check if email or password is empty
  if (newUser.email === '' || newUser.password === '') {
    res.status(400).send("Email or Password is empty!")
  }
  
  // check if the user exists
  // const foundUser = user.find(user => {
  //   return user.email = newUser.email;
  // })
  // if (foundUser) {
  //   return res.status(400).send("User already exists!");
  // }

  const getUserByEmail = function(email) {
    for (const userId in users) {
      if (email === users[userId].email) {
        return true;
      }
    }
    return false;
  };

  const { email, password } = req.body;

  if(getUserByEmail(email)) {
    return res.status(400).send("User already exists!");
  }


  res.cookie('user_id', newUser.id);
  console.log(users);
  res.redirect('urls');
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

