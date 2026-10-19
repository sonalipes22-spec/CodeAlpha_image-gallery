const gallery = document.getElementById("gallery");
const items = [...document.querySelectorAll(".gallery-item")];
const filterButtons = document.querySelectorAll(".filter-btn");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const imageCount = document.getElementById("imageCount");
const emptyMessage = document.getElementById("emptyMessage");

const lightbox = document.getElementById("lightbox");
const stage = document.getElementById("imageStage");
const lightboxImg = document.getElementById("lightboxImg");
const viewerTitle = document.getElementById("viewerTitle");
const counter = document.getElementById("counter");

const closeBtn = document.getElementById("closeBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");
const rotateBtn = document.getElementById("rotateBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const slideshowBtn = document.getElementById("slideshowBtn");
const downloadBtn = document.getElementById("downloadBtn");

let activeFilter = "all";
let currentIndex = 0;
let zoom = 1;
let rotation = 0;
let panX = 0;
let panY = 0;
let slideTimer = null;
let dragStart = null;
let lastFocusedElement = null;


// Get images currently visible after filtering/search
function getVisibleItems() {
    return [...gallery.querySelectorAll(".gallery-item")]
        .filter(item => item.style.display !== "none");
}


// Update the number of visible images
function updateCount() {
    const visible = getVisibleItems();
    imageCount.textContent =
        `Showing ${visible.length} of ${items.length} images`;

    emptyMessage.hidden = visible.length !== 0;
}


// Filter and search
function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();

    items.forEach(item => {
        const img = item.querySelector("img");
        const category = item.dataset.category;
        const title = img.dataset.title || img.alt;

        const matchesCategory =
            activeFilter === "all" || category === activeFilter;

        const matchesSearch =
            title.toLowerCase().includes(search) ||
            img.alt.toLowerCase().includes(search);

        item.style.display =
            matchesCategory && matchesSearch ? "" : "none";
    });

    updateCount();
}


// Category buttons
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;

        filterButtons.forEach(btn =>
            btn.classList.toggle("active", btn === button)
        );

        applyFilters();
    });
});


// Search as you type
searchInput.addEventListener("input", applyFilters);


// Sort images by title
sortSelect.addEventListener("change", () => {
    const sorted = [...items];

    if (sortSelect.value === "az") {
        sorted.sort((a, b) =>
            getTitle(a).localeCompare(getTitle(b))
        );
    } else if (sortSelect.value === "za") {
        sorted.sort((a, b) =>
            getTitle(b).localeCompare(getTitle(a))
        );
    }

    sorted.forEach(item => gallery.appendChild(item));
    applyFilters();
});

function getTitle(item) {
    const img = item.querySelector("img");
    return img.dataset.title || img.alt;
}


// Reset zoom, pan and rotation
function resetImageView() {
    zoom = 1;
    rotation = 0;
    panX = 0;
    panY = 0;
    updateImageTransform();
}

function updateImageTransform() {
    lightboxImg.style.transform =
        `translate(${panX}px, ${panY}px) rotate(${rotation}deg) scale(${zoom})`;
}


// Open an image in the viewer
function openImage(item) {
    const visible = getVisibleItems();
    currentIndex = visible.indexOf(item);

    if (currentIndex < 0) return;

    lastFocusedElement = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";

    showCurrentImage();
    closeBtn.focus();
}


// Display selected image
function showCurrentImage() {
    const visible = getVisibleItems();

    if (!visible.length) {
        closeViewer();
        return;
    }

    currentIndex = (currentIndex + visible.length) % visible.length;

    const item = visible[currentIndex];
    const img = item.querySelector("img");
    const title = getTitle(item);

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    viewerTitle.textContent = title;
    counter.textContent = `${currentIndex + 1} / ${visible.length}`;

    downloadBtn.href = img.src;
    downloadBtn.download =
        (title.replace(/[^a-z0-9_-]/gi, "-") || "gallery-image") + ".jpg";

    resetImageView();
}


// Open from image or View Image button
items.forEach(item => {
    item.querySelector("img").addEventListener("click", () => {
        openImage(item);
    });

    item.querySelector(".open-btn").addEventListener("click", () => {
        openImage(item);
    });
});


