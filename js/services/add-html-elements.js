'use strict'
function getGalleryHtml() {
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

    // Upload item HTML (always first)
    const uploadItemHtml = `
        <div class="gallery-item upload-item" onclick="onUploadImageClick()">
            <div style="width: 100%; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
                <div style="font-size: 48px; margin-bottom: 10px;">📤</div>
                <div style="font-size: 14px; text-align: center; padding: 0 10px;">Upload Image</div>
            </div>
        </div>
    `

    let wholeContent = `
        <h1>Select Image</h1>
        <input type="text" id="meme-search" placeholder="Search Memes" oninput="onFilterMemes(this.value)">
        ${keywordSearchCountMapHtml}
        <span class="gallery-buttons">
        <button onclick="onFilterMemes('')">Show All Memes</button>
        <button onclick="onRandomMeme()">random meme</button>
        </span>
        <input type="file" id="imageUploadInput" accept="image/*" style="display: none;" onchange="onImageUpload(this)">
        <div class="gallery-grid">
            ${uploadItemHtml}
            ${strHtml}
        </div>
    `
    return wholeContent
}