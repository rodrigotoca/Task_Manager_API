const express = require('express')
const userRouter = require('./routers/user.js')
const taskRouter = require('./routers/task.js')
require('./db/mongoose.js')

const app = express()
const port = process.env.PORT

//Middleware
// app.use((req, res, next) => {
//     if (req.method === 'GET') {
//         res.send('GET requests are disabled')
//     } else {
//         next()
//     }
//     //next()
// })

// app.use((req, res, next) => {
//     if (req.method) {
//         res.status(503).send('Server under maintenance')
//     } else {
//         next()
//     }
// })

// const multer = require('multer')
// const upload = multer({
//     dest: 'images', //Ruta para almacenar los archivos
//     limits: {
//         fileSize: 1000000 //Tamano en bytes
//     },
//     fileFilter(req, file, cb) {
//         if (!file.originalname.match(/\.(doc|docx)$/)){ //Aqui vemos una regular expresion. ver www.regex101.com
//             return cb(new Error('Please upload a word document'))
//         }

//         cb(undefined, true)
//     }
// })

// app.post('/upload', upload.single('upload'), (req, res) => {
//     res.send()
// }, (error, req, res, next) => {
//     res.status(400).send({ error: error.message })
// })

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log(`Server is up in port: ${port}`)
})

const Task = require('./models/task')
const User = require('./models/user')

//Run serever in developer server comand: npm run dev
//Launch local DB server command: /Users/tocar/mongodb/bin/mongod.exe --dbpath=/Users/tocar/mongodb-data