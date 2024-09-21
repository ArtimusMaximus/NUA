import { useState } from "react";

export function SelectStandardOrAdvanced({ setScheduleMode, reRender  }) {

    const [selectEasy, setSelectEasy] = useState(true);

    const handleEasySelect = () => {
        setScheduleMode("standard");
        setSelectEasy(true);
        reRender();
    }
    const handleAdvancedSelect = () => {
        setScheduleMode("advanced");
        setSelectEasy(false);
        reRender();
    }

    return (
        <>
            <div className="flex items-center justify-center">
                <div className="join m-4 bg-base-200 border-8 border-base-200 rounded-lg">
                    <input onClick={handleEasySelect} className="join-item btn" value="standard" type="radio"  name="optionsStandardAdvanced" aria-label="Standard" checked={selectEasy} />
                    <input onClick={handleAdvancedSelect} className="join-item btn" value="advanced" type="radio" name="optionsStandardAdvanced" aria-label="Advanced" checked={!selectEasy} />
                </div>
            </div>

        </>
    );
}