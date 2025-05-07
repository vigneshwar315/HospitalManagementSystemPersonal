const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
    customId: {
        type: String,
        unique: true,
        required: false,
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"]
    },
    contactNumber: {
        type: String,
        unique: true,
        required: [true, "Contact number is required"],
        match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"]
    },
    age: {
        type: Number,
        required: false,
        min: [0, "Age cannot be negative"],
        max: [120, "Age cannot exceed 120 years"]
    },
    gender: {
        type: String,
        enum: {
            values: ["Male", "Female", "Other"],
            message: "Gender must be either Male, Female, or Other"
        },
        required: false
    },
    address: {
        type: String,
        required: false,
        trim: true,
        maxlength: [200, "Address cannot exceed 200 characters"]
    },
    emergencyContact: {
        name: { 
            type: String, 
            required: false,
            trim: true,
            minlength: [2, "Emergency contact name must be at least 2 characters long"]
        },
        relation: { 
            type: String, 
            required: false,
            trim: true
        },
        contactNumber: { 
            type: String, 
            required: false,
            match: [/^[0-9]{10}$/, "Please enter a valid 10-digit emergency contact number"]
        }
    },
    admissionDate: {
        type: Date,
        default: Date.now,
    },
    dischargeDate: {
        type: Date,
    },
    doctorAssigned: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    diagnosis: {
        type: String,
    },
    medicalHistory: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            appointments: [],
            prescriptions: [],
            labReports: [],
            allergies: [],
            conditions: [],
            medications: []
        }
    },
    // Add to your labReports array in patientModel.js
    labReports: [
        {
            testName: { 
                type: String, 
                required: true 
            },
            result: { 
                type: String 
            },
            date: { 
                type: Date, 
                default: Date.now 
            },
            technician: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            status: {
                type: String,
                enum: ["Pending", "Completed", "Cancelled"],
                default: "Pending"
            }
        }
    ],
    medications: [
        {
            name: { type: String, required: false },
            dosage: { type: String, required: false },
            frequency: { type: String, required: false },
            startDate: { type: Date, default: Date.now },
            endDate: { type: Date },
        },
    ],
    allergies: {
        type: [String],
        default: [],
    },
    billing: {
        totalBill: { type: Number, default: 0 },
        paidAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, default: 0 },
        paymentStatus: {
            type: String,
            enum: ["Paid", "Pending", "Partially Paid"],
            default: "Pending",
        },
    },
    appointments: [
        {
            doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            date: { type: Date, required: false },
            status: { type: String, enum: ["Pending", "Confirmed", "Cancelled"], default: "Pending" },
        },
    ],
    
    otp: {
        type: String,
        required: false
    },
    otpExpiry: {
        type: Date,
        required: false
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    lastOtpSent: {
        type: Date,
        required: false
    },
    notifications: [{
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['appointment', 'prescription', 'lab', 'general'],
            default: 'general'
        },
        read: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        required: false
    },
});

// Generate unique custom ID before saving
patientSchema.pre("save", async function (next) {
    if (this.isNew) {
        let isUnique = false;
        let newCustomId = "";

        while (!isUnique) {
            newCustomId = `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const existingPatient = await mongoose.model("Patient").findOne({ customId: newCustomId });
            if (!existingPatient) {
                isUnique = true;
            }
        }

        this.customId = newCustomId;
    }
    next();
});

const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;