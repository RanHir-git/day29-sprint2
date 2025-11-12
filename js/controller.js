'use strict'

let gStartPos
let selectedImgMode = false
let gSelectedImg = null
let gSelectedImgEl = null
// Note: addingTextMode and editingIndex are declared in canvas.service.js

//dom elements
let gElCanvas
let gCtx
let canvasWrapper
let addTextBtn
let clearBtn
let fontSizeInput
let fontFamilySelect
let textColorInput


function onInit() {
    initDomElements()
    initMemeSettings(gCtx)
    setupCanvasEvents()
    setupControlEvents()
    onResize()
    onImageGallery()
}

// Ensure onInit is available globally
window.onInit = onInit
window.onResize = onResize
window.scrollCarousel = scrollCarousel
window.onChangeTextColor = onChangeTextColor

function initDomElements() {
    gElCanvas = document.querySelector('canvas')
    gCtx = gElCanvas.getContext('2d')
    canvasWrapper = document.getElementById('canvasWrapper')
    addTextBtn = document.getElementById('addTextBtn')
    clearBtn = document.getElementById('clearBtn')
    fontSizeInput = document.getElementById('fontSize')
    fontFamilySelect = document.getElementById('fontFamily')
    textColorInput = document.getElementById('textColor')
}

function onResize() {
    resizeCanvas()
    renderCanvas()
}

function resizeCanvas() {
    const elContainer = document.querySelector('.canvas-container')
    const width = elContainer.offsetWidth || 800
    const height = elContainer.offsetHeight || 600
    gElCanvas.width = width
    gElCanvas.height = height
}

function renderCanvas() {
    ClearCanvas(gCtx, gElCanvas)
    
    // Draw background image if one is selected
    if (gSelectedImg && gSelectedImg.complete) {
        gCtx.drawImage(gSelectedImg, 0, 0, gElCanvas.width, gElCanvas.height)
    }
    
    // Draw all text objects
    textObjects = getTextObjects()
    textObjects.forEach((obj, index) => {
        // Skip rendering text that is currently being edited (input field is shown instead)
        if (index === editingIndex) {
            return
        }

        gCtx.font = `${obj.fontSize}px ${obj.fontFamily}`
        gCtx.fillStyle = obj.color
        gCtx.textBaseline = 'alphabetic' // Ensure consistent baseline
        gCtx.fillText(obj.text, obj.x, obj.y)
    })
}


function onClearCanvas() {
    ClearCanvas(gCtx, gElCanvas)

}
//index of text at click position
function onClickedTextIndex(x, y) {
    textObjects = getTextObjects()
    for (let i = textObjects.length - 1; i >= 0; i--) {
        const obj = textObjects[i]
        gCtx.font = `${obj.fontSize}px ${obj.fontFamily}`
        const metrics = gCtx.measureText(obj.text)
        const bounds = boundtext(obj, metrics)

        // Get text bounds - account for text baseline
        // Check if click is in text box (with some padding for easier clicking)
        const padding = 1
        if (x >= bounds.textLeft - padding && x <= bounds.textRight + padding &&
            y >= bounds.textTop - padding && y <= bounds.textBottom + padding) {
            return i
        }
    }
    return -1 // No text found
}

