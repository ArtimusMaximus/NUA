import { convertDigitsToDOW } from "../../utility_functions/convertDigitsToDOTW";

export const DisplayOneTimeOrRecurringSchedule = ({ oneTime, ezData }) => {
    let daysOfTheWeek = null;
    if (ezData.days) {
        daysOfTheWeek = convertDigitsToDOW(ezData.days);
    }
    if (oneTime) {
        return (
            <>
                <div>{ezData.date.slice(5)}</div>
                <div>{ezData.hour}:{ezData.minute === 0 ? ezData.minute + "0": ezData.minute}</div>
            </>
        )
    } else {
        return (
            <>
                <div>{ezData.hour}:{ezData.minute}</div>
                <div>{daysOfTheWeek.length < 7
                    ? daysOfTheWeek.map((day) => {
                        return (
                            <>
                                {day}{day === daysOfTheWeek[daysOfTheWeek.length - 1] ? "" : ","}
                            </>
                        )
                    }) : <>All</>}
                </div>
            </>
        )
    }
}