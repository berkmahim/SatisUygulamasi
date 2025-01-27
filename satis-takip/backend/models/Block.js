import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  position: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 3;
      },
      message: props => `Position must be an array of 3 numbers!`
    }
  },
  dimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true }
  },
  unitNumber: {
    type: String,
    sparse: true
  },
  owner: {
    type: String,
    default: ''
  },
  squareMeters: {
    type: Number,
    min: 0
  },
  roomCount: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['apartment', 'store'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
blockSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Block = mongoose.model('Block', blockSchema);
export default Block;
