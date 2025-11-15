'use strict'

// Make onKeywordPressed available globally
window.onKeywordPressed = onKeywordPressed

const itemWidth = 230
const gImgsPath = [{ id: 1, url: 'img/meme-imgs (square)/1.jpg', keyWords: ['funny', 'sarcastic', 'human'] },
{ id: 2, url: 'img/meme-imgs (square)/2.jpg', keyWords: ['cute', 'pet','dog'] },
{ id: 3, url: 'img/meme-imgs (square)/3.jpg', keyWords: ['cute', 'pet', 'baby', 'sleep','dog'] },
{ id: 4, url: 'img/meme-imgs (square)/4.jpg', keyWords: ['cute', 'pet', 'sleep','cat'] },
{ id: 5, url: 'img/meme-imgs (square)/5.jpg', keyWords: ['funny', 'baby'] },
{ id: 6, url: 'img/meme-imgs (square)/6.jpg', keyWords: ['funny', 'aliens', 'human'] },
{ id: 7, url: 'img/meme-imgs (square)/7.jpg', keyWords: ['funny', 'shocked', 'baby'] },
{ id: 8, url: 'img/meme-imgs (square)/8.jpg', keyWords: ['oh', 'sarcastic', 'human'] },
{ id: 9, url: 'img/meme-imgs (square)/9.jpg', keyWords: ['funny', 'evil', 'baby'] },
{ id: 10, url: 'img/meme-imgs (square)/10.jpg', keyWords: ['human'] },
{ id: 11, url: 'img/meme-imgs (square)/11.jpg', keyWords: ['funny', 'human', 'fight'] },
{ id: 12, url: 'img/meme-imgs (square)/12.jpg', keyWords: ['funny', 'human'] },
{ id: 13, url: 'img/meme-imgs (square)/13.jpg', keyWords: ['funny', 'human'] },
{ id: 14, url: 'img/meme-imgs (square)/14.jpg', keyWords: ['funny', 'human', 'what if i told you'] },
{ id: 15, url: 'img/meme-imgs (square)/15.jpg', keyWords: ['funny', 'human', 'one does not simply walk into mordor'] },
{ id: 16, url: 'img/meme-imgs (square)/16.jpg', keyWords: ['funny', 'human', 'star trek'] },
{ id: 17, url: 'img/meme-imgs (square)/17.jpg', keyWords: ['human', 'sarcastic'] },
{ id: 18, url: 'img/meme-imgs (square)/18.jpg', keyWords: ['sarcastic', 'everywhere', 'toy'] }]

var gKeywordSearchCountMap = { 'funny': 0, 'baby': 0, 'dog': 0, 'human': 0, 'sarcastic': 0, 'pet': 0 }

function getKeywordSearchCountMapHtml() {
    
    var strHtml = Object.keys(gKeywordSearchCountMap).map(key => {
        const count = gKeywordSearchCountMap[key]
        // Calculate font size: base 14px, +2px per count, max 24px
        const fontSize = Math.min(14 + (count * 2), 24)
        return `<span class="keyword-tag" data-keyword="${key}" data-count="${count}" style="font-size: ${fontSize}px" onclick="onKeywordPressed('${key}')">${key}</span>`
    }).join('')
    return `<div class="keyword-container">${strHtml}</div>`
}

function onKeywordPressed(keyword) {
    // Increment count
    if (!gKeywordSearchCountMap[keyword]) {
        gKeywordSearchCountMap[keyword] = 0
    }
    gKeywordSearchCountMap[keyword]++
    
    // Update the button's font size
    const keywordTag = document.querySelector(`.keyword-tag[data-keyword="${keyword}"]`)
    if (keywordTag) {
        const count = gKeywordSearchCountMap[keyword]
        const fontSize = Math.min(14 + (count * 2), 24)
        keywordTag.style.fontSize = `${fontSize}px`
        keywordTag.setAttribute('data-count', count)
    }
    
    // Filter memes (onFilterMemes is defined in controller.js)
    if (typeof onFilterMemes === 'function') {
        onFilterMemes(keyword)
    }
}


function getImgs() {
    const imgs = []
    for (let i = 0; i < gImgsPath.length; i++) {
        const img = new Image()
        img.src = gImgsPath[i].url
        img.alt = 'meme ' + (i + 1)
        // Store image object with all properties including keywords
        imgs.push({
            id: gImgsPath[i].id,
            img: img,  // The actual Image object
            url: gImgsPath[i].url,
            alt: img.alt,
            keyWords: gImgsPath[i].keyWords
        })
    }
    return imgs
}