// Saves edited text and removes input field
function finishEditing(e) {
    const input = e.target
    const index = parseInt(input.dataset.textIndex)
    
    // List of control IDs that should be allowed to receive focus
    const allowedControls = ['fontSize', 'fontFamily', 'textColor']
    
    // If no relatedTarget (clicking on canvas/body), allow finishing editing
    if (!e || !e.relatedTarget) {
        // Continue to finish editing
    } else {
        const targetId = e.relatedTarget.id
        const toolbarContainer = document.querySelector('.toolbar-container')
        const canvasWrapper = document.getElementById('canvasWrapper')
        const canvas = document.querySelector('canvas')
        
        // If clicking on an allowed control, don't finish editing
        if (allowedControls.includes(targetId)) {
            return
        }
        
        // If clicking on canvas or canvas wrapper, finish editing
        if (e.relatedTarget === canvas || e.relatedTarget === canvasWrapper || 
            (canvasWrapper && canvasWrapper.contains(e.relatedTarget))) {
            // Allow canvas click to finish editing - don't return early
        } 
        // If clicking on toolbar (but not allowed controls), prevent finishing
        else if (toolbarContainer && toolbarContainer.contains(e.relatedTarget)) {
            // Only prevent if it's NOT an allowed control
            if (!allowedControls.includes(targetId)) {
                setTimeout(() => input.focus(), 0)
                return
            }
        }
        // Check isClickingToolbar flag as fallback
        else if (input.isClickingToolbar) {
            if (!allowedControls.includes(targetId)) {
                setTimeout(() => input.focus(), 0)
                return
            }
        }
    }
    
    textObjects = getTextObjects()
    const newText = input.value.trim()
    if (newText) {
        // Update text if not empty
        textObjects[index].text = newText
    } else {
        // Delete text if empty
        textObjects.splice(index, 1)
        editingIndex = -1
        if (typeof setEditingIndex === 'function') {
            setEditingIndex(-1)
        }
    }
    input.remove()
    editingIndex = -1
    if (typeof setEditingIndex === 'function') {
        setEditingIndex(-1)
    }
    window.updateActiveTextInput = null
    renderCanvas()
}

function createTextInput(obj, index) {  //index is to know where to put/delete in textObjects
    // Convert canvas coordinates to screen coordinates
    const screenPos = canvasToScreen(obj.x, obj.y, gElCanvas.getBoundingClientRect(), canvasWrapper.getBoundingClientRect(), gElCanvas.width, gElCanvas.height)
    
    // Create and style the input element
    const input = createStyledInputElement(obj, screenPos)
    input.dataset.textIndex = index

    // Add to canvas
    canvasWrapper.appendChild(input)
    input.focus()   // receives keyboard input
    input.select() // Select all text
    // Function to update input field styling based on current text object
    function updateInputStyling() {
        textObjects = getTextObjects()
        const textObj = textObjects[index]
        if (!textObj) return
        updateInputElementStyling(input, textObj, gElCanvas.getBoundingClientRect(), canvasWrapper.getBoundingClientRect(), gElCanvas.width, gElCanvas.height)
    }
    // Store index on input element for later access (already set above, but ensuring it's there)
    // Flag to track if we're clicking on toolbar (stored on input element)
    input.isClickingToolbar = false
    
    // Prevent blur when clicking on toolbar controls
    const toolbarContainer = document.querySelector('.toolbar-container')
    if (toolbarContainer) {
        toolbarContainer.addEventListener('mousedown', (e) => {
            input.isClickingToolbar = true
            setTimeout(() => {
                input.isClickingToolbar = false
            }, 100)
        })
    }

    // Finish editing text when click on canvas
    input.addEventListener('blur', finishEditing)
    
    // Refocus input after user finishes with allowed controls
    const allowedControls = ['fontSize', 'fontFamily', 'textColor']
    allowedControls.forEach(controlId => {
        const control = document.getElementById(controlId)
        if (control) {
            control.addEventListener('blur', () => {
                // Small delay to ensure the control has processed its change
                setTimeout(() => {
                    if (input && input.parentNode) {
                        const elActive = document.activeElement
                        // Only refocus if not clicking on another allowed control
                        if (!elActive || !allowedControls.includes(elActive.id)) {
                            input.focus()
                        }
                    }
                }, 100)
            })
        }
    })

    // Handle keyboard enter and escape
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finishEditing()
        } else if (e.key === 'Escape') {
            // Cancel editing on Escape
            input.remove()
            editingIndex = -1
            if (typeof setEditingIndex === 'function') {
                setEditingIndex(-1)
            }
            window.updateActiveTextInput = null
            renderCanvas()
        }
    })

    // Store update function for external access
    window.updateActiveTextInput = updateInputStyling
}


