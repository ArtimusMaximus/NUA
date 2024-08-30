import { useRef } from "react";

export function SelectOptionsComponent({ btnText, setScheduleMode, reRender }) {

    const btn1Ref = useRef(null);
    const btn2Ref = useRef(null);

    const handleBtn1Click = e => {
        e.preventDefault();
        btn2Ref.current.className = "btn w-28 bg-base-200 border-none min-h-0 h-8 capitalize";
        btn1Ref.current.className = "btn w-28 bg-primary font-bold min-h-0 h-8 text-neutral-content capitalize";
        setScheduleMode(btnText.btn1);
        reRender();
    }
    const handleBtn2Click = e => {
        e.preventDefault();
        btn1Ref.current.className = "btn w-28 bg-base-200 border-none min-h-0 h-8 capitalize";
        btn2Ref.current.className = "btn w-28 bg-primary font-bold min-h-0 h-8 text-neutral-content capitalize";
        setScheduleMode(btnText.btn2);
        reRender();
    }

    return (
        <>
            <div className="bg-base-200 flex flex-row rounded-md p-2 justify-evenly">
                <div
                    id="easyBtn"
                    ref={btn1Ref}
                    className="btn w-28 bg-primary border-none text-neutral-content font-bold min-h-0 h-8 capitalize"
                    onClick={handleBtn1Click}>{btnText.btn1}</div>
                <div
                    id="advancedBtn"
                    ref={btn2Ref}
                    className="btn w-28 bg-base-200 border-none min-h-0 h-8 capitalize"
                    onClick={handleBtn2Click}>{btnText.btn2}</div>
            </div>
        </>
    );
}