import { model, Schema } from "mongoose";

const smtpSchema = new Schema(
  {
    user: {
      type: String,
      required: true, 
      match: [/.+@.+\..+/, "Invalid email format"], 
      unique: true, 
    },
    pass: {
      type: String,
      required: true, 
    },
    host: {
      type: String,
      default: "smtp.gmail.com", // Gmail SMTP host
    },
    port: {
      type: Number,
      default: 587, // Port for STARTTLS
    },
    tls: {
      type: Boolean,
      default: true, // Ensure TLS is enabled
    },
    requireTLS: {
      type: Boolean,
      default: true, // Enforce TLS usage
    },
  },
  { timestamps: true }
);

export const Smtp = model('Smtp', smtpSchema);
