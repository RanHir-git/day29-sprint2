let textObjects = [] // Array storing all text objects on canvas
let editingIndex = -1 // Index of currently editing text (-1 = none)
let addingTextMode = false // Whether "Add Text" mode is active

function getEditingIndex() {
    return editingIndex
}

function setEditingIndex(index) {
    editingIndex = index
}



function getTextObjects() {
    return textObjects
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
    const rect = gElCanvas.getBoundingClientRect()
    // Handle both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || (e.changedTouches && e.changedTouches[0]?.clientX)
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || (e.changedTouches && e.changedTouches[0]?.clientY)
    const x = clientX - rect.left
    const y = clientY - rect.top + fontSizeInput.value/2
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
