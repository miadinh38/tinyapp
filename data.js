const PORT = 8080;

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: '$2a$10$vcMtCF4BtAu3hyJfiN826udrQH4BcLj6L9A5V3eCOl/iuYwF6lkni', // purple-monkey-dinosaur
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: '$2a$10$hcwrVPu7NLzPNJKrVTDIf.dkSktPBHwgG2UNjBU4hXTBu1tF4E7lK', // dishwasher-funk
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

module.exports = { PORT, users, urlDatabase };