// Previous / Next
function showPrevious() {
    currentIndex--;
    showCurrentImage();
}

function showNext() {
    currentIndex++;
    showCurrentImage();
}

prevBtn.addEventListener("click", showPrevious);
nextBtn.addEventListener("click", showNext);


// Close viewer
function closeViewer() {
    stopSlideshow();
    lightbox.hidden = true;
    document.body.style.overflow = "";

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

closeBtn.addEventListener("click", closeViewer);


// Close when clicking the dark area
lightbox.addEventListener("click", event => {
    if (event.target === lightbox) {
        closeViewer();
    }
});


// Zoom in / out
function changeZoom(amount) {
    zoom = Math.max(1, Math.min(4, zoom + amount));

    if (zoom === 1) {
        panX = 0;
        panY = 0;
    }

    updateImageTransform();
}

zoomInBtn.addEventListener("click", () => changeZoom(0.25));
zoomOutBtn.addEventListener("click", () => changeZoom(-0.25));
zoomResetBtn.addEventListener("click", resetImageView);


// Mouse wheel zoom
stage.addEventListener("wheel", event => {
    if (lightbox.hidden) return;

    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.2 : -0.2);
}, { passive: false });


// Rotate image
rotateBtn.addEventListener("click", () => {
    rotation = (rotation + 90) % 360;
    updateImageTransform();
});


// Drag image when zoomed in
stage.addEventListener("pointerdown", event => {
    if (zoom <= 1 || event.target !== lightboxImg) return;

    dragStart = {
        x: event.clientX,
        y: event.clientY,
        panX,
        panY
    };

    stage.setPointerCapture(event.pointerId);
});

stage.addEventListener("pointermove", event => {
    if (!dragStart) return;

    panX = dragStart.panX + event.clientX - dragStart.x;
    panY = dragStart.panY + event.clientY - dragStart.y;

    updateImageTransform();
});

function stopDragging() {
    dragStart = null;
}

stage.addEventListener("pointerup", stopDragging);
stage.addEventListener("pointercancel", stopDragging);


// Fullscreen mode
fullscreenBtn.addEventListener("click", async () => {
    try {
        if (!document.fullscreenElement) {
            await lightbox.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (error) {
        alert("Fullscreen is not available in this browser.");
    }
});


// Slideshow
function stopSlideshow() {
    if (slideTimer !== null) {
        clearInterval(slideTimer);
        slideTimer = null;
    }

    slideshowBtn.textContent = "▶ Slideshow";
}

function startSlideshow() {
    if (getVisibleItems().length < 2) return;

    slideTimer = setInterval(showNext, 3000);
    slideshowBtn.textContent = "⏸ Stop Slideshow";
}

slideshowBtn.addEventListener("click", () => {
    if (slideTimer !== null) {
        stopSlideshow();
    } else {
        startSlideshow();
    }
});


// Stop slideshow if the viewer closes
// Keyboard shortcuts
document.addEventListener("keydown", event => {
    const isTyping =
        event.target.matches("input, select, textarea");

    if (event.key === "Escape" && !lightbox.hidden) {
        event.preventDefault();
        closeViewer();
        return;
    }

    if (lightbox.hidden || isTyping) return;

    if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
    } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
    } else if (event.key === "+" || event.key === "=") {
        changeZoom(0.25);
    } else if (event.key === "-") {
        changeZoom(-0.25);
    } else if (event.key === "0") {
        resetImageView();
    } else if (event.code === "Space") {
        event.preventDefault();

        if (slideTimer !== null) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    }
});


// Swipe between images on touch screens
let touchStartX = null;

stage.addEventListener("touchstart", event => {
    if (zoom > 1) return;
    touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

stage.addEventListener("touchend", event => {
    if (touchStartX === null || zoom > 1) return;

    const difference =
        event.changedTouches[0].clientX - touchStartX;

    if (Math.abs(difference) > 60) {
        difference < 0 ? showNext() : showPrevious();
    }

    touchStartX = null;
}, { passive: true });


// Initial setup
applyFilters();
