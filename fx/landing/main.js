let $ = (selector) => {
    return document.querySelectorAll(selector);
}


document.addEventListener('DOMContentLoaded', () => {


    var scroll = {
        activeSection: 0,
        sectionCount: $('.face').length,
        isThrottled: false,
        throttleDuration: 100,
        timeout: null
    }




    function nextSection() {
        if (scroll.activeSection < scroll.sectionCount-1) {
            console.log('next');
            document.body.classList.remove('step-' + (scroll.activeSection));
            void document.body.offsetWidth;
            document.body.classList.add('step-' + (++scroll.activeSection));
        }
    }

    function prevSection() {
        if (scroll.activeSection > 0) {
            console.log('prev');
            document.body.classList.remove('step-' + (scroll.activeSection));
            void document.body.offsetWidth;
            document.body.classList.add('step-' + (--scroll.activeSection));
        }
    }

    document.addEventListener('scroll', function (e) {
        e.preventDefault();
    });

    document.addEventListener('mousewheel', function (event) {
        event.preventDefault();

        console.log(event.deltaY)

        

        clearTimeout(scroll.timeout);
        scroll.timeout = setTimeout(function () {
            scroll.isThrottled = false;
        }, scroll.throttleDuration);

        if (!scroll.isThrottled) {
            if (event.deltaY < 0) {
                prevSection();
            } else {
                nextSection();
            }
        }
        scroll.isThrottled = true;
    });


    document.addEventListener('keydown', function (e) {
        if (e.keyCode == 40) {
            nextSection();
        } else if (e.keyCode == 38) {
            prevSection();
        }
    });
});