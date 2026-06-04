const slides = document.querySelectorAll(".slide");

let current = 0;

function showSlide(index){
    slides.forEach(slide => {
        slide.classList.remove("active");
    });

    slides[index].classList.add("active");
}

function nextSlide(){
    current++;

    if(current >= slides.length){
        current = 0;
    }

    showSlide(current);
}

showSlide(0);

setInterval(nextSlide, 4000);