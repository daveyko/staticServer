let express = require('express')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const bodyParser = require('body-parser')
let app = express()
const Promise = require('bluebird')
const cmd = require('node-cmd')
const mkdir = Promise.promisify(fs.mkdir)
const read = Promise.promisify(fs.readFile)
const write = Promise.promisify(fs.writeFile)


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false}))

//middleware which handles where the uploaded files should be stored temporarily
//to be deleted as these files have names assigned by multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(path.join(__dirname, '..', 'public', 'temp'))){
      fs.mkdirSync(path.join(__dirname, '..', 'public', 'temp'))
    }
    cb(null, path.join(__dirname, '..', 'public', 'temp'))
  },
})

const ensureDirectoryExistence = (filePath, route) => {
  //get directory of filepath
  const dirname = path.dirname(filePath)
  //check if directory exists
  if (fs.existsSync(path.join(__dirname, '..', 'public', route,  dirname))){
    return true
  }
  //if directory does not exist, recursively call function to check if directory one level up exists
  ensureDirectoryExistence(dirname, route)
  //when all the outer directories have been created or confirmed to exists, create the inner directory
  fs.mkdirSync(path.join(__dirname, '..', 'public', route, dirname))
}

const upload = multer({storage}).any()
//serve up files in public directory
app.use(express.static(path.join(__dirname, '..', 'public')))
//send homepage file initially
app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'public/homepage/' ))
})

app.post('/upload', upload, async (req, res, next) => {
  //make the initial outermost directory
  await mkdir(path.join(__dirname, '..', 'public', req.body.route))
  let readFile
  let editedPath
  try {
    await Promise.all(req.files.map(async (file, idx) => {
      try {
        //read the file
        readFile = await read(file.path)
        editedPath = req.body.fullpath[idx]
        //ensure directory/directories of the file exists
        ensureDirectoryExistence(editedPath.slice(editedPath.indexOf('/', editedPath.indexOf('/') + 1)), req.body.route)
        //write file to appropriate directory
        await write(path.join(__dirname, '..', 'public', req.body.route, editedPath.slice(editedPath.indexOf('/', editedPath.indexOf('/') + 1))), readFile)
      }
      catch(err){
        console.error('error occured in file read/write', err)
      }
    }))
    //removes the temporary files created by multer diskstorage
    cmd.run(`rm -rf ${path.join(__dirname, '..', 'public', 'temp')}`)
    res.sendStatus(200)
  }
  catch(err){
    console.error('error in promise.all', err)
  }
})

//directs server to serve up different directories(static sites) as subroutes
app.get('/public/:dirname', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'public/', req.params.dirname, '/'))
})

app.listen(3000, function() {
  console.log('~~~~ Server listening on 3000 ~~~~');
})
