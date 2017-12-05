$(() => {
  // document.getElementById('ctrl').addEventListener('change', handleChange)
  // let files = []
  // function handleChange(e){
  //   Object.keys(e.target.files).forEach(file => files.push(e.target.files[file]))
  //   console.log(files)
  // }

  const previewNode = document.querySelector('#template')
  console.log(previewNode)
  previewNode.id = ''
  const previewTemplate = previewNode.parentNode.innerHTML
  previewNode.parentNode.removeChild(previewNode)


  const zdrop = new Dropzone('#dropzone', {
    url: '/upload',
    previewTemplate: previewTemplate,
    previewsContainer: '#previews',
    autoProcessQueue: false,
    uploadMultiple: true,
    paramName: () => 'myFiles',
    parallelUploads: 20
  })

  console.log('zdrop', zdrop)

  zdrop.on('dragenter', () => {
    $('#dropzone').addClass('dragenter')
  })

  zdrop.on('dragleave', () => {
    $('#dropzone').removeClass('dragenter')
  })

  zdrop.on('drop', () => {
    console.log('here!')
    $('#route').css('display', 'block')
    $('#submit').css('display', 'block')
    $('#dropzone').addClass('dropped')
    $('#dropzone').removeClass('dragenter')
  })

  function handleSubmit(e){
    e.preventDefault()
    const form = $('#files')
    console.log('form', form)
    const formData = new FormData(form)
    console.log(formData)
    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,
      cache: false,
      contentType: false,
      processData: false
    })
  }

  $('#submit').click((e) => {
    console.log('clicked!')
    e.preventDefault()
    zdrop.processQueue()
    // handleSubmit(e)
  })

  // document.getElementById('post-button').addEventListener('click', handleSubmit)
})

