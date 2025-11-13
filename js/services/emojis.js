'use strict'

var gEmojis = [
    {
        id: 1,
        url: 'img/emojis/smiley.png',
        name: 'smile'
    },
    {
        id: 2,
        url: 'img/emojis/grin.png',
        name: 'grin'
    },
    {
        id: 3,
        url: 'img/emojis/joy.png',
        name: 'joy'
    },
    {
        id: 4,
        url: 'img/emojis/sweat_smile.png',
        name: 'sweat_smile'
    },
    {
        id: 5,
        url: 'img/emojis/heart_eyes.png',
        name: 'heart_eyes'
    },
    {
        id: 6,
        url: 'img/emojis/stuck_out_tongue_winking_eye.png',
        name: 'stuck_out_tongue_winking_eye'
    },
    {
        id: 7,
        url: 'img/emojis/money_mouth_face.png',
        name: 'money_mouth_face'
    },
    {
        id: 8,
        url: 'img/emojis/sleeping.png',
        name: 'sleeping'
    },
    {
        id: 9,
        url: 'img/emojis/scream.png',
        name: 'scream'
    },
    {
        id: 10,
        url: 'img/emojis/sunglasses.png',
        name: 'sunglasses'
    },
    {
        id: 11,
        url: 'img/emojis/partying_face.png',
        name: 'partying_face'
    },
    {
        id: 12,
        url: 'img/emojis/sob.png',
        name: 'sob'
    },
    {
        id: 13,
        url: 'img/emojis/rage.png',
        name: 'rage'
    },
    {
        id: 14,
        url: 'img/emojis/hankey.png',
        name: 'hankey'
    },
]

function getEmojis() {
    return gEmojis
}

function getEmojiById(id) {
    return gEmojis.find(emoji => emoji.id === id)
}

//////////////////////////////emoji size controls/////////////////////////////////////

function onIncreaseEmojiSizeService(selectedEmojiIndex, emojiObjects, getEmojiObjects, renderCanvas, updateEmojiSizeButtonsService) {
    if (selectedEmojiIndex === -1) return
    const currentEmojiObjects = getEmojiObjects()
    if (currentEmojiObjects[selectedEmojiIndex]) {
        const currentSize = currentEmojiObjects[selectedEmojiIndex].size || 40
        currentEmojiObjects[selectedEmojiIndex].size = Math.min(currentSize + 5, 200) // Max size 200
        renderCanvas()
        updateEmojiSizeButtonsService(selectedEmojiIndex, getEmojiObjects)
    }
}

function onDecreaseEmojiSizeService(selectedEmojiIndex, emojiObjects, getEmojiObjects, renderCanvas, updateEmojiSizeButtonsService) {
    if (selectedEmojiIndex === -1) return
    const currentEmojiObjects = getEmojiObjects()
    if (currentEmojiObjects[selectedEmojiIndex]) {
        const currentSize = currentEmojiObjects[selectedEmojiIndex].size || 40
        currentEmojiObjects[selectedEmojiIndex].size = Math.max(currentSize - 5, 10) // Min size 10
        renderCanvas()
        updateEmojiSizeButtonsService(selectedEmojiIndex, getEmojiObjects)
    }
}

function updateEmojiSizeButtonsService(selectedEmojiIndex, getEmojiObjects) {
    const emojiSizeUp = document.getElementById('emojiSizeUp')
    const emojiSizeDown = document.getElementById('emojiSizeDown')
    
    if (selectedEmojiIndex === -1) {
        if (emojiSizeUp) emojiSizeUp.disabled = true
        if (emojiSizeDown) emojiSizeDown.disabled = true
        return
    }
    
    const emojiObjects = getEmojiObjects()
    if (emojiObjects[selectedEmojiIndex]) {
        const currentSize = emojiObjects[selectedEmojiIndex].size || 40
        if (emojiSizeUp) emojiSizeUp.disabled = currentSize >= 200
        if (emojiSizeDown) emojiSizeDown.disabled = currentSize <= 10
    }
}