function handleCanvasClick(e) {
    const { x, y } = XYHandler(e)
    const clickedIndex = onClickedTextIndex(x, y)
    if (clickedIndex !== -1) {  //edit existing text buble
        addingTextMode = false
        onUpdateAddTextButton()
        editingIndex = clickedIndex
        if (typeof setEditingIndex === 'function') {
            setEditingIndex(clickedIndex)
        }
        // Update all inputs to match the selected text's properties
        textObjects = getTextObjects()
        if (textObjects[clickedIndex]) {
            if (textColorInput) textColorInput.value = textObjects[clickedIndex].color
            if (fontSizeInput) fontSizeInput.value = textObjects[clickedIndex].fontSize
            if (fontFamilySelect) fontFamilySelect.value = textObjects[clickedIndex].fontFamily
        }
        renderCanvas() // Hide the text being edited before showing input
        createTextInput(textObjects[clickedIndex], clickedIndex)
    } else if (addingTextMode) {    //add new text
        const newText = createNewText(x, y, fontSizeInput, fontFamilySelect, textColorInput)
        textObjects.push(newText)
        editingIndex = textObjects.length - 1
        if (typeof setEditingIndex === 'function') {
            setEditingIndex(editingIndex)
        }
        renderCanvas()
        createTextInput(newText, textObjects.length - 1)
        addingTextMode = false
        onUpdateAddTextButton()
    }
}

// hover handler 
function handleCanvasHover(e) {
    const { x, y } = XYHandler(e)
    const hoveredIndex = onClickedTextIndex(x, y)

    if (hoveredIndex !== -1) {
        gElCanvas.style.cursor = 'pointer'
    } else if (addingTextMode) {
        gElCanvas.style.cursor = 'crosshair'
    } else {
        gElCanvas.style.cursor = 'default'
    }
}


function onUpdateAddTextButton() {
    if (addingTextMode) {
        addTextBtn.textContent = 'Cancel'
        addTextBtn.classList.add('active')
    } else {
        addTextBtn.textContent = 'Add Text'
        addTextBtn.classList.remove('active')
    }
}


function onClearButton() {
    if (confirm('Are you sure you want to clear the canvas?')) {
        textObjects = []
        renderCanvas()
    }
}

// Setup all canvas event listeners
function setupCanvasEvents() {
    // Mouse events
    gElCanvas.addEventListener('click', handleCanvasClick)
    gElCanvas.addEventListener('mousemove', handleCanvasHover)

    // Touch events
    gElCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault()
        handleCanvasClick(e)
    })
    gElCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault()
        handleCanvasHover(e)
    })
    gElCanvas.addEventListener('touchend', (e) => {
        e.preventDefault()
        if (e.changedTouches && e.changedTouches[0]) {
            handleCanvasClick(e)
        }
    })
}

function setupControlEvents() {
    addTextBtn.addEventListener('click', handleAddTextButton)
    clearBtn.addEventListener('click', onClearButton)
    if (textColorInput) {
        textColorInput.addEventListener('change', onChangeTextColor)
        textColorInput.addEventListener('input', onChangeTextColor) // For real-time updates
    }
    if (fontSizeInput) {
        fontSizeInput.addEventListener('change', onChangeFontSize)
        fontSizeInput.addEventListener('input', onChangeFontSize) // For real-time updates
    }
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', onChangeFontFamily)
    }
}


function onChangeTextProperty(ev, property) {
    let value = ev.target.value
    if (property === 'fontSize') {
        value = parseInt(value)
    }
    // Check if we have an active text input
    const input = document.querySelector('.edit-input')
    if (!input) return
    // If a text is currently being edited, update its property
    if (editingIndex !== -1) {
        textObjects = getTextObjects()
        if (textObjects[editingIndex]) {
            textObjects[editingIndex][property] = value
            // Update the input field styling
            if (window.updateActiveTextInput) {
                window.updateActiveTextInput()
            }
            renderCanvas()
        }
    }
}

