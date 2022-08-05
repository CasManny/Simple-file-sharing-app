require('dotenv').config()
const express = require('express')
const app = express()
const multer = require('multer')
const upload = multer({dest: "uploads"})
const connectDb = require('./db/connectDb')
const bcrypt = require('bcrypt')
const File = require('./models/file')

connectDb(process.env.MONGODB__CONNECT)
app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: true}))

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/upload', upload.single('file'), async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname
    }
    if(req.body.password !== null && req.body.password !== '') {
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }

    const file = await File.create(fileData)
    console.log(file)
    res.render('index', { fileLink: `${req.headers.origin}/file/${file.id}`})
 
})

app.route('/file/:id').get(handleDownload).post(handleDownload)

app.listen(3000, console.log(`server running on http://localhost:3000`))

const handleDownload = async (req, res) => {
    const file = await File.findById(req.params.id)

    if(file.password !== null) {
        if(req.body.password == null) {
            res.render('password')
            return
        }
        const comparePassword = bcrypt.compare(req.body.password, file.password)
        if(!comparePassword) {
            res.render('password', { error: true})
            return
        }
    }

    file.downloadCount++
    await file.save()
    console.log(file.downloadCount)

    res.download(file.path, file.originalName)
}