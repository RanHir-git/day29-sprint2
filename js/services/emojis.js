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