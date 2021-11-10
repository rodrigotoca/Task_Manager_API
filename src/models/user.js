const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true //Quita espacios en blanco que puedan existir antes o despues del string
    },
    email:{
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: 1, //Ver porque no jala !!!
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error('email is invalid')
            }
        }
    },
    age: {
        type: Number,
        default: 0, //Si el usuario no proporciona este dato, node lo tomara como cero
        validate(value) {
            if (value < 0){
                throw new Error('Age must be a positive number')
            }
        }
    },

    password: {
        type: String, //stringIncludes??
        required: true,
        trim: true,
        minLength: 6,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain the word password')
            }
        }
    },

    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer,
    }
}, {
    timestamps: true
})

//Virtual property

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id', //Users ID
    foreignField: 'owner' //At task collections users ID
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    
    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if(!user) {
        return new Error('User not found')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) {
        return new Error('Incoorrect password')
    }

    return user
}

//Hash the plain text passsword before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

//Delete user tasks when user is removed

// userSchema.pre('remove', async function (next) {
//     const user = this
//     await Task.deleteMany({ owner: req.user._id })
//     next()
// })

const User = mongoose.model('User', userSchema)

module.exports = User