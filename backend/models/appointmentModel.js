const mongoose = require("mongoose");
const User = require("./userModel"); // Add User model import

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      validate: {
        validator: async function(v) {
          const doctor = await User.findOne({ _id: v, role: 'Doctor' });
          return doctor != null;
        },
        message: 'Doctor does not exist'
      }
    },
    patientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Patient", 
      required: true 
    },
    date: { 
      type: Date, 
      required: true,
      validate: {
        validator: function(value) {
          // Only enforce for new documents
          if (this.isNew) {
            return value > new Date();
          }
          return true;
        },
        message: "Appointment date must be in the future"
      }
    },
    time: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)']
    },
    status: { 
      type: String, 
      enum: ["Scheduled", "Completed", "Cancelled"], 
      default: "Scheduled" 
    },
    prescription: { 
      type: String, 
      default: "" 
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true } 
  }
);

// Add virtual population
appointmentSchema.virtual('doctor', {
  ref: 'User',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true
});

appointmentSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

// Add index for faster queries
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;