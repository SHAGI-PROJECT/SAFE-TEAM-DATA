const mongoose = require("mongoose");

module.exports = mongoose.model("Post", {
  message: String,
  image: String,
  time: { type: Date, default: Date.now }
});
