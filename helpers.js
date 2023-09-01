const getUserByEmail = function(email, database) {
  for (const userId in database) {
    if (email === database[userId].email) {
      return database[userId];
    }
  }
  return null;
}; 

module.exports = { getUserByEmail };