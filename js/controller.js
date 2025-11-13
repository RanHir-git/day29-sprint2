'use strict'

let gStartPos
let selectedImgMode = false
let gSelectedImg = null
let elGSelectedImg = null
let gGalleryImgs = null  // Store gallery images for filtering
let gUpdateActiveTextInput = null  // Function to update active text input position
let gSelectedEmoji = null
let elGSelectedEmoji = null

//dom elements
let gElCanvas
let gCtx
let canvasWrapper
let addTextBtn
let clearBtn
let fontSizeInput
let fontFamilySelect
let textColorInput
let textBgColorInput
//drag vs click
let isDragging = false   //to detect drag
let hasDragged = false   //track if a drag occurred (to prevent click after drag)
let dragStartPos = null
let dragOffset = { x: 0, y: 0 }
let draggedTextIndex = -1   //in textObjects array
let draggedEmojiIndex = -1   //in emojiObjects array
let lastClickTime = 0   //to detect double click
let lastClickIndex = -1   //to detect double click on same text

//////////////////////////////init/////////////////////////////////////
function onInit() {
    initDomElements()
    initMemeSettings(gCtx)
    setupCanvasEvents()
    setupControlEvents()
    onResize()
    onAddEmojisBtn()
    onImageGallery()
}

// Ensure onInit is available globally
window.onInit = onInit
window.onResize = onResize
window.onChangeTextColor = onChangeTextColor
window.onFilterMemes = onFilterMemes

function initDomElements() {
    gElCanvas = document.querySelector('canvas')
    gCtx = gElCanvas.getContext('2d')
    canvasWrapper = document.getElementById('canvasWrapper')
    addTextBtn = document.getElementById('addTextBtn')
    clearBtn = document.getElementById('clearBtn')
    fontSizeInput = document.getElementById('fontSize')
    fontFamilySelect = document.getElementById('fontFamily')
    textColorInput = document.getElementById('textColor')
    textBgColorInput = document.getElementById('textBgColor')
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

    // Draw all emoji objects
    emojiObjects = getEmojiObjects()
    emojiObjects.forEach((emojiObj, index) => {
        if (emojiObj.img && emojiObj.img.complete) {
            gCtx.drawImage(emojiObj.img, emojiObj.x - 20, emojiObj.y - 20, 40, 40)
            
            // Draw selection border if this emoji is selected
            if (selectedEmojiIndex === index) {
                gCtx.strokeStyle = '#007bff'
                gCtx.lineWidth = 2
                gCtx.strokeRect(emojiObj.x - 22, emojiObj.y - 22, 44, 44)
            }
        }
    })
}


function onClearCanvas() {
    ClearCanvas(gCtx, gElCanvas)

}
//////////////////////////////canvas events//////////////////////////////
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

//index of emoji at click position
function onClickedEmojiIndex(x, y) {
    emojiObjects = getEmojiObjects()
    for (let i = emojiObjects.length - 1; i >= 0; i--) {
        const emojiObj = emojiObjects[i]
        // Emoji is 40x40, centered at (x, y)
        const emojiLeft = emojiObj.x - 40
        const emojiRight = emojiObj.x + 20
        const emojiTop = emojiObj.y - 20
        const emojiBottom = emojiObj.y + 20

        if (x >= emojiLeft && x <= emojiRight && y >= emojiTop && y <= emojiBottom) {
            return i
        }
    }
    return -1 // No emoji found
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

        // If clicking on toolbar (but not allowed controls), prevent finishing
        if (toolbarContainer && toolbarContainer.contains(e.relatedTarget)) {
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
    gUpdateActiveTextInput = null
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
                if (input && input.parentNode) {
                    const elActive = document.activeElement
                    // Only refocus if not clicking on another allowed control
                    if (!elActive || !allowedControls.includes(elActive.id)) {
                        input.focus()
                    }
                }
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
            gUpdateActiveTextInput = null
            renderCanvas()
        }
    })

    // Store update function for external access
    gUpdateActiveTextInput = updateInputStyling
}


