const mongoose = require("mongoose");

module.exports = mongoose.model("User", {
  username: String,
  passwordHash: String
});
