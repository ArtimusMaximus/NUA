export default function DisplayBonusTimer({ milliTime }) {

    const hours = (Math.floor((milliTime / (1000*60*60)) % 24));
    const minutes = (Math.floor((milliTime / (1000*60)) % 60));
    const seconds = (Math.floor(milliTime / (1000) % 60));

    return (
        <>
            {milliTime ?
                <div className="flex flex-col justify-center">
                        <div className="absolute">
                            {hours + " : " + minutes + " : " + seconds}
                        </div>
                </div>
            :
            <></>
            }
        </>
    );
}