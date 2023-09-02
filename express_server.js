const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString } = require("./helpers");
const { PORT, users, urlDatabase } = require("./data");
const app = express();



/*************************  MIDDLEWARE ****************************/
/******************************************************************/

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['535435354bdbtrtbrt45'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))



/*******************************************************************/
/***********************   GET ENDPOINTS  **************************/


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
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
  if(!user) {
    return res.status(403).send("You have to log in first. <a href='/login'>Click here to login</a>"); 
  }
  
  const userUrls = urlsForUser(userId);

  const templateVars = { 
    urls: userUrls,
    user: user // Pass the user information to the template
  };

  res.render("urls_index", templateVars);

});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
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
  const userId = req.session.user_id;
  const user = users[userId];
  const id = req.params.id;
  const url = urlDatabase[id];


  if(!userId) {
    return res.status(403).send("You have to log in first. <a href='/login'>Click here to login</a>");
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
  const userId = req.session.user_id;
  const user = users[userId];

  const templateVars = {
    user: user 
  };

  // redirect to /urls if user is already logged in
  if(user) {
    return res.redirect("/urls");
  }

  res.render("register", templateVars);

});

app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  const templateVars = {
    user: user 
  };

  // redirect to /urls if user is already logged in
  if(user) {
    return res.redirect("/urls");
  }

  // render the template if the user is not logged in
  res.render("login", templateVars);  
});




/***************************************************************/
/********************   POST ENDPOINTS  ************************/


app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userId = req.session.user_id;

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
    res.redirect(`/urls/${id}`);
  }
  console.log(urlDatabase);
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
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
  const userId = req.session.user_id;
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
  const foundUser = getUserByEmail(email, users);

  // Handle error when the email can't be found or password doesn't match
  if(!foundUser || !bcrypt.compareSync(password, foundUser.password)) {
    return res.status(403).send("Incorrect email or password");
  }  

  // Set the cookie
  req.session.user_id = foundUser.id;

  res.redirect('/urls');
});

// Implement logout endpoint and clear coookies
app.post("/logout", (req, res) => {
  // res.clearCookie('user_id');
  req.session.user_id = null;
  res.redirect('/login');
});

// Handle registration form submission
app.post("/register", (req, res) => {
  const newUser = { ...req.body };
  newUser.id = generateRandomString();

  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  // replace the plain text password with the hashed password
  newUser.password = hashedPassword;

  // check if the user exists
  if(getUserByEmail(email, users)) {
    return res.status(400).send("User already exists!");
  }

  // check if email or password is empty
  if (newUser.email === '' || newUser.password === '') {
    return res.status(400).send("Email or Password is empty!")
  }

  // add a new user to users object
  users[newUser.id] = newUser;

  // res.cookie('user_id', newUser.id);
  req.session.user_id = newUser.id;
  console.log(users);

  res.redirect('/urls');
});


/***************************************************************/
/************************** LAUNCH *****************************/

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

