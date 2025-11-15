let textObjects = [] // Array storing all text objects on canvas
let editingIndex = -1 // Index of currently editing text (-1 = none)
let addingTextMode = false // Whether "Add Text" mode is active
let emojiObjects = [] // Array storing all emoji objects on canvas
let selectedEmojiIndex = -1 // Index of currently selected emoji (-1 = none)

function getEditingIndex() {
    return editingIndex
}


function resetAddingItemMode() {
    selectedEmojiIndex = -1
    addingTextMode = false
    editingIndex = -1
}

function getTextObjects() {
    return textObjects
}

function getEmojiObjects() {
    return emojiObjects
}

function ClearCanvas(ctx, canvas) {
    const bg = gMemeSettings?.backgroundColor || 'white'
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function createNewText(x, y, fontSizeInput, fontFamilySelect, textColorInput) {
    return {
        text: 'edit me',
        x,
        y,
        fontSize: fontSizeInput ? parseInt(fontSizeInput.value) : 20,   //default values
        fontFamily: fontFamilySelect ? fontFamilySelect.value : 'Arial',
        color: textColorInput ? textColorInput.value : '#000000'
    }
}

function boundtext(obj,metrics) {
    const textTop = obj.y - obj.fontSize * 1.2
    const textBottom = obj.y + obj.fontSize * 0.1
    const textLeft = obj.x - obj.fontSize
    const textRight = obj.x + metrics.width - obj.fontSize
    return {textTop:textTop, textBottom:textBottom, textLeft:textLeft, textRight:textRight}
}


function handleAddTextButton() {
    addingTextMode = !addingTextMode
    onUpdateAddTextButton()
}

// Convert canvas coordinates to screen coordinates relative to wrapper
function canvasToScreen(canvasX, canvasY,canvasRect,wrapperRect,gElCanvasWidth,gElCanvasHeight) {
    const scaleX = canvasRect.width / gElCanvasWidth
    const scaleY = canvasRect.height / gElCanvasHeight
    const screenX = (canvasX * scaleX) + (canvasRect.left - wrapperRect.left)
    const screenY = (canvasY * scaleY) + (canvasRect.top - wrapperRect.top)
    return { x: screenX, y: screenY, scaleX, scaleY }
}

function XYHandler(e) {     //get x,y on canvas
    const canvas = document.querySelector('canvas')
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    // Handle both mouse and touch events - added the touch handling part from internet
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || (e.changedTouches && e.changedTouches[0]?.clientX)
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || (e.changedTouches && e.changedTouches[0]?.clientY)

    const relativeX = clientX - rect.left
    const relativeY = clientY - rect.top
    const x = (relativeX * scaleX) - 20  // because of the border of the canvas
    const y = relativeY * scaleY
    
    return { x, y }
}

// Create and style the input element for text editing
function createStyledInputElement(textObj, screenPos) {
    const fontSizeScaled = textObj.fontSize * screenPos.scaleY
    const inputX = screenPos.x
    const inputY = screenPos.y - fontSizeScaled
    
    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'edit-input'
    input.value = textObj.text
    input.style.left = inputX + 'px'
    input.style.top = inputY + 'px'
    input.style.fontSize = fontSizeScaled + 'px'
    input.style.fontFamily = textObj.fontFamily
    input.style.color = textObj.color
    input.style.width = Math.max(100, textObj.text.length * textObj.fontSize * screenPos.scaleX * 0.6) + 'px'
    
    return input
}

// Update input element styling based on text object
function updateInputElementStyling(input, textObj, canvasRect, wrapperRect, canvasWidth, canvasHeight) {
    const screenPos = canvasToScreen(textObj.x, textObj.y, canvasRect, wrapperRect, canvasWidth, canvasHeight)
    const fontSizeScaled = textObj.fontSize * screenPos.scaleY
    const inputX = screenPos.x
    const inputY = screenPos.y - fontSizeScaled
    
    input.style.fontSize = fontSizeScaled + 'px'
    input.style.fontFamily = textObj.fontFamily
    input.style.color = textObj.color
    input.style.left = inputX + 'px'
    input.style.top = inputY + 'px'
    input.style.width = Math.max(100, input.value.length * textObj.fontSize * screenPos.scaleX * 0.6) + 'px'
}
