

$(() => {

  let fs
  let cwd
  let footer = document.getElementById('footer')


  window.webkitRequestFileSystem(window.TEMPORARY, 1024 * 1204, function(fileSystem) {
    fs = fileSystem;
    cwd = fs.root;
    renderImages(cwd)

    // window.webkitResolveLocalFileSystemURL(cwd.toURL(), (entry) => {
    //   let reader = entry.createReader()
    //   reader.readEntries(results => {
    //     results.forEach(result => {
    //       if (result.isDirectory) {
    //         console.log('isDirectory!')
    //         result.removeRecursively(() => {
    //           console.log('removed!')
    //         })
    //       }
    //       if (result.isFile){
    //         console.log('isFile')
    //         result.remove(() => {
    //           console.log('file removed!')
    //         })
    //       }
    //       console.log('resUnwrapped', result)
    //     })
    //   })
    // })

  })

  function renderImages(dirEntry){
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
          img.src = '../Folder-icon.png'
          div.className = 'directory'
          div.dataset.isDirectory = 'true'
        } else {
          div.className = 'file'
          img.src = '../file.png'
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
          console.log('el', e)
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

  function getEntry(fullpath, cb){
    let fsUrl = fs.root.toURL() + fullpath
    window.webkitResolveLocalFileSystemURL(fsUrl, (entry) => {
      if (entry.isDirectory) cwd = entry
      cb(entry)
    })
  }

  function onThumbNailClick(e){
    let el = e.target.parentElement
    if (el.className === 'nav'){
      getEntry(cwd.fullPath + '/..', renderImages)
    }
    else {
      let isDirectory = Boolean(el.dataset.isDirectory)
      if (isDirectory){
      getEntry(el.dataset.fullPath, renderImages)
    }
  }
}

  function onClose(e){
    e.stopPropagation()
    let el = e.target.parentElement
    getEntry(el.dataset.fullPath, (entry) => {
      el.parentElement.removeChild(el)
      entry.isDirectory ? entry.removeRecursively(() => {
        renderImages(fs.root)
      }) : entry.remove(() => {
      })
    })
  }

  function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
  }

  function createFilesArr(dirfirst, cb){

    let files = []

    function readDirEntries(dir){
      let dirReader = dir.createReader()
      dirReader.readEntries((entries) => {
        if (!entries.length){
          console.log('callback called!', files)
          cb(files)
        }
        entries.forEach(entry => {
          if (entry.isFile){
            files.push(entry)
            // entry.file((file) => {
            //   file.fullPath = entry.fullPath
            //   files.push(file)
            // })
          }
          if (entry.isDirectory){
            readDirEntries(entry)
          }
        })
      })
    }
    readDirEntries(dirfirst)
  }

  function entryToFile(files, cb){
    let convertedFiles = []

    files.forEach((entry, i) => {
      entry.file(file => {
        if (i === files.length - 1) {
          cb(convertedFiles)
        }
        file.fullPath = entry.fullPath
        convertedFiles.push(file)
      })
    })
  }

  function submitData(files){

    console.log('FILES!!!', files)
    let xhr = new XMLHttpRequest()
    let formData = new FormData()
    xhr.onload = (progressevent) => {
      console.log('success', progressevent)
    }
    xhr.open('POST', 'http://localhost:3000/upload', true)
    xhr.setRequestHeader( 'Accept', 'application/json')
    xhr.setRequestHeader( 'Cache-Control', 'no-cache')
    xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest')
    // let filesObj = {}
    let fullpaths = []
    for (let i = 0; i < files.length; i++){
      formData.append(`uploads${i}`, files[i])
      formData.append('fullpath[]', files[i].fullPath)
    }

    formData.append('route', $('#route').val())
    xhr.send(formData)
  }

  $('#submit').click((e) => {
    e.preventDefault()
    console.log('clicked!')
    createFilesArr(cwd, (files) => {
      entryToFile(files, submitData)
    })
  })

  function readDirectory(dirEntry, cb) {

    var dirReader = dirEntry.createReader();
    var entries = [];

    // Call the reader.readEntries() until no more results are returned.
    var readEntries = function() {

       dirReader.readEntries(function(results) {
        if (!results.length) {
          cb(entries)
        } else {
          entries = entries.concat(toArray(results))
          readEntries();
        }
      }, (err) => {
        console.log('err occured!', err)
      }
    );
    };
    readEntries(); // Start reading dirs.
  }

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
      let item = items[i].webkitGetAsEntry()
      if (item){
        // scanFiles(item, listing)
        item.copyTo(cwd, null, (copiedEntry) => {
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


  // const scanFiles = (item, container) => {
  //   let elem = document.createElement('li')
  //   elem.innerHTML = item.name
  //   container.appendChild(elem)

  //   item.copyTo(cwd, null, () => {
  //     readDirectory(cwd, function(entries){
  //       console.log('entries', entries)
  //     })
  //   })

  //   if (item.isDirectory){

  //     let directoryReader = item.createReader()
  //     let directoryContainer = document.createElement('ul')
  //     container.appendChild(directoryContainer)

  //     directoryReader.readEntries(entries => {
  //       entries.forEach(entry => {
  //         scanFiles(entry, directoryContainer)
  //       })
  //     })
  //   }
  // }


  // zdrop.on('sending', (file, xhr, formData) => {
  //   console.log('sending!')
  //   console.log('fullpath!', file)
  //   formData.append('route', $('#route').val())
  //   formData.append('fullpath', file.fullPath)
  // })

  // zdrop.on('addedfile', (file) => {
  //   console.log('file!', file)
  // })

  // function handleSubmit(e){
  //   e.preventDefault()
  //   const form = $('#files')
  //   console.log('form', form)
  //   const formData = new FormData(form)
  //   console.log(formData)
  //   $.ajax({
  //     url: '/upload',
  //     type: 'POST',
  //     data: formData,
  //     cache: false,
  //     contentType: false,
  //     processData: false
  //   })
  // }

  // $('#submit').click((e) => {
  //   console.log('clicked!')
  //   e.preventDefault()
  //   e.stopPropagation()
  //   console.log('!!!!!!!!!', zdrop.getQueuedFiles())
  //   zdrop.processQueue()
  //   // handleSubmit(e)
  // })

  // document.getElementById('post-button').addEventListener('click', handleSubmit)
})

