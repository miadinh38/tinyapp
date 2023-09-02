const getUserByEmail = function(email, database) {
  for (const userId in database) {
    if (email === database[userId].email) {
      return database[userId];
    }
  }
  return undefined;
}; 

const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
}

module.exports = { getUserByEmail, generateRandomString };