const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    
    name: {type: String, required: true, trim: true},
    age: {type: Number, required:true},
    email:{type: String, required: true, unique: true},
    password:{type: String,required:true},
    location:{
        type:{type: String,enum:['Point'],default:'Point'},
        coordinates:{type:[Number],index:'2dsphere'}
    },
    profilePic:{type:String},
    description:{type:String},
    skillsOffered:{type:String, lowercase:true, trim:true},
    skillsWanted:{type:String, lowercase:true, trim:true},
    experience:{type:Number,required:true},
    gender:{type: String,required:true},
    education:{
        school:{type:String},
        collage:{type:String},
        currentWorkingplace:{type:String}
    },
    photos:[String],
    videos:[String],
    accountType:{type: String, enum: ["free","premium"],default:"free"},
    rating:{type: Number,default:0},
    lastActive:{type: Date, default: Date.now},
    createdAt:{type: DataTransfer,default: Date.now}
    
});

const User = mongoose.model('User', userSchema);

module.exports = User;