function onChangeTextColor(ev) {
    onChangeTextProperty(ev, 'color')
}

function onChangeFontSize(ev) {
    onChangeTextProperty(ev, 'fontSize')
}

function onChangeFontFamily(ev) {
    onChangeTextProperty(ev, 'fontFamily')
}


function onDownloadImg(elLink) {
    const imgContent = gElCanvas.toDataURL('image/jpeg')
    elLink.href = imgContent
}

function onSelectEmoji(imgEl) {
    //unselect if selected
    if (imgEl.classList.contains('selected')) {
        resetSelectedEmoji()
        return
    }
    //select the clicked image
    const imgs = document.querySelectorAll('.select-an-image-container img')
    imgs.forEach(el => el.classList.remove('selected'))
    imgEl.classList.add('selected')
    const img = new Image()
    img.src = imgEl.src
    gSelectedImg = img
    gSelectedImgEl = imgEl
    selectedImgMode = true
}

function resetSelectedEmoji() {
    gSelectedImgEl.classList.remove('selected')
    gSelectedImg = null
    gSelectedImgEl = null
    selectedImgMode = false
}

function renderImg(img) {
    gElCanvas.height = (img.naturalHeight / img.naturalWidth) * gElCanvas.width
    gCtx.drawImage(img, 0, 0, gElCanvas.width, gElCanvas.height)
}


function onImageGallery() {
    let imgs = getImgs()
    var strHtml = imgs.map(img => `<li><img title="${img.alt}" src="${img.src}" alt="${img.alt}" onclick="onSelectImg(this)"></li>`)
    showCarouselContent(strHtml.join(''))
}


function showCarouselContent(content) {
    let wholeContent = `
        <h1>Select Image</h1>
        <div class="carousel-container">
            <button class="carousel-btn carousel-btn-left" onclick="scrollCarousel(-1)">◄</button>
            <ul id="carousel-list">${content}</ul>
            <button class="carousel-btn carousel-btn-right" onclick="scrollCarousel(1)">►</button>
        </div>
    `
    const details = document.querySelector('.meme-selector')
    details.innerHTML = wholeContent
    details.style.display = 'flex'
    
    // Add scroll event listener to update button states
    const carousel = document.getElementById('carousel-list')
    if (carousel) {
        carousel.addEventListener('scroll', updateCarouselButtons)
        updateCarouselButtons()
    }
}

function scrollCarousel(direction) {
    const carousel = document.getElementById('carousel-list')
    if (!carousel) return
    const newScroll = getNewScroll(direction,carousel)
    carousel.scrollTo({
        left: newScroll,
        behavior: 'smooth'
    })
    setTimeout(updateCarouselButtons, 100)
}

function updateCarouselButtons() {  //update the scroll buttons-unavailable when at the start or end
    const carousel = document.getElementById('carousel-list')
    if (!carousel) return
    const leftBtn = document.querySelector('.carousel-btn-left')
    const rightBtn = document.querySelector('.carousel-btn-right')
    if (!leftBtn || !rightBtn) return
    const maxScroll = carousel.scrollWidth - carousel.clientWidth
    const currentScroll = carousel.scrollLeft
    // Enable/disable buttons based on scroll position
    leftBtn.disabled = currentScroll <= 0
    rightBtn.disabled = currentScroll >= maxScroll - 1
}

function onSelectImg(imgEl) {
    const img = new Image()
    img.onload = function() {
        gElCanvas.height = (img.naturalHeight / img.naturalWidth) * gElCanvas.width
        gSelectedImg = img // Store the image for redrawing
        renderCanvas() // Redraw everything including the image
        closeContent()
    }
    img.src = imgEl.src
}

function closeContent() {
    const details = document.querySelector('.meme-selector')
    details.style.display = 'none'
}