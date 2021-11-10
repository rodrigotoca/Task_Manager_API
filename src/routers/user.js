const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth.js')
const User = require('../models/user.js')
const Task = require('../models/task.js')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account.js')

//Create user

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    
    try {
        //const token = await user.generateAuthToken()
        user.save({ user }) //Agregar , token dentro de las llaves si quitas coment de arriba
        sendWelcomeEmail(user.email, user.name)
        res.status(201).send(user)
    } catch (err) {
        res.status(400).send(err)
    }
})

//Login

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token }) 
    } catch (err) {
        res.status(400).send()
    }
})

//Logout

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (err) {
        res.status(500).send()
    }
})

//Logout from all devices

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (err) {
        res.status(500).send()
    }
})

//Devuelve todos los usuarios/tasks (En User.find({}) hablas casi que de la coleccion completa)
router.get('/users/me', auth,async (req, res) => {
    res.send(req.user)
})

//Update

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'})
    }
    
    try {
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        
        updates.forEach((update) => req.user[update] = req.body[update])
        
        await req.user.save()
        res.send(req.user)
    } catch (err) {
        res.status(400).send(err)
    }
})

//Deleting

router.delete('/users/me', auth, async (req, res) => {
    try {
        await Task.deleteMany({ owner: req.user._id })
        sendCancelationEmail(req.user.email, req.user.name)
        const user = await User.findByIdAndDelete(req.user._id) //Hace lo mismo
        //await req.user.remove() //Ver porque con esta linea no jala
        res.send(req.user)
    } catch (err) {
        res.status(500).send()
    }
})

//Upload profile picture

const upload = multer({
    limits: {
        fileSize: 1000000 //1 MB en bytes
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('File type must be jpg, jpeg or png'))
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer() //Convierte las imagenes aceptadas a png y reduce su tamano a 250x250
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

//Delete user Avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//Find profile pic with id in chrome
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            return new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (err) {
        res.status(404).send()
    }
})

module.exports = router