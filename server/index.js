let express = require('express')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const async = require('async')
const bodyParser = require('body-parser')
let app = express()
const Promise = require('bluebird')
const cmd = require('node-cmd')
const mkdir = Promise.promisify(fs.mkdir)


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

app.post('/upload', upload, (req, res, next) => {
  //make the initial outermost directory
  mkdir(path.join(__dirname, '..', 'public', req.body.route))
  .then(() => {
  async.forEachOf(req.files, function(file, idx, eachcallback){
    async.waterfall([
      function(callback){
        fs.readFile(file.path, (err, data) => {
          if (err) {console.log('err occured', err)}
          else {
            callback(null, data)
          }
        })
      },
      function (data, callback){

        let editedPath = req.body.fullpath[idx]
        ensureDirectoryExistence(editedPath.slice(editedPath.indexOf('/', editedPath.indexOf('/') + 1)), req.body.route)
        fs.writeFile(path.join(__dirname, '..', 'public', req.body.route, editedPath.slice(editedPath.indexOf('/', editedPath.indexOf('/') + 1))), data, (err) => {
          if (err) {console.log('error occured in write!', err)}
          else {
          callback(null, 'success')
        }
      })
    }
  ], function(err, result){
    if (err){console.log('error in waterfall', err)}
    else {
      eachcallback()
      console.log('done!', result)}
  })
  }, function(err){
      if (err) {console.log('error occured in each', err)}
      else {
        console.log('finished processing!')
        cmd.run(`rm -rf ${path.join(__dirname, '..', 'public', 'temp')}`)
        res.sendStatus(200)
      }
  })
})
.catch(console.error)
})

app.get('/public/:dirname', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'public/', req.params.dirname, '/'))
})

app.listen(3000, function() {
  console.log('~~~~ Server listening on 3000 ~~~~');
})
