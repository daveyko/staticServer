
$(() => {

  let fs
  let cwd
  let footer = document.getElementById('footer')


  window.webkitRequestFileSystem(window.TEMPORARY, 1024 * 1204, function(fileSystem) {
    //fileSystem object representing the fs the app can use
    fs = fileSystem;

    //FS Directory Entry object that represents the fs root dir
    //through this object can gain access to all files and dir in the fs
    cwd = fs.root;
    renderImages(cwd)

  })

  function readDirectory(dirEntry, cb) {

        //a fs dir reader object that is used to read entries in a directory
        var dirReader = dirEntry.createReader();
        var entries = [];

        // Call the reader.readEntries() until no more results are returned.
        var readEntries = function() {

          //retrieves directory entries within the dir being read and delivers them in an array to the cb

          //the results represents a filesystem entry object(either dir or file)
           dirReader.readEntries(function(results) {

            if (!results.length) {
              //base case when readEntries returns an empty array which means all the fs objects in the directory have been traversed
              cb(entries)
            } else {
              entries = entries.concat(toArray(results))
              readEntries();
            }
          }, (err) => {
            console.error('err occured!', err)
          }
        );
        };
        readEntries(); // Start reading dirs.
  }

  function renderImages(dirEntry){

    //entries is the result of dirReader.readEntries, an array of fs objects that can be either a dir or a file

    readDirectory(dirEntry, (entries) => {
      if (!entries.length){
        $('#route').css('display', 'none')
        $('#submit').css('display', 'none')
        return
      }

      $('#route').css('display', 'block')
      $('#submit').css('display', 'block')
      let frag = document.createDocumentFragment()
      var spanNav = document.createElement('span')
      spanNav.className = 'nav'
      spanNav.title = 'Move up a directory;'
      let navIcon = document.createElement('i')
      navIcon.className = 'fa fa-angle-double-up'
      navIcon.addEventListener('click', onThumbNailClick)
      spanNav.appendChild(navIcon)
      frag.appendChild(spanNav)

      entries.forEach((entry, i) => {
        let div = document.createElement('div')
        div.dataset.fullPath = entry.fullPath
        let img = new Image()
        if (entry.isDirectory) {
          img.src = '../images/Folder-icon.png'
          div.className = 'directory'
          div.dataset.isDirectory = 'true'
        } else {
          div.className = 'file'
          img.src = '../images/file.png'
        }
        img.title = entry.name
        let span = document.createElement('span')
        span.innerHTML = entry.name
        span.className = 'name'
        let span2 = document.createElement('span')
        span2.innerHTML = 'X'
        span2.className = 'close'
        span2.addEventListener('click', onClose)
        span2.className = 'close'
        div.appendChild(span2)
        div.appendChild(img)
        div.appendChild(span)
        div.addEventListener('mouseenter', (e) => {
          $(e.target.firstChild).css('display', 'inline')
          $(e.target.children[1]).css('opacity', '1')
        })
        div.addEventListener('mouseleave', (e) => {
          $(e.target.firstChild).css('display', 'none')
          $(e.target.children[1]).css('opacity', '0.6')
        })
        div.addEventListener('click', onThumbNailClick)
        frag.appendChild(div)
      })
      footer.innerHTML = '';
      footer.appendChild(frag)
    }
  )}

  function getEntry(fullpath){
    let fsUrl = fs.root.toURL() + fullpath
    return new Promise(resolve => {
      window.webkitResolveLocalFileSystemURL(fsUrl, (entry) => {
        if (entry.isDirectory) cwd = entry
        resolve(entry)
      })
    })
  }

  function onClose(e){
    if (e.target){
      e.stopPropagation()
    }
    let el = e.target ? e.target.parentElement : e
    getEntry(el.dataset.fullPath)
    .then(entry => {
      el.parentElement.removeChild(el)
      return entry.isDirectory ? entry.removeRecursively(() => {
        cwd = fs.root
        $('#dropzone').removeClass('dropped')
        $('#dropzone').removeClass('dragenter')
        $('#route').css('display', 'none')
        $('#submit').css('display', 'none')
      }) : entry.remove(() => {})
    })
    .catch(err => console.error(err))
  }

  function onThumbNailClick(e){
    let el = e.target.parentElement
    if (el.className === 'nav'){
      getEntry(cwd.fullPath + '/..')
      .then(renderImages)
      .catch(console.error)
    }
    else {
      let isDirectory = Boolean(el.dataset.isDirectory)
      if (isDirectory){
      getEntry(el.dataset.fullPath)
      .then(renderImages)
      .catch(console.error)
    }
  }
}

  function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
  }


  function entryToFile(files){
    let convertedFiles = []
    return new Promise(resolve => {
      files.forEach((entry, i) => {
        entry.file(file => {
          if (i === files.length - 1) {
            resolve(convertedFiles)
          }
          file.fullPath = entry.fullPath
          convertedFiles.push(file)
        })
      })
    })
  }

  function submitData(files){
    return new Promise(resolve => {
      let xhr = new XMLHttpRequest()
      let formData = new FormData()
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4){
          if (xhr.status === 200){
            resolve(xhr.response)
          } else {
            reject(xhr.status)
          }
        }
      }
      xhr.open('POST', 'http://localhost:3000/upload', true)
      xhr.setRequestHeader( 'Accept', 'application/json')
      xhr.setRequestHeader( 'Cache-Control', 'no-cache')
      xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest')
      for (let i = 0; i < files.length; i++){
        formData.append(`uploads${i}`, files[i])
        formData.append('fullpath[]', files[i].fullPath)
      }

      formData.append('route', $('#route').val())
      xhr.send(formData)
    })
  }

  async function createFilesArr(dirFirst){

    let filesArr = []

    let items  = await traverseDirectory(dirFirst)

    for (let item of items){
      if (item.isFile){
        filesArr.push(item)
      } else {
        filesArr = filesArr.concat(await createFilesArr(item))
      }
    }

    function traverseDirectory(dir){
      let entriesArr = []
      let reader = dir.createReader()
      return new Promise(resolve => {
        (function readEntries(){
          reader.readEntries(entries => {
            if (!entries.length){
              resolve(entriesArr)
            } else {
              entries.forEach(entry => {
                entriesArr.push(entry)
              })
              readEntries()
            }
          })
        })()
      })
    }

    return filesArr
  }

  $('#submit').click((e) => {
    e.preventDefault()
    let dirElement = $('.directory')[0]
    createFilesArr(cwd)
    .then(entries => {
      return entryToFile(entries)
    })
    .then(files => {
      return submitData(files)
    })
    .then((res) => {
      alert('app successfully deployed!')
      onClose(dirElement)
    })
  })


  const previewNode = document.querySelector('#template')
  previewNode.id = ''
  const previewTemplate = previewNode.parentNode.innerHTML
  previewNode.parentNode.removeChild(previewNode)


  let dropzone = document.getElementById('dropzone')
  let listing = document.getElementById('listing')

  const zdrop = new Dropzone('#dropzone', {
    url: '/upload',
    previewTemplate: previewTemplate,
    previewsContainer: '#previews',
    autoProcessQueue: false,
    uploadMultiple: true,
    paramName: () => 'myFiles',
    parallelUploads: 20,
    addRemoveLinks: true
  })

  zdrop.on('dragenter', () => {
    $('#dropzone').addClass('dragenter')
  })

  zdrop.on('dragleave', () => {
    $('#dropzone').removeClass('dragenter')
  })

  zdrop.on('drop', (e) => {

    let items = e.dataTransfer.items

    e.preventDefault()

    for (let i = 0; i < items.length; i++){

      //if item is a file, webkitGetAsEntry() returns a FS file entry object or FS directory entry object
      let item = items[i].webkitGetAsEntry()
      if (item){
        // scanFiles(item, listing)
        item.copyTo(cwd, null, () => {
          renderImages(cwd)
          })
      }
    }
    $('#route').css('display', 'block')
    $('#submit').css('display', 'block')
    $('#dropzone').addClass('dropped')
    $('#dropzone').removeClass('dropped')
    $('#previews').css('display', 'none')
  })
})

