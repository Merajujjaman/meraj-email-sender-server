import { model, Schema } from "mongoose";


const campaignSchema = new Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true, unique: true },
  senderName: { type: String, required: true },
  smtpId: { type: Schema.Types.ObjectId, ref: 'Smtp', required: true },
  emailListId: { type: Schema.Types.ObjectId, ref: 'EmailList' },
  message: { type: String, required: true },
  replies: [
    {
      from: String,
      message: String,
      receivedAt: Date,
    },
  ],
}, {
  timestamps: true
});

export const Campaign= model('Campaign', campaignSchema);

