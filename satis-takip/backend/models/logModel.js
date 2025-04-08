import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['sale', 'sale-cancel', 'payment', 'project', 'block', 'user', 'customer', 'other'],
      required: true,
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'view', 'export', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

// Endeksleri ekle
logSchema.index({ type: 1 });
logSchema.index({ userId: 1 });
logSchema.index({ createdAt: 1 });
logSchema.index({ entityId: 1 });
logSchema.index({ action: 1 });

const Log = mongoose.model('Log', logSchema);

export default Log;