function handleCanvasClick(e) {
    if (isDragging) return
    // Don't process click if a drag just occurred
    if (hasDragged) {
        hasDragged = false
        return
    }
    const { x, y } = XYHandler(e)
    const clickedIndex = onClickedTextIndex(x, y)
    const clickedEmojiIndex = onClickedEmojiIndex(x, y)
    const currentTime = Date.now()
    // Check for double-click (within 300ms and same text)
    const isDoubleClick = (currentTime - lastClickTime < 300) && (clickedIndex === lastClickIndex) && (clickedIndex !== -1)
    // Update last click info
    lastClickTime = currentTime
    lastClickIndex = clickedIndex
    // pressed on an emoji on the canvas
    if (!gSelectedEmoji && clickedEmojiIndex !== -1) {
        selectedEmojiIndex = clickedEmojiIndex
        renderCanvas()
        return
    }
    // Deselect emoji if clicking on empty canvas
    if (!gSelectedEmoji && clickedIndex === -1) {
        selectedEmojiIndex = -1
        renderCanvas()
    }
    if (isDoubleClick && clickedIndex !== -1) {  // Double-click to edit existing text
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
            if (textBgColorInput) textBgColorInput.value = textObjects[clickedIndex].bgColor || '#000000'
            if (fontSizeInput) fontSizeInput.value = textObjects[clickedIndex].fontSize
            if (fontFamilySelect) fontFamilySelect.value = textObjects[clickedIndex].fontFamily
        }
        renderCanvas() // Hide the text being edited before showing input
        createTextInput(textObjects[clickedIndex], clickedIndex)

        //////////////add text////////////////////
    } else if (addingTextMode && clickedIndex === -1) {    //add new text
        const newText = createNewText(x, y, fontSizeInput, fontFamilySelect, textColorInput, textBgColorInput)
        textObjects.push(newText)
        editingIndex = textObjects.length - 1
        if (typeof setEditingIndex === 'function') {
            setEditingIndex(editingIndex)
        }
        renderCanvas()
        createTextInput(newText, textObjects.length - 1)
        addingTextMode = false
        onUpdateAddTextButton()
        
        ///////////////////add emoji///////////////////
    } else if (gSelectedEmoji && clickedIndex === -1) {  
        const clickedEmojiIndex = onClickedEmojiIndex(x, y)
        if (clickedEmojiIndex === -1 && gSelectedEmoji && gSelectedEmoji.complete) {
            // Add new emoji to canvas
            emojiObjects = getEmojiObjects()
            const newEmoji = {
                img: gSelectedEmoji,
                x: x+20,
                y: y
            }
            emojiObjects.push(newEmoji)
            resetSelectedEmoji()
            renderCanvas()
        } else if (clickedEmojiIndex !== -1) {
            // Select clicked emoji
            selectedEmojiIndex = clickedEmojiIndex
            renderCanvas()
        }
    }
}

// hover handler 
function handleCanvasHover(e) {
    if (isDragging) {
        // Show grab cursor when dragging emoji, grabbing when dragging text
        gElCanvas.style.cursor = 'grabbing'
        return
    }

    const { x, y } = XYHandler(e)
    const hoveredTextIndex = onClickedTextIndex(x, y)
    const hoveredEmojiIndex = onClickedEmojiIndex(x, y)

    // Check if in add emoji mode first
    if (gSelectedEmoji) {
        gElCanvas.style.cursor = 'crosshair'
    } else if (hoveredTextIndex !== -1) {
        gElCanvas.style.cursor = 'grab'
    } else if (hoveredEmojiIndex !== -1) {
        gElCanvas.style.cursor = 'grab'
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
        emojiObjects = []
        selectedEmojiIndex = -1
        // Clear the selected image
        gSelectedImg = null
        selectedImgMode = false
        // Remove selected class from image if it exists
        if (elGSelectedImg) {
            elGSelectedImg.classList.remove('selected')
            elGSelectedImg = null
        }
        renderCanvas()
    } else return
}
///////////////////////drag handler //////////////////////
function handleCanvasDragStart(e) {
    // Don't start drag if text is being edited or in add text mode
    if (editingIndex !== -1 || addingTextMode) return

    hasDragged = false  // Reset drag flag
    dragStartPos = XYHandler(e)

    // Check for text first, then emoji
    draggedTextIndex = onClickedTextIndex(dragStartPos.x, dragStartPos.y)
    if (draggedTextIndex !== -1) {
        isDragging = true
        textObjects = getTextObjects()
        const draggedText = textObjects[draggedTextIndex]
        dragOffset.x = dragStartPos.x - draggedText.x
        dragOffset.y = dragStartPos.y - draggedText.y
        return
    }

    // Check for emoji
    draggedEmojiIndex = onClickedEmojiIndex(dragStartPos.x, dragStartPos.y)
    if (draggedEmojiIndex !== -1) {
        isDragging = true
        emojiObjects = getEmojiObjects()
        const draggedEmoji = emojiObjects[draggedEmojiIndex]
        dragOffset.x = dragStartPos.x - draggedEmoji.x
        dragOffset.y = dragStartPos.y - draggedEmoji.y
        selectedEmojiIndex = draggedEmojiIndex
        return
    }
}

function handleCanvasDragEnd(e) {
    if (!isDragging) return
    isDragging = false
    draggedTextIndex = -1
    draggedEmojiIndex = -1
    dragOffset = { x: 0, y: 0 }
    renderCanvas()
}

function handleCanvasDrag(e) {
    if (!isDragging) return
    hasDragged = true  // Mark that a drag occurred
    const { x, y } = XYHandler(e)

    // Drag text
    if (draggedTextIndex !== -1) {
        textObjects = getTextObjects()
        const draggedText = textObjects[draggedTextIndex]
        draggedText.x = x - dragOffset.x
        draggedText.y = y - dragOffset.y
        renderCanvas()
        return
    }

    // Drag emoji
    if (draggedEmojiIndex !== -1) {
        emojiObjects = getEmojiObjects()
        const draggedEmoji = emojiObjects[draggedEmojiIndex]
        draggedEmoji.x = x - dragOffset.x
        draggedEmoji.y = y - dragOffset.y
        renderCanvas()
    }
}

/////////////event listener///////////////////
// Setup all canvas event listeners
function setupCanvasEvents() {
    // Mouse events
    gElCanvas.addEventListener('click', handleCanvasClick)
    gElCanvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            handleCanvasDrag(e)
        } else {
            handleCanvasHover(e)
        }
    })
    gElCanvas.addEventListener('mousedown', handleCanvasDragStart)
    gElCanvas.addEventListener('mouseup', handleCanvasDragEnd)
    gElCanvas.addEventListener('mouseout', handleCanvasDragEnd)

    // Keyboard events for deleting selected emoji
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && selectedEmojiIndex !== -1 && !isDragging) {
            emojiObjects = getEmojiObjects()
            if (emojiObjects[selectedEmojiIndex]) {
                emojiObjects.splice(selectedEmojiIndex, 1)
                selectedEmojiIndex = -1
                renderCanvas()
            }
        }
    })

    // Touch events -   didnt do on my own, got it from internet
    gElCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault()
        handleCanvasDragStart(e)
    })
    gElCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault()
        if (isDragging) {
            handleCanvasDrag(e)
        } else {
            handleCanvasHover(e)
        }
    })
    gElCanvas.addEventListener('touchend', (e) => {
        e.preventDefault()
        handleCanvasDragEnd(e)
        // Handle double-tap for editing (simplified - could be improved)
        if (e.changedTouches && e.changedTouches[0]) {
            const { x, y } = XYHandler(e)
            const clickedIndex = onClickedTextIndex(x, y)
            const currentTime = Date.now()
            const isDoubleTap = (currentTime - lastClickTime < 300) && (clickedIndex === lastClickIndex) && (clickedIndex !== -1)
            if (isDoubleTap) {
                lastClickTime = 0 // Reset to prevent triple-tap
                handleCanvasClick(e)
            } else {
                lastClickTime = currentTime
                lastClickIndex = clickedIndex
            }
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
    if (textBgColorInput) {
        textBgColorInput.addEventListener('change', onChangeTextBgColor)
        textBgColorInput.addEventListener('input', onChangeTextBgColor) // For real-time updates
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
            if (gUpdateActiveTextInput) {
                gUpdateActiveTextInput()
            }
            renderCanvas()
        }
    }
}

function onChangeTextBgColor(ev) {
    onChangeTextProperty(ev, 'bgColor')
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

//////////////////////////////emojis/////////////////////////////////////

function onSelectEmoji(imgEl) {
    //unselect if selected
    if (imgEl.classList.contains('selected')) {
        resetSelectedEmoji()
        return
    }
    //select the clicked emoji
    const imgs = document.querySelectorAll('.emoji-item img')
    imgs.forEach(el => el.parentElement.classList.remove('selected'))
    imgEl.parentElement.classList.add('selected')
    const img = new Image()
    img.src = imgEl.src
    gSelectedEmoji = img
    elGSelectedEmoji = imgEl
}

function resetSelectedEmoji() {
    if (elGSelectedEmoji && elGSelectedEmoji.parentElement) {
        elGSelectedEmoji.parentElement.classList.remove('selected')
    }
    gSelectedEmoji = null
    elGSelectedEmoji = null
}

function onAddEmojisBtn() {
    const addEmojiBtn = document.getElementById('addEmojiBtn')
    const emojiDropdown = document.getElementById('emoji-dropdown')

    if (!addEmojiBtn || !emojiDropdown) return

    // Get emojis and create dropdown content
    const emojis = getEmojis()
    let strHtml = emojis.map(emoji => {
        return `
        <div class="emoji-item" data-id="${emoji.id}">
            <img title="${emoji.name}" src="${emoji.url}" alt="${emoji.name}" onclick="onSelectEmoji(this)">
        </div>
    `
    }).join('')
    emojiDropdown.innerHTML = strHtml

    // Toggle dropdown on button click (only add listener once)
    if (!addEmojiBtn.hasAttribute('data-listener-added')) {
        addEmojiBtn.setAttribute('data-listener-added', 'true')

        addEmojiBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            const isVisible = emojiDropdown.style.display !== 'none'
            emojiDropdown.style.display = isVisible ? 'none' : 'grid'
        })

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!addEmojiBtn.contains(e.target) && !emojiDropdown.contains(e.target)) {
                emojiDropdown.style.display = 'none'
            }
        })

        // Close dropdown when emoji is selected
        emojiDropdown.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                setTimeout(() => {
                    emojiDropdown.style.display = 'none'
                }, 100)
            }
        })
    }
}

