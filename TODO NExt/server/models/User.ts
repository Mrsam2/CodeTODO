import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String }, // Optional for Google OAuth / Passkey users
  name: { type: String, default: '' },
  resetOtp: { type: String, default: null },
  resetOtpExpiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  passkeys: [{
    credentialId: { type: String, required: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
    deviceName: { type: String, default: 'My Device' }
  }]
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
