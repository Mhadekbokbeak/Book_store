const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Mongoose Pre-save Hook

const userSchema = new mongoose.Schema({
          name:{
                    type:String,
                    required:[true,'Name is required'],
                    trim:true,
          },
          email:{
                    type:String,
                    required:[true,'Email is required'],
                    unique:true,
                    lowercase:true,
                    trim:true,
                    
          },
          password:{
                    type:String,
                    required:[true,'Password is required'],
                    minlength:6,

          },
          role:{
                    type:String,
                    enum:['user','admin'],
                    default:'user',
          },
},{timestamps:true});

// Hash password before save in DATABASE
userSchema.pre('save', async function (next)  {
          if (!this.isModified('password')) {
                    return next(); // save Request Timeout 
          } // every edit ( fied name or email or number) every hash every change til user used old password

          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
          next();
});


// Method for check password when login
userSchema.method.matchPassword = async function (enterPassword) {
          return await bcrypt.compare(enterPassword,this.password)
}

module.exports = mongoose.model('User', userSchema);