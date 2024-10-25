import { model, Schema } from "mongoose";

const emailListSchema = new Schema({
  name: { type: String, required: true },
  emails: { type: [String], required: true },
},{
  timestamps: true
});


export const EmailList = model('EmailList', emailListSchema);
