'use strict'

let gStartPos   //start position of drag
let selectedImgMode = false   //mode of selection - image or meme
let gSelectedImg = null   //selected image (meme)
let elGSelectedImg = null
let gGalleryImgs = null  // Store gallery images for filtering
let gUpdateActiveTextInput = null  // Function to update active text input position
let gSelectedEmoji = null   //selected emoji
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

//drag vs click
let isDragging = false   //to detect drag
let hasDragged = false   //track if a drag occurred (to prevent click after drag)
let dragStartPos = null   //start position of drag
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
    updateColorWrapperBackground()
}

function initDomElements() {
    gElCanvas = document.querySelector('canvas')
    gCtx = gElCanvas.getContext('2d')
    canvasWrapper = document.getElementById('canvasWrapper')
    addTextBtn = document.getElementById('addTextBtn')
    clearBtn = document.getElementById('clearBtn')
    fontSizeInput = document.getElementById('fontSize')
    fontFamilySelect = document.getElementById('fontFamily')
    textColorInput = document.getElementById('textColor')
    const deleteBtn = document.getElementById('deleteBtn')

}

function onResize() {   //window resize handler
    resizeCanvas()
    renderCanvas()
}

function resizeCanvas() {   //if image is loaded -maintain aspect ratio
    const elContainer = document.querySelector('.canvas-container')
    const wrapper = document.getElementById('canvasWrapper')
    if (!elContainer || !wrapper) return

    // Get available space
    const containerWidth = elContainer.clientWidth - 40 // Account for padding
    const containerHeight = elContainer.clientHeight - 40
    const maxWidth = containerWidth
    const maxHeight = containerHeight
    // Calculate dimensions
    let width = maxWidth
    let height = maxHeight

    if (gSelectedImg && gSelectedImg.complete) { 
        const imgAspect = gSelectedImg.naturalWidth / gSelectedImg.naturalHeight
        const containerAspect = maxWidth / maxHeight

        if (imgAspect > containerAspect) {
            // Image is wider - fit to width
            width = maxWidth
            height = maxWidth / imgAspect
        } else {
            // Image is taller - fit to height
            height = maxHeight
            width = maxHeight * imgAspect
        }
    } else {
        // Default aspect ratio if no image
        width = Math.min(maxWidth, 800)
        height = Math.min(maxHeight, 600)
    }

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
            const size = emojiObj.size || 40
            const halfSize = size / 2
            gCtx.drawImage(emojiObj.img, emojiObj.x - halfSize, emojiObj.y - halfSize, size, size)

            // Draw selection border if this emoji is selected
            if (selectedEmojiIndex === index) {
                gCtx.strokeStyle = '#007bff'
                gCtx.lineWidth = 2
                gCtx.strokeRect(emojiObj.x - halfSize - 2, emojiObj.y - halfSize - 2, size + 4, size + 4)
            }
        }
    })
}

//////////////////////////////canvas events//////////////////////////////
//index of object (text or emoji) at click position
function onClickedObjectIndex(x, y, type = 'text') {   
    if (type === 'text') {
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
    } else if (type === 'emoji') {
        emojiObjects = getEmojiObjects()
        for (let i = emojiObjects.length - 1; i >= 0; i--) {
            const emojiObj = emojiObjects[i]
            const size = emojiObj.size || 40
            const halfSize = size / 2
            // Emoji is centered at (x, y)
            const emojiLeft = emojiObj.x - size
            const emojiRight = emojiObj.x + halfSize
            const emojiTop = emojiObj.y - halfSize
            const emojiBottom = emojiObj.y + halfSize

            if (x >= emojiLeft && x <= emojiRight && y >= emojiTop && y <= emojiBottom) {
                return i
            }
        }
        return -1 // No emoji found
    }
    return -1
}

function onClearCanvas() {
    ClearCanvas(gCtx, gElCanvas)

}

function finishEditing(e) { // Saves edited text and removes input field
    const input = e.target
    const index = parseInt(input.dataset.textIndex)

    // List of control IDs that should be allowed to receive focus
    const allowedControls = ['fontSize', 'fontFamily', 'textColor']

    // If no relatedTarget (clicking on canvas/body)
    if (!e || !e.relatedTarget) {
        // Continue to finish editing
    } else {
        const targetId = e.relatedTarget.id
        const toolbarContainer = document.querySelector('.toolbar-container')

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
        if(textObjects[index]) textObjects[index].text = newText
    } else {
        // Delete text if empty
        textObjects.splice(index, 1)
        if (typeof setEditingIndex === 'function') {
            setEditingIndex(-1)
        }
    }
    input.remove()
    resetEditingState() // Update button states when text editing ends
    resetDragClickVars(true) // Reset drag/click vars and adding item mode
}

