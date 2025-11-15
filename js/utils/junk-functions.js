


function showCarouselContent(content) {
    let wholeContent = `
        <h1>Select Image</h1>
        <div class="carousel-container">
            <button class="carousel-btn carousel-btn-left" onclick="scrollCarousel(-1)">◄</button>
            <ul id="carousel-list">${content}</ul>
            <button class="carousel-btn carousel-btn-right" onclick="scrollCarousel(1)">►</button>
        </div>
    `
    const details = document.querySelector('.meme-selector')
    details.innerHTML = wholeContent
    details.style.display = 'flex'
    
    // Add scroll event listener to update button states
    const carousel = document.getElementById('carousel-list')
    if (carousel) {
        carousel.addEventListener('scroll', updateCarouselButtons)
        updateCarouselButtons()
    }
}

function scrollCarousel(direction) {
    const carousel = document.getElementById('carousel-list')
    if (!carousel) return
    const newScroll = getNewScroll(direction,carousel)
    carousel.scrollTo({
        left: newScroll,
        behavior: 'smooth'
    })
    setTimeout(updateCarouselButtons, 100)
}

function updateCarouselButtons() {  //update the scroll buttons-unavailable when at the start or end
    const carousel = document.getElementById('carousel-list')
    if (!carousel) return
    const leftBtn = document.querySelector('.carousel-btn-left')
    const rightBtn = document.querySelector('.carousel-btn-right')
    if (!leftBtn || !rightBtn) return
    const maxScroll = carousel.scrollWidth - carousel.clientWidth
    const currentScroll = carousel.scrollLeft
    // Enable/disable buttons based on scroll position
    leftBtn.disabled = currentScroll <= 0
    rightBtn.disabled = currentScroll >= maxScroll - 1
}


function getNewScroll(direction,carousel) {
    const currentScroll = carousel.scrollLeft
    const newScroll = currentScroll + (direction * itemWidth)   // direction is 1 or -1
    return newScroll
}