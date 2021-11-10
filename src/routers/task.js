const express = require('express')
const router = new express.Router()
const Task = require('../models/task.js')
const auth = require('../middleware/auth.js')

//Create task

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (err) {
        res.status(500).send(err)
    }
})

//Devuelve task si /tasks?completed=true (o false)
//limit & skip: /tasks?limit=10&skip=10 (limite de 10 elementos por pagina & cada pagina de skip va en el orden 0, 10, 20, 30, n+10)
//sorting: /tasks?sortBy=createdAt_des (or asc)
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 //Aqui: Operador ternario. condicion (parts[1] === 'desc') Esto va a ser true o false, luego ? VALOR SI TRUE : VALOR SI FALSE
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {//Codigo para pagination como en los resultados de Google
                limit: parseInt(req.query.limit), //Aqui entra el numero de elementos que quiere ver el usuario
                skip: parseInt(req.query.skip), //En que pagina esta el usuario
                sort: sort    
                //createdAt: -1, //Ascending (asc = +1) & descending (desc = -1)
                //completed: 1 //true = -1 & false = +1
            }
        })
        res.send(req.user.tasks)
    } catch (err) {
        res.status(500).send(err)
    }  
})

//Devuelve tasks por ID. Pero tambien podriamos usar .findOne() con el email para encontrarlos...

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        //const task = await Task.findOne({ _id })
        const task = await Task.findOne({ _id, owner: req.user._id })
        if(!task) {
            return res.status(404).send()
        }
        res.status(200).send(task)
    } catch (err) {
        res.status(500).send(err)
    }
})

//Update

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'})
    }
    
    try {
        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        const task = await Task.findOne({ _id:req.params.id, owner: req.user._id })
        //const task = await Task.findById(req.params.id)
        
        if(!task) {
            return res.status(404).send()
        }
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (err) {
        res.status(400).send(err)
    }
})

//Deleting

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            res.status(404).send()
        }
        res.send(task)
    } catch (err) {
        res.status(500).send()
    }
})

module.exports = router