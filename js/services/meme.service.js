'use strict'
const itemWidth = 230
const gImgsPath = ['img/meme-imgs (square)/1.jpg', 'img/meme-imgs (square)/2.jpg', 'img/meme-imgs (square)/3.jpg', 'img/meme-imgs (square)/4.jpg', 'img/meme-imgs (square)/5.jpg', 'img/meme-imgs (square)/6.jpg', 'img/meme-imgs (square)/7.jpg', 'img/meme-imgs (square)/8.jpg', 'img/meme-imgs (square)/9.jpg', 'img/meme-imgs (square)/10.jpg','img/meme-imgs (square)/11.jpg', 'img/meme-imgs (square)/12.jpg', 'img/meme-imgs (square)/13.jpg', 'img/meme-imgs (square)/14.jpg', 'img/meme-imgs (square)/15.jpg', 'img/meme-imgs (square)/16.jpg', 'img/meme-imgs (square)/17.jpg', 'img/meme-imgs (square)/18.jpg']

function getImgs(){
    const imgs = []
    for(let i = 0; i < gImgsPath.length; i++){
        const img = new Image()
        img.src = gImgsPath[i]
        img.alt = 'meme ' + (i + 1)
        imgs.push(img)
    }
    return imgs
}

function getNewScroll(direction,carousel) {
    const currentScroll = carousel.scrollLeft
    const newScroll = currentScroll + (direction * itemWidth)   // direction is 1 or -1
    return newScroll
}