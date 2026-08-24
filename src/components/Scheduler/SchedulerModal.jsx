import { useEffect, useRef, useState } from "react";
import CronManager from "../CronManager";
import EasySched from "../EasySched";
import ScheduleData from "./ScheduleData";
import { SelectStandardOrAdvanced } from "./SchedulerComponents/SelectStandardOrAdvanced";
import { HiXMark } from "react-icons/hi2";

export default function SchedulerModal({ deviceId, deviceName, isOpen, onClose, triggerRender }) {
    const [scheduleMode, setScheduleMode] = useState("standard");
    const [render, setRender] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState({ name: deviceName });
    const [changed, setChanged] = useState(false);
    const closeButtonRef = useRef(null);
    const previousActiveElementRef = useRef(null);

    const triggerRenderCallback = () => {
        triggerRender();
        setChanged(prev => !prev);
    };

    const reRender = () => {
        setRender(prev => !prev);
    };

    useEffect(() => {
        if (isOpen) {
            previousActiveElementRef.current = document.activeElement;
            // Defer focus until modal content is mounted.
            const timerId = setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 0);
            return () => clearTimeout(timerId);
        }

        const previousActive = previousActiveElementRef.current;
        if (previousActive && typeof previousActive.focus === "function") {
            previousActive.focus();
        }
    }, [isOpen]);

    // Close modal when device ID changes (if needed)
    useEffect(() => {
        if (!isOpen) return;

        const controller = new AbortController();

        // Fetch device info when modal opens
        const getDeviceData = async () => {
            try {
                const getDeviceName = await fetch('/getspecificdevice', {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: deviceId }),
                    signal: controller.signal
                });
                if (getDeviceName.ok) {
                    const devInfo = await getDeviceName.json();
                    setDeviceInfo(devInfo);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error fetching device info:', error);
                }
            }
        };

        getDeviceData();

        return () => {
            controller.abort();
        };
    }, [isOpen, deviceId]);

    if (!isOpen) return null;

    return (
        <dialog
            id="scheduler-modal"
            className="modal modal-open"
            aria-modal="true"
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <div className="modal-box max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-base-content">
                        Schedule for <span className="text-primary">"{deviceInfo?.name}"</span>
                    </h2>
                    <button 
                        ref={closeButtonRef}
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onClose}
                        aria-label="Close scheduler modal"
                    >
                        <HiXMark className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Existing Schedules */}
                <div className="bg-base-200 rounded-xl p-5 mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-base-content">Existing Schedules</h3>
                    <ScheduleData changed={changed} deviceId={deviceId} />
                </div>
                
                {/* New Schedule Form */}
                <div className="border-t border-base-300 pt-5">
                    <SelectStandardOrAdvanced 
                        scheduleMode={scheduleMode}
                        setScheduleMode={setScheduleMode} 
                        reRender={reRender} 
                    />
                    
                    <div className="mt-4">
                        {scheduleMode === "standard" ? (
                            <EasySched 
                                key={`easy-${render}`}
                                triggerRender={triggerRenderCallback} 
                                deviceId={deviceId}
                                deviceName={deviceInfo?.name}
                            />
                        ) : (
                            <CronManager 
                                key={`cron-${render}`}
                                triggerRender={triggerRenderCallback} 
                                deviceId={deviceId}
                                deviceName={deviceInfo?.name}
                            />
                        )}
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={onClose} aria-label="Close scheduler modal">close</button>
            </form>
        </dialog>
    );
}