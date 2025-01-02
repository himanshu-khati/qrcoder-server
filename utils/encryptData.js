import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("base64").slice(0, 32);
const IV_LENGTH = 16;

// Encrypt Function
export const encrypt = (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text for encryption");
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

// Decrypt Function
export const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== "string") {
    throw new Error("Invalid encrypted text for decryption");
  }
  const [iv, encrypted] = encryptedText.split(":");
  if (!iv || !encrypted) {
    throw new Error("Malformed encrypted text");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
