let textObjects = [] // Array storing all text objects on canvas
let editingIndex = -1 // Index of currently editing text (-1 = none)
let addingTextMode = false // Whether "Add Text" mode is active



function getTextObjects(){
    return textObjects
}

function ClearCanvas(ctx, canvas) {
  const bg = gMemeSettings?.backgroundColor || 'white'
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function createNewText(x,y,fontSizeInput,fontFamilySelect,textColorInput){
    return {
        text:'edit me',
        x,
        y,
        fontSize: parseInt(fontSizeInput.value),
        fontFamily: fontFamilySelect.value,
        color: textColorInput.value
    }

}