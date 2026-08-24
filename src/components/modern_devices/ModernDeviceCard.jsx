import { useState } from "react";
// Removed: import { Link } from "react-router-dom";
import { HiMiniPencilSquare, HiWifi, HiSignal } from "react-icons/hi2";
import { MdSchedule } from "react-icons/md";
import { 
    HiOutlineDesktopComputer, 
    HiOutlineDeviceMobile, 
    HiOutlineDeviceTablet 
} from "react-icons/hi";
import BonusTimeButton from "../utility_components/BonusTimeButton";

export default function ModernDeviceCard({ 
    device, 
    onToggle, 
    onEdit, 
    onDelete, 
    onScheduleClick, // Added prop
    timerCancelled, 
    timerHandler, 
    handleRenderToggle 
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Determine device type icon based on name or mac address patterns
    const getDeviceIcon = (device) => {
        const name = device?.name?.toLowerCase() || '';
        const hostname = device?.hostname?.toLowerCase() || '';
        
        if (name.includes('phone') || name.includes('mobile') || hostname.includes('phone')) {
            return <HiOutlineDeviceMobile className="w-6 h-6" />;
        } else if (name.includes('tablet') || name.includes('ipad') || hostname.includes('tablet')) {
            return <HiOutlineDeviceTablet className="w-6 h-6" />;
        } else {
            return <HiOutlineDesktopComputer className="w-6 h-6" />;
        }
    };

    // Get card border classes based on device status
    const getCardBorderClasses = (active, bonusTimeActive) => {
        let borderColor = '';
        if (active && bonusTimeActive) borderColor = 'border-info';
        else if (active) borderColor = 'border-success';
        else borderColor = 'border-error';
        
        return `border border-base-300 relative ${borderColor}`;
    };

    // Get accent border color for the left partial border
    const getAccentBorderColor = (active, bonusTimeActive) => {
        if (active && bonusTimeActive) return '#3B82F6'; // blue-500
        if (active) return '#10B981'; // green-500
        return '#EF4444'; // red-500
    };

    return (
        <div className={`bg-white dark:bg-base-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${getCardBorderClasses(device?.active, device?.bonusTimeActive)}`}>
            {/* Stylized left accent border */}
            <div 
                className="absolute top-0 left-0 w-1/3 h-1 rounded-tl-xl"
                style={{ backgroundColor: getAccentBorderColor(device?.active, device?.bonusTimeActive) }}
            ></div>
            
            {/* Card Header */}
            <div className="p-6 pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Device Icon */}
                        <div className="flex-shrink-0 p-2 rounded-lg bg-base-200 text-base-content/70">
                            {getDeviceIcon(device)}
                        </div>
                        
                        {/* Device Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-base-content truncate">
                                {device?.name || device?.macAddress || 'Unknown Device'}
                            </h3>
                            <p className="text-sm text-base-content/60 truncate">
                                {device?.macAddress}
                            </p>
                            {/* Reserve space for group badge so toggle/controls don't shift */}
                            <div className="mt-1 min-h-6">
                                {device?.deviceGroup ? (
                                    <div className="flex items-center gap-1">
                                        <span 
                                            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                                            style={{ 
                                                backgroundColor: device.deviceGroup.color + '20',
                                                color: device.deviceGroup.color 
                                            }}
                                        >
                                            <span>{device.deviceGroup.icon}</span>
                                            {device.deviceGroup.name}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="invisible">placeholder</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status indicator removed - now using card border */}
                </div>

                {/* Quick Actions Row */}
                <div className="flex items-center justify-between mt-4">
                    {/* Main Toggle */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            className={`toggle toggle-sm ${
                                device?.active && device?.bonusTimeActive 
                                    ? "toggle-info" 
                                    : device?.active 
                                        ? "toggle-success" 
                                        : "toggle-error"
                            }`}
                            title={device?.active ? 'Click to block this device' : 'Click to allow this device'}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle(device?.id);
                            }}
                            checked={device?.active || false}
                            readOnly
                        />
                        <span className="text-sm text-base-content/70" title={device?.active ? 'This device is currently allowed' : 'This device is currently blocked'}>
                            {device?.active ? 'Allowed' : 'Blocked'}
                        </span>

                        <BonusTimeButton
                            deviceId={device?.id}
                            timerCancelled={timerCancelled}
                            timerHandler={timerHandler}
                            bonusTimeActive={device?.bonusTimeActive}
                            handleRenderToggle={handleRenderToggle}
                        />
                        <button
                            onClick={() => onScheduleClick(device?.id, device?.name)}
                            className="btn btn-xs gap-0 btn-outline btn-warning"
                            title="Schedule this device"
                        >
                            <MdSchedule className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="btn btn-ghost btn-xs"
                        >
                            {isExpanded ? 'Less' : 'More'}
                        </button>
                        
                        <button
                            onClick={() => onEdit(device?.id)}
                            className="btn btn-ghost btn-xs text-base-content/50 hover:text-primary"
                            title="Edit Device"
                        >
                            <HiMiniPencilSquare className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-base-300 bg-base-200/50">
                    {/* Device Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                            <span className="text-base-content/60">Name:</span>
                            <p className="font-medium text-base-content mt-1 break-words">
                                {device?.name || 'Not set'}
                            </p>
                        </div>
                        <div>
                            <span className="text-base-content/60">Status:</span>
                            <p className={`font-medium mt-1 ${
                                device?.active ? 'text-success' : 'text-error'
                            }`}>
                                {device?.active ? 'Allowed' : 'Blocked'}
                            </p>
                        </div>
                    </div>

                    {/* Delete */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => onDelete(device?.id)}
                            className="btn btn-error btn-outline btn-sm flex-1"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}