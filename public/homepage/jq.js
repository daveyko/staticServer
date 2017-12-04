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


  const zdrop = new Dropzone('#my-dropzone', {
    url: '/upload',
    previewTemplate: previewTemplate,
    previewsContainer: '#previews',
    clickable: '#my-dropzone',
    autoProcessQueue: false,
    uploadMultiple: true,
    paramName: () => 'myFiles',
    parallelUploads: 20
  })

  zdrop.on('dragenter', () => {
    $('#my-dropzone').addClass('dragenter')
  })

  zdrop.on('dragleave', () => {
    $('#my-dropzone').removeClass('dragenter')
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

