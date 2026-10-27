/**
 * MongoDB User Schema (Mongoose)
 * Models user credentials, localization, primary role (supplier vs buyer), and sub-role
 */
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    location: {
      type: String,
      required: [true, 'Location (City / District) is required'],
      trim: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'te', 'ta', 'kn', 'mr'],
      default: 'en',
    },
    primaryRole: {
      type: String,
      enum: ['supplier', 'buyer', 'unassigned'],
      default: 'unassigned',
    },
    subRole: {
      type: String,
      enum: ['farmer', 'foodHub', 'csa', 'restaurant', 'grocer', 'distributor', 'household', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models?.User || mongoose.model('User', UserSchema);
