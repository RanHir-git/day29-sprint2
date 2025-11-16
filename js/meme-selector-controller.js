'use strict'


let selectedImgMode = false   //mode of selection - image or meme
let elGSelectedImg = null

var gGalleryImgs = null  // Store gallery images for filtering


function onImageGallery() {
    // Hide canvas and show gallery
    const canvasContainer = document.querySelector('.canvas-container')
    if (canvasContainer) {
        canvasContainer.style.display = 'none'
    }

    // Close mobile menu if open
    if (typeof closeMobileMenu === 'function') {
        closeMobileMenu()
    }

    // Show gallery
    showGallery()
    selectedImgMode = true
}

function showGallery() {
    let wholeContent = getGalleryHtml()
    const details = document.querySelector('.meme-selector')
    details.innerHTML = wholeContent
    details.style.display = 'flex'

    // Hide share-download-container when in meme selection mode
    const shareDownloadContainer = document.querySelector('.share-download-container')
    if (shareDownloadContainer) {
        shareDownloadContainer.style.display = 'none'
    }
}


function onSelectImg(imgEl) {
    // Get the image URL from the clicked img element
    const imgUrl = imgEl.src
    const img = new Image()
    img.onload = function () {
        // Access gElCanvas from global scope (defined in controller.js)
        if (typeof gElCanvas !== 'undefined') {
            gElCanvas.height = (img.naturalHeight / img.naturalWidth) * gElCanvas.width
        }
        // Set the selected image (gSelectedImg is defined in controller.js, accessible in global scope)
        gSelectedImg = img // Store the image for redrawing
        // Render canvas (renderCanvas is defined in controller.js)
        if (typeof renderCanvas === 'function') {
            renderCanvas() // Redraw everything including the image
        }
        closeGallery()
    }
    img.src = imgUrl
}

function onRandomMeme() {
    const imgs = getImgs()
    const randomIndex = getRandomInt(0, imgs.length)
    const randomImg = imgs[randomIndex]
    const elImage = {
        src: randomImg.url
    }
    onSelectImg(elImage)
}

function onFilterMemes(searchText) {
    if (!gGalleryImgs) return

    const searchLower = searchText.toLowerCase().trim()
    const galleryGrid = document.querySelector('.gallery-grid')
    if (!galleryGrid) return

    const galleryItems = galleryGrid.querySelectorAll('.gallery-item')

    galleryItems.forEach(item => {
        // Always show upload item
        if (item.classList.contains('upload-item')) {
            item.style.display = 'block'
            return
        }
        const keywords = item.getAttribute('data-keywords')
        if (!keywords) {
            item.style.display = 'block'
            return
        }
        
        // if search is empty or if any keyword matches
        if (!searchLower || keywords.toLowerCase().includes(searchLower)) {
            item.style.display = 'block'
        } else {
            item.style.display = 'none'
        }
    })
}

function closeGallery() {
    // Hide gallery
    const details = document.querySelector('.meme-selector')
    details.style.display = 'none'

    // Show canvas
    const canvasContainer = document.querySelector('.canvas-container')
    if (canvasContainer) {
        canvasContainer.style.display = 'block'
    }

    // Show share-download-container when exiting meme selection mode
    const shareDownloadContainer = document.querySelector('.share-download-container')
    if (shareDownloadContainer) {
        shareDownloadContainer.style.display = 'flex'
    }

    // Close mobile menu if open
    if (typeof closeMobileMenu === 'function') {
        closeMobileMenu()
    }

    selectedImgMode = false
}

// Make functions available globally
window.onImageGallery = onImageGallery
window.onSelectImg = onSelectImg
window.onRandomMeme = onRandomMeme
window.onFilterMemes = onFilterMemes
window.closeGallery = closeGallery

