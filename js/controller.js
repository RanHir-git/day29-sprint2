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
}

// Ensure onInit is available globally
window.onInit = onInit
window.onResize = onResize

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
    textObjects = getTextObjects()
    textObjects.forEach((obj, index) => {
        // Skip rendering text that is currently being edited (input field is shown instead)
        if (index === editingIndex) {
            return
        }
        
        gCtx.font = `${obj.fontSize}px ${obj.fontFamily}`
        gCtx.fillStyle = obj.color
        gCtx.fillText(obj.text, obj.x, obj.y)
    })
}


function onClearCanvas() {
    ClearCanvas(gCtx, gElCanvas)

}
//index of text at click position
function onClickedTextIndex(x, y) {
    for (let i = textObjects.length - 1; i >= 0; i--) {
        const obj = textObjects[i]
        gCtx.font = `${obj.fontSize}px ${obj.fontFamily}`
        const metrics = gCtx.measureText(obj.text)

        // Check if click is in text box
        if (x >= obj.x && x <= obj.x + metrics.width &&
            y >= obj.y - obj.fontSize && y <= obj.y) {
            return i
        }
    }
    return -1 // No text found
}

function createTextInput(obj, index) {  //index is to know where to put/delete in textObjects
    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'edit-input'
    input.value = obj.text
    input.style.left = obj.x + 'px'
    input.style.top = (obj.y - obj.fontSize) + 'px'

    // Match text styling (set on calling of the function)
    input.style.fontSize = obj.fontSize + 'px'
    input.style.fontFamily = obj.fontFamily
    input.style.color = obj.color
    input.style.width = Math.max(100, obj.text.length * obj.fontSize * 0.6) + 'px'

    //add to canvas
    canvasWrapper.appendChild(input)
    input.focus()   // receives keyboard input
    input.select() // Select all text

    // Saves edited text and removes input field
    function finishEditing() {
        const newText = input.value.trim()
        if (newText) {
            // Update text if not empty
            textObjects[index].text = newText
        } else {
            // Delete text if empty
            textObjects.splice(index, 1)
        }
        input.remove()
        editingIndex = -1
        renderCanvas()
    }

    // Finish editing text when click on canvas
    input.addEventListener('blur', finishEditing)

    // Handle keyboard enter and escape
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finishEditing()
        } else if (e.key === 'Escape') {
            // Cancel editing on Escape
            input.remove()
            editingIndex = -1
            renderCanvas()
        }
    })
}

// ===== CANVAS CLICK EVENT HANDLER =====
function handleCanvasClick(e) {
    const { x, y } = XYHandler(e)
    const clickedIndex = onClickedTextIndex(x, y)

    if (clickedIndex !== -1) {  //edit existing text buble
        addingTextMode = false
        updateAddTextButton()
        editingIndex = clickedIndex
        createTextInput(textObjects[clickedIndex], clickedIndex)
    } else if (addingTextMode) {    //add new text
        const newText = createNewText(x, y, fontSizeInput, fontFamilySelect, textColorInput)
        textObjects.push(newText)
        editingIndex = textObjects.length - 1
        renderCanvas()
        createTextInput(newText, textObjects.length - 1)
        addingTextMode = false
        updateAddTextButton()
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

function XYHandler(e) {     //get x,y on canvas
    const rect = gElCanvas.getBoundingClientRect()
    // Handle both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || (e.changedTouches && e.changedTouches[0]?.clientX)
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || (e.changedTouches && e.changedTouches[0]?.clientY)
    const x = clientX - rect.left
    const y = clientY - rect.top
    return { x, y }
}


function updateAddTextButton() {
    if (addingTextMode) {
        addTextBtn.textContent = 'Cancel'
        addTextBtn.classList.add('active')
    } else {
        addTextBtn.textContent = 'Add Text'
        addTextBtn.classList.remove('active')
    }
}

function handleAddTextButton() {
    addingTextMode = !addingTextMode
    updateAddTextButton()
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
}



function onChangeColor(ev) {
    const color = ev.target.value
    setDrawSetting('strokeColor', color, gCtx)
}


function onSetSize(ev) {
    const size = ev.target.value
    setDrawSetting('lineWidth', size, gCtx)
}

function onDownloadImg(elLink) {
    const imgContent = gElCanvas.toDataURL('image/jpeg')
    elLink.href = imgContent
}

function onSelectImg(imgEl) {
    //unselect if selected
    if (imgEl.classList.contains('selected')) {
        resetSelectedImg()
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

function resetSelectedImg() {
    gSelectedImgEl.classList.remove('selected')
    gSelectedImg = null
    gSelectedImgEl = null
    selectedImgMode = false
}

function renderImg(img) {
    gElCanvas.height = (img.naturalHeight / img.naturalWidth) * gElCanvas.width
    gCtx.drawImage(img, 0, 0, gElCanvas.width, gElCanvas.height)
}