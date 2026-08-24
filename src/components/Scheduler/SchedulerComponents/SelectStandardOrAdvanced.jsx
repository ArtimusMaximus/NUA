import { HiOutlineClock, HiOutlineCog6Tooth } from 'react-icons/hi2';

export function SelectStandardOrAdvanced({ scheduleMode, setScheduleMode, reRender }) {
    const handleSelectMode = (mode) => {
        if (scheduleMode === mode) return;
        setScheduleMode(mode);
        reRender();
    };

    return (
        <div className="flex justify-center">
            <div className="flex items-center gap-1 bg-base-200 rounded-xl p-1 shadow-inner">
                <button
                    className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        scheduleMode === 'standard'
                            ? 'bg-base-100 shadow-sm text-base-content'
                            : 'text-base-content/70 hover:text-base-content hover:bg-base-300'
                    }`}
                    onClick={() => handleSelectMode('standard')}
                >
                    <HiOutlineClock className="w-4 h-4" />
                    Easy Schedule
                </button>
                <button
                    className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        scheduleMode === 'advanced'
                            ? 'bg-base-100 shadow-sm text-base-content'
                            : 'text-base-content/70 hover:text-base-content hover:bg-base-300'
                    }`}
                    onClick={() => handleSelectMode('advanced')}
                >
                    <HiOutlineCog6Tooth className="w-4 h-4" />
                    Advanced
                </button>
            </div>
        </div>
    );
}