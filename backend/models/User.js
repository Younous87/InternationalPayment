import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username : {type: String, required : true},
    fullname : {type: String, required : true},
    idNumber : {type: String, required : true},
    accountNumber : {type: Number, required : true},
    email : {type: String, required : true},
    password : {type: String, required : true},
    accountType : {type: String, required : true},
    
    // Password Security Features
    passwordHistory: {
        type: [String],
        default: [],
        select: false // Don't include in queries by default
    },
    lastPasswordChange: {
        type: Date,
        default: Date.now
    },
    
    // Password Recovery Features
    recoveryCode: {
        type: String,
        select: false // Don't include in queries by default
    },
    recoveryCodeExpires: {
        type: Date,
        select: false // Don't include in queries by default
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for performance and uniqueness
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 });

// Method to add password to history (keep last 5 passwords)
userSchema.methods.addToPasswordHistory = async function(passwordHash) {
    this.passwordHistory.push(passwordHash);
    
    // Keep only last 5 passwords
    if (this.passwordHistory.length > 5) {
        this.passwordHistory.shift();
    }
    
    this.lastPasswordChange = Date.now();
    await this.save();
};

export default mongoose.model("User", userSchema);