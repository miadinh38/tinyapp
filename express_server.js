const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { get } = require("request");

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");


// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

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

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
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

const getUserByEmail = function(email) {
  for (const userId in users) {
    if (email === users[userId].email) {
      return users[userId];
    }
  }
  return null;
}; 




/*************************************  MIDDLEWARE *************************************/
/***************************************************************************************/


app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());



/***************************************************************************************/
/*********************************   GET ENDPOINTS  ************************************/


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

  const urlsForUser = function(id) {
    const userUrls = {};
    for (const urlId in urlDatabase) {
      if (urlDatabase[urlId].userID === id) {
        userUrls[urlId] = urlDatabase[urlId];
      }
    }
    return userUrls;
  };

  // redirect to /login if user not logged in
  if(!userId) {
    res.status(403).send("You have to log in first")
    return res.redirect("/login");
  }
  
  const userUrls = urlsForUser(userId);

  const templateVars = { 
    urls: userUrls,
    user: user // Pass the user information to the template
  };

  res.render("urls_index", templateVars);

});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  
  const templateVars = {
    user: user 
  };

  // redirect to /login if user not logged in
  if(!userId) {
    res.redirect("/login");
  }
  
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const id = req.params.id;
  const url = urlDatabase[id];


  if(!userId) {
    return res.status(403).send("You have to log in first");
  }

  if (!url) {
    return res.status(404).send("URL not found");
  }

  if (url.userID !== userId) {
    return res.status(403).send("You do not have permission to access this URL");
  }
  
  const templateVars = { 
    id: id, 
    longURL: urlDatabase[id].longURL,
    user: user
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longUrl.longUrl;

  if(!longURL) {
    res.status(404).send("The short URL does not exist");
  } else {
    res.redirect(longURL);
  }
});

app.get("/register", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  const templateVars = {
    user: user 
  };

  // redirect to /urls if user is already logged in
  if(userId) {
    res.redirect("/urls");
  }

  res.render("register", templateVars);

});

app.get("/login", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  const templateVars = {
    user: user 
  };

  // redirect to /urls if user is already logged in
  if(userId) {
    res.redirect("/urls");
  }

  // render the template if the user is not logged in
  res.render("login", templateVars);  
});




/***************************************************************************************/
/********************************   POST ENDPOINTS  ************************************/


app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userId = req.cookies.user_id;

  if (!userId) {
    return res.status(403).send("You must be logged in to shorten the URLs");
  }

  if (longURL) {
    const id = generateRandomString();

    // Save new id-longURL pair to database
    urlDatabase[id] = {
      longURL: longURL,
      userID: userId
    };


    // Redirect to /urls/:id
    res.redirect(`urls/${id}`);
  }
  console.log(urlDatabase);
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies.user_id;
  const id = req.params.id;
  const url = urlDatabase[id];

  // Check if the URL exists
  if (!url) {
    return res.status(404).send("URL not found");
  }

  // Check if the user is logged in
  if (!userId) {
    return res.status(403).send("You must be logged in to delete URLs");
  }

  // Check if the user owns the URL
  if (url.userID !== userId) {
    return res.status(403).send("You do not have permission to delete this URL");
  }
  
  if (urlDatabase.hasOwnProperty(id)) {
    delete urlDatabase[id];
  }
  res.redirect(`/urls`);
});

app.post("/urls/:id/edit", (req,res) => {
  const userId = req.cookies.user_id;
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    return res.status(404).send("URL not found");
  }

  if (!userId) {
    return res.status(403).send("You must be logged in to edit URLs");
  }

  if (url.userID !== userId) {
    return res.status(403).send("You do not have permission to edit this URL");
  }

  // Update the longURL in the urlDatabase
  const newLongURL = req.body.longURL;
  urlDatabase[id].longURL = newLongURL;

  // Redirect to /urls or any other appropriate page after editing
  res.redirect("/urls");
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Handle error when a user with the email can't be found
  if(!getUserByEmail(email)) {
    return res.status(403).send("Your email is incorrect");
  }

  // Find the user
  const foundUser = getUserByEmail(email);

  // Handle error when a user with the password doesn't match
  if(password !== foundUser.password) {
    return res.status(403).send("Your password is incorrect");
  }


  res.cookie('user_id', foundUser.id);
  res.redirect('/urls');
});

// Implement logout endpoint and clear coookies
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// Handle registration form submission
app.post("/register", (req, res) => {
  const newUser = { ...req.body };
  newUser.id = generateRandomString();

  const { email, password } = req.body;

  // check if the user exists
  if(getUserByEmail(email)) {
    return res.status(400).send("User already exists!");
  }

  // check if email or password is empty
  if (newUser.email === '' || newUser.password === '') {
    res.status(400).send("Email or Password is empty!")
  }

  // add a new user to users object
  users[newUser.id] = newUser;

  res.cookie('user_id', newUser.id);
  console.log(users);
  res.redirect('urls');
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