/////////////////// meme gallery//////////////////////////////
function onImageGallery() {
    // Hide canvas and show gallery
    const canvasContainer = document.querySelector('.canvas-container')
    if (canvasContainer) {
        canvasContainer.style.display = 'none'
    }

    // Show gallery
    showGallery()
    selectedImgMode = true
}

function showGallery() {
    let imgs = getImgs()
    let keywordSearchCountMapHtml = getKeywordSearchCountMapHtml()
    // Store imgs for filtering
    gGalleryImgs = imgs

    var strHtml = imgs.map(img => {
        // Convert keywords array to string for data attribute
        const keywordsStr = img.keyWords.join(',')
        return `
        <div class="gallery-item" data-keywords="${keywordsStr}" data-id="${img.id}">
            <img title="${img.alt}" src="${img.url}" alt="${img.alt}" onclick="onSelectImg(this)">
        </div>
    `
    }).join('')

    let wholeContent = `
        <h1>Select Image</h1>
        <input type="text" id="meme-search" placeholder="Search Memes" oninput="onFilterMemes(this.value)">
        ${keywordSearchCountMapHtml}
        <button onclick="onFilterMemes('')">Show All Memes</button>
        <div class="gallery-grid">
            ${strHtml}
        </div>
    `
    const details = document.querySelector('.meme-selector')
    details.innerHTML = wholeContent
    details.style.display = 'flex'
}


function onSelectImg(imgEl) {
    // Get the image URL from the clicked img element
    const imgUrl = imgEl.src
    const img = new Image()
    img.onload = function () {
        gElCanvas.height = (img.naturalHeight / img.naturalWidth) * gElCanvas.width
        gSelectedImg = img // Store the image for redrawing
        renderCanvas() // Redraw everything including the image
        closeGallery()
    }
    img.src = imgUrl
}

function onFilterMemes(searchText) {
    if (!gGalleryImgs) return

    const searchLower = searchText.toLowerCase().trim()
    const galleryGrid = document.querySelector('.gallery-grid')
    if (!galleryGrid) return

    const galleryItems = galleryGrid.querySelectorAll('.gallery-item')

    galleryItems.forEach(item => {
        const keywords = item.getAttribute('data-keywords').toLowerCase()
        // Show item if search is empty or if any keyword matches
        if (!searchLower || keywords.includes(searchLower)) {
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

    selectedImgMode = false
}