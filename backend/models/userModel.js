const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ["Admin", "Doctor", "Receptionist", "Lab Technician", "Patient"], 
        required: true 
    },
    specialization: { 
        type: String, 
        default: null, 
        required: function () { return this.role === "Doctor"; } 
    },
    qualification: {
        type: String,
        default: null
        // required: function () { return this.role === "Doctor"; }
    },
    experience: {
        type: Number,
        default: 0,
        min: 0,
        required: function () { return this.role === "Doctor"; }
    },
    isApproved: { type: Boolean, default: false },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    notifications: [
        {
            message: String,
            timestamp: { type: Date, default: Date.now },
            read: { type: Boolean, default: false }
        }
    ],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    businessHours: {
        type: [{
            day: {
                type: Number,
                required: true,
                min: 0,
                max: 6 // 0 = Sunday, 6 = Saturday
            },
            startTime: {
                type: String,
                required: true,
                default: '09:00'
            },
            endTime: {
                type: String,
                required: true,
                default: '17:00'
            },
            isWorking: {
                type: Boolean,
                default: true
            }
        }],
        default: [
            { day: 0, startTime: '09:00', endTime: '17:00', isWorking: true }, // Sunday
            { day: 1, startTime: '09:00', endTime: '17:00', isWorking: true }, // Monday
            { day: 2, startTime: '09:00', endTime: '17:00', isWorking: true }, // Tuesday
            { day: 3, startTime: '09:00', endTime: '17:00', isWorking: true }, // Wednesday
            { day: 4, startTime: '09:00', endTime: '17:00', isWorking: true }, // Thursday
            { day: 5, startTime: '09:00', endTime: '17:00', isWorking: true }, // Friday
            { day: 6, startTime: '09:00', endTime: '17:00', isWorking: true }  // Saturday
        ]
    },
    appointmentDuration: {
        type: Number,
        default: 30, // Default appointment duration in minutes
        min: 15,
        max: 120
    },
    workingHours: {
        start: {
            type: String,
            default: '09:00 AM',
            validate: {
                validator: function(value) {
                    return /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(value);
                },
                message: 'Invalid time format. Use HH:MM AM/PM'
            }
        },
        end: {
            type: String,
            default: '05:00 PM',
            validate: {
                validator: function(value) {
                    return /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(value);
                },
                message: 'Invalid time format. Use HH:MM AM/PM'
            }
        }
    },
    slotDuration: {
        type: Number,
        default: 30, // in minutes
        enum: [15, 30, 45, 60],
        required: function () { return this.role === "Doctor"; }
    },
    customId: {
        type: String,
        unique: true,
        required: false
    }
}, { timestamps: true });

// Pre-save middleware to generate customId
userSchema.pre('save', function(next) {
    if (!this.customId) {
        const prefix = this.role === 'Doctor' ? 'D-' : 
                      this.role === 'Admin' ? 'A-' :
                      this.role === 'Receptionist' ? 'R-' :
                      this.role === 'Lab Technician' ? 'L-' : 'P-';
        this.customId = `${prefix}${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    next();
});

// Pre-save middleware for password hashing
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Original method to get available time slots
userSchema.methods.getAvailableSlots = async function(date) {
    if (this.role !== 'Doctor') {
        throw new Error('Only doctors can have available slots');
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();
    
    // Get doctor's working hours for this day
    const workingDay = this.businessHours.find(d => d.day === dayOfWeek);
    
    if (!workingDay || !workingDay.isWorking) {
        return []; // Not working this day
    }

    // Convert working hours to minutes since midnight
    const [startHour, startMinute] = workingDay.startTime.split(':').map(Number);
    const [endHour, endMinute] = workingDay.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const slotDuration = this.appointmentDuration;

    // Generate all possible slots
    const allSlots = [];
    for (let minutes = startMinutes; minutes + slotDuration <= endMinutes; minutes += slotDuration) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        allSlots.push(`${displayHour}:${minute.toString().padStart(2, '0')} ${period}`);
    }

    // Get existing appointments for this doctor on this date
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await mongoose.model('Appointment').find({
        doctorId: this._id,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'Cancelled' }
    });

    // Filter out booked slots
    const bookedSlots = existingAppointments.map(appt => appt.timeSlot);
    return allSlots.filter(slot => !bookedSlots.includes(slot));
};

// New method to generate available slots using the new format
userSchema.methods.generateAvailableSlots = function() {
    if (this.role !== 'Doctor') return [];
    
    const slots = [];
    const startTime = new Date(`2000-01-01 ${this.workingHours.start}`);
    const endTime = new Date(`2000-01-01 ${this.workingHours.end}`);
    
    let currentTime = startTime;
    
    while (currentTime < endTime) {
        const timeString = currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        slots.push(timeString);
        currentTime.setMinutes(currentTime.getMinutes() + this.slotDuration);
    }
    
    return slots;
};

// New method to get available slots using the new format
userSchema.methods.getAvailableSlotsNew = async function(date) {
    if (this.role !== 'Doctor') return [];
    
    const Appointment = mongoose.model('Appointment');
    
    // Get all appointments for the given date
    const appointments = await Appointment.find({
        doctorId: this._id,
        date: {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999))
        },
        status: { $in: ['Scheduled', 'Completed'] }
    });

    // Get all possible slots for the day
    const allSlots = this.generateAvailableSlots();
    
    // Get booked slots
    const bookedSlots = appointments.map(apt => apt.timeSlot);
    
    // Filter out booked slots
    return allSlots.filter(slot => !bookedSlots.includes(slot));
};

// Prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;