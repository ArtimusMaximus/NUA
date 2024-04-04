import { useEffect, useState } from "react"

export default function ScrollToTop()
{
    const [inView, setInView] = useState(false);
    const handleScrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }
    useEffect(() => {
        let height = window.innerHeight;
        let timeoutId;

        const handleScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (window.scrollY > height) {
                    setInView(true);
                } else if (window.scrollY < height) {
                    setInView(false);
                }
            }, 100);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
        }

    }, [])
    return (
        <>
            <button
                className={`btn btn-circle left-[95%] bottom-5 mr-4 ${inView ? 'sticky' : 'hidden'}`}
                onClick={handleScrollToTop}>Top
            </button>
        </>
    )
}