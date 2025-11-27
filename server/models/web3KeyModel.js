const mongoose = require("mongoose");

const encryptedKeySchema = new mongoose.Schema(
  {
    iv: { type: String, required: true },
    tag: { type: String, required: true },
    data: { type: String, required: true },
  },
  { _id: false },
);

const web3KeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    encryptedPrivateKey: {
      type: encryptedKeySchema,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Web3Key", web3KeySchema);