function createTextInput(obj, index) {  //index is to know where to put/delete in textObjects
    const screenPos = canvasToScreen(obj.x, obj.y, gElCanvas.getBoundingClientRect(), canvasWrapper.getBoundingClientRect(), gElCanvas.width, gElCanvas.height)
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

    // Finish editing text when click on canvas/delete input (unfocus)
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
            finishEditing(e)
        } else if (e.key === 'Escape') {
            // Cancel editing on Escape
            input.remove()
            resetEditingState()
            resetDragClickVars()

        }
    })

    // Store update function for external access
    gUpdateActiveTextInput = updateInputStyling

    // Update button states when text editing starts
    updateEmojiSizeButtons()
}

function handleCanvasClick(e) {
    if (isDragging) return  // Don't process click if a drag just occurred
    if (hasDragged) {
        resetDragClickVars(false, false) // Reset drag vars but preserve click tracking for double-click
        return
    }
    const { x, y } = XYHandler(e)
    const clickedIndex = onClickedObjectIndex(x, y, 'text')
    const clickedEmojiIndex = onClickedObjectIndex(x, y, 'emoji')
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
        updateEmojiSizeButtons()
        return
    }
    // Deselect emoji if clicking on empty canvas
    if (!gSelectedEmoji && clickedIndex === -1) {
        selectedEmojiIndex = -1
        resetDragClickVars(false, false) // Reset drag vars but preserve click tracking for double-click
        renderCanvas()
        updateEmojiSizeButtons()
    }
    if (isDoubleClick && clickedIndex !== -1) {  // Double-click to edit existing text
        selectedEmojiIndex = -1  // Cancel emoji selection when editing text
        updateEmojiSizeButtons()  // Update button states
        addingTextMode = false
        onUpdateAddTextButton()
        editingIndex = clickedIndex
        if (typeof setEditingIndex === 'function') {
            setEditingIndex(clickedIndex)
        }
        // Update all inputs to match the selected text's properties
        textObjects = getTextObjects()
        if (textObjects[clickedIndex]) {
            if (textColorInput) {
                textColorInput.value = textObjects[clickedIndex].color
                updateColorWrapperBackground()
            }
            if (fontSizeInput) fontSizeInput.value = textObjects[clickedIndex].fontSize
            if (fontFamilySelect) fontFamilySelect.value = textObjects[clickedIndex].fontFamily
        }
        renderCanvas() // Hide the text being edited before showing input
        createTextInput(textObjects[clickedIndex], clickedIndex)

        //////////////add text////////////////////
    } else if (addingTextMode && clickedIndex === -1) {    //add new text
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

        ///////////////////add emoji///////////////////
    } else if (gSelectedEmoji && clickedIndex === -1) {  
        const clickedEmojiIndex = onClickedObjectIndex(x, y, 'emoji')
        if (clickedEmojiIndex === -1 && gSelectedEmoji && gSelectedEmoji.complete) {
            // Add new emoji to canvas
            emojiObjects = getEmojiObjects()
            const newEmoji = {
                img: gSelectedEmoji,
                x: x + 20,
                y: y,
                size: 40  // Default size
            }
            emojiObjects.push(newEmoji)
            resetSelectedEmoji()
            renderCanvas()
        } else if (clickedEmojiIndex !== -1) {
            // Select clicked emoji
            selectedEmojiIndex = clickedEmojiIndex
            renderCanvas()
            updateEmojiSizeButtons()
        }
    }
}


