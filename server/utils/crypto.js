const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce for GCM

const getSecret = () => {
  if (!process.env.KEY_ENCRYPTION_SECRET) {
    throw new Error("KEY_ENCRYPTION_SECRET is not set");
  }
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (secret.length < 32) {
    throw new Error("KEY_ENCRYPTION_SECRET must be at least 32 characters long");
  }
  return crypto.createHash("sha256").update(secret).digest();
};

const encrypt = (plainText) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex"),
  };
};

const decrypt = ({ iv, tag, data }) => {
  const decipher = crypto.createDecipheriv(ALGORITHM, getSecret(), Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};

module.exports = {
  encrypt,
  decrypt,
};
