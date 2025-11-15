'use strict'


function loadImageFromInput(ev, onImageReady) {
    const reader = new FileReader()

    reader.onload = function (event) {
        const img = new Image()
        img.onload = () => {
            onImageReady(img)
        }
        img.src = event.target.result
    }
    reader.readAsDataURL(ev.target.files[0])
}


// Handle upload button click - triggers file input
function onUploadImageClick() {
    const fileInput = document.getElementById('imageUploadInput')
    if (fileInput) {
        fileInput.click()
    }
}

// Handle image upload from file input
function onImageUpload(fileInput) {
    if (!fileInput.files || !fileInput.files[0]) return
    
    const ev = { target: fileInput }
    loadImageFromInput(ev, (img) => {
        // Set canvas dimensions based on image aspect ratio
        gElCanvas.height = (img.naturalHeight / img.naturalWidth) * gElCanvas.width
        gSelectedImg = img 
        renderCanvas() 
        closeGallery()
    })
}