function handleCanvasHover(e) { // hover handler 
    if (isDragging) {
        // Show grab cursor when dragging emoji, grabbing when dragging text
        gElCanvas.style.cursor = 'grabbing'
        return
    }

    const { x, y } = XYHandler(e)
    const hoveredTextIndex = onClickedObjectIndex(x, y, 'text')
    const hoveredEmojiIndex = onClickedObjectIndex(x, y, 'emoji')

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


function onClearButton() {  //show modal of clear canvas
    showClearModal()
}

function showClearModal() { //should be on another file
    const cleearModal = document.getElementById('clearModalOverlay')
    if (!cleearModal) return
    
    cleearModal.classList.add('show')
    document.body.classList.add('modal-open')
}

function hideClearModal() {
    const modalOverlay = document.getElementById('clearModalOverlay')
    if (!modalOverlay) return
    
    modalOverlay.classList.remove('show')
    document.body.classList.remove('modal-open')
}

function confirmAndClearCanvas() {
    onClearCanvas()
    // Clear all canvas data (reusing the logic that was in onClearButton)
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
    hideClearModal()
}
///////////////////////drag handler //////////////////////
function handleCanvasDragStart(e) {
    // Don't start drag if text is being edited or in add text mode
    if (editingIndex !== -1 || addingTextMode) return

    hasDragged = false  // Reset drag flag
    dragStartPos = XYHandler(e)

    // Check for text first, then emoji
    draggedTextIndex = onClickedObjectIndex(dragStartPos.x, dragStartPos.y, 'text')
    if (draggedTextIndex !== -1) {
        isDragging = true
        textObjects = getTextObjects()
        const draggedText = textObjects[draggedTextIndex]
        dragOffset.x = dragStartPos.x - draggedText.x
        dragOffset.y = dragStartPos.y - draggedText.y
        return
    }

    // Check for emoji
    draggedEmojiIndex = onClickedObjectIndex(dragStartPos.x, dragStartPos.y, 'emoji')
    if (draggedEmojiIndex !== -1) {
        isDragging = true
        emojiObjects = getEmojiObjects()
        const draggedEmoji = emojiObjects[draggedEmojiIndex]
        dragOffset.x = dragStartPos.x - draggedEmoji.x
        dragOffset.y = dragStartPos.y - draggedEmoji.y
        selectedEmojiIndex = draggedEmojiIndex
        updateEmojiSizeButtons()
        return
    }
}

function handleCanvasDragEnd(e) {
    if (!isDragging) return
    resetDragClickVars(false, false) // Reset drag vars but preserve click tracking for double-click
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
                updateEmojiSizeButtons()
            }
        }
        // Close clear modal with Escape key
        if (e.key === 'Escape') {
            const modalOverlay = document.getElementById('clearModalOverlay')
            if (modalOverlay && modalOverlay.classList.contains('show')) {
                hideClearModal()
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
            const clickedIndex = onClickedObjectIndex(x, y, 'text')
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
    if (deleteBtn) {
        deleteBtn.addEventListener('click', onDeleteSelected)
    }
    
    // Setup clear modal buttons
    const clearModalCancel = document.getElementById('clearModalCancel')
    const clearModalClear = document.getElementById('clearModalClear')
    if (clearModalCancel) {
        clearModalCancel.addEventListener('click', hideClearModal)
    }
    if (clearModalClear) {
        clearModalClear.addEventListener('click', confirmAndClearCanvas)
    }
    
    // Close modal when clicking on overlay (outside the modal)
    const clearModalOverlay = document.getElementById('clearModalOverlay')
    if (clearModalOverlay) {
        clearModalOverlay.addEventListener('click', (e) => {
            if (e.target === clearModalOverlay) {
                hideClearModal()
            }
        })
    }
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

    // Emoji size controls
    const emojiSizeUp = document.getElementById('emojiSizeUp')
    const emojiSizeDown = document.getElementById('emojiSizeDown')
    if (emojiSizeUp) {
        emojiSizeUp.addEventListener('click', onIncreaseSize)
    }
    if (emojiSizeDown) {
        emojiSizeDown.addEventListener('click', onDecreaseSize)
    }

    // Update button states when emoji selection changes
    updateEmojiSizeButtons()

    // Setup menu toggle
    initMenuToggle()
}

//////////////////////////////size controls/////////////////////////////////////

function onIncreaseSize() {

    const currentEditingIndex = getEditingIndex()
    if (currentEditingIndex !== -1) {
        // Increase *text* font size (can be text or emoji)
        textObjects = getTextObjects()
        if (textObjects[currentEditingIndex]) {
            const currentSize = textObjects[currentEditingIndex].fontSize || 20
            const newSize = Math.min(currentSize + 5, 200)
            textObjects[currentEditingIndex].fontSize = newSize

            // Update the input field and fontSize input
            if (fontSizeInput) fontSizeInput.value = newSize
            if (gUpdateActiveTextInput) {
                gUpdateActiveTextInput()
            }
            renderCanvas()
            updateEmojiSizeButtons() // Update button states
        }
        return
    }

    // Otherwise, increase emoji size
    onIncreaseEmojiSizeService(selectedEmojiIndex, emojiObjects, getEmojiObjects, renderCanvas, updateEmojiSizeButtonsService)
}

function onDecreaseSize() {
    const currentEditingIndex = getEditingIndex()
    if (currentEditingIndex !== -1) {
        // Decrease *text* font size (can be text or emoji)
        textObjects = getTextObjects()
        if (textObjects[currentEditingIndex]) {
            const currentSize = textObjects[currentEditingIndex].fontSize || 20
            const newSize = Math.max(currentSize - 5, 10)
            textObjects[currentEditingIndex].fontSize = newSize

            // Update the input field and fontSize input
            if (fontSizeInput) fontSizeInput.value = newSize
            if (gUpdateActiveTextInput) {
                gUpdateActiveTextInput()
            }
            renderCanvas()
            updateEmojiSizeButtons() // Update button states
        }
        return
    }

    // Otherwise, decrease emoji size
    onDecreaseEmojiSizeService(selectedEmojiIndex, emojiObjects, getEmojiObjects, renderCanvas, updateEmojiSizeButtonsService)
}

function updateEmojiSizeButtons() {
    // Check if text is being edited first
    const currentEditingIndex = getEditingIndex()
    if (currentEditingIndex !== -1) {
        // Update buttons based on text font size
        textObjects = getTextObjects()
        if (textObjects[currentEditingIndex]) {
            const currentSize = textObjects[currentEditingIndex].fontSize || 20
            const emojiSizeUp = document.getElementById('emojiSizeUp')
            const emojiSizeDown = document.getElementById('emojiSizeDown')
            if (emojiSizeUp) emojiSizeUp.disabled = currentSize >= 200
            if (emojiSizeDown) emojiSizeDown.disabled = currentSize <= 10
        }
        return
    }

    // Otherwise, update based on emoji size
    updateEmojiSizeButtonsService(selectedEmojiIndex, getEmojiObjects)
}

function onDeleteSelected() {
    //if text is being edited -delete
    const currentEditingIndex = getEditingIndex()
    if (currentEditingIndex !== -1) {
        textObjects = getTextObjects()
        if (textObjects[currentEditingIndex]) {
            textObjects.splice(currentEditingIndex, 1)
            const input = document.querySelector('.edit-input')
            if (input) {
                input.blur()
                input.remove()
            }
            resetEditingState(true)
        }
        return
    }
    // if emoji is selected
    if (selectedEmojiIndex !== -1 && !isDragging) {
        emojiObjects = getEmojiObjects()
        if (emojiObjects[selectedEmojiIndex]) {
            emojiObjects.splice(selectedEmojiIndex, 1)
            selectedEmojiIndex = -1
            renderCanvas()
            updateEmojiSizeButtons()
        }
        return
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

function onChangeTextColor(ev) {
    onChangeTextProperty(ev, 'color')
    updateColorWrapperBackground()
}

function updateColorWrapperBackground() {
    const colorWrapper = document.querySelector('.color-input-wrapper')
    if (colorWrapper && textColorInput) {
        colorWrapper.style.backgroundColor = textColorInput.value
    }
}

function onChangeFontSize(ev) {
    onChangeTextProperty(ev, 'fontSize')
    updateEmojiSizeButtons() // Update button states when font size changes
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

    // Close mobile menu if open
    closeMobileMenu()

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
        gElCanvas.height = (img.naturalHeight / img.naturalWidth) * gElCanvas.width
        gSelectedImg = img // Store the image for redrawing
        renderCanvas() // Redraw everything including the image
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
    closeMobileMenu()

    selectedImgMode = false
}

function resetEditingState(shouldUpdateEmojiButtons = false) {
    editingIndex = -1
    if (typeof setEditingIndex === 'function') {
        setEditingIndex(-1)
    }
    gUpdateActiveTextInput = null
    renderCanvas()
    if (shouldUpdateEmojiButtons) {
        updateEmojiSizeButtons()
    }
}

function showDragClickVars(){
    console.log('isDragging:', isDragging)
    console.log('hasDragged:', hasDragged)
    console.log('draggedTextIndex:', draggedTextIndex)
    console.log('draggedEmojiIndex:', draggedEmojiIndex)
    console.log('lastClickTime:', lastClickTime)
    console.log('lastClickIndex:', lastClickIndex)
}

function resetDragClickVars(isAddingtext = false, resetClickTracking = true){
    isDragging = false
    hasDragged = false
    dragStartPos = null
    dragOffset = { x: 0, y: 0 }
    draggedTextIndex = -1
    draggedEmojiIndex = -1
    if (resetClickTracking) {
        lastClickTime = 0
        lastClickIndex = -1
    }
    if (isAddingtext) {
        resetAddingItemMode()
    }
}

//////////////////////////////menu toggle/////////////////////////////////////
function initMenuToggle() {
    const menuToggle = document.querySelector('.menu-toggle')
    if (!menuToggle) return
    
    menuToggle.addEventListener('click', function() {
        document.body.classList.toggle('menu-open')
    })

    // Close menu when clicking on nav items (for better UX on mobile)
    const navButtons = document.querySelectorAll('.nav-button')
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Only close if on mobile
            if (window.innerWidth <= 800 && document.body.classList.contains('menu-open')) {
                document.body.classList.remove('menu-open')
            }
        })
    })
}

function closeMobileMenu() {
    if (window.innerWidth <= 800) {
        document.body.classList.remove('menu-open')
    }
}
