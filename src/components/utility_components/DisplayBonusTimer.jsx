export default function DisplayBonusTimer({ milliTime }) {

    const hours = (Math.floor((milliTime / (1000*60*60)) % 24));
    const minutes = (Math.floor((milliTime / (1000*60)) % 60));
    const seconds = (Math.floor(milliTime / (1000) % 60));

    return (
        <>
            {milliTime ?
                <>
                    {hours + " : " + minutes + " : " + seconds}
                </>
            :
            <></>
            }
        </>
    );
}