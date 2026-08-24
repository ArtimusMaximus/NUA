import { useState, useEffect, useRef } from 'react';
import { HiPlus } from 'react-icons/hi2';

export default function DeviceGroupManager({ devices, onGroupsUpdate }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [groupForm, setGroupForm] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: '👤'
    });
    const [schedules, setSchedules] = useState([]);
    const [scheduleForm, setScheduleForm] = useState({
        hour: 9,
        minute: 0,
        ampm: 'AM',
        blockAllow: 'block',
        oneTime: false,
        date: '',
        daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday by default
    });
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    const groupModalRef = useRef();
    const assignModalRef = useRef();
    const scheduleModalRef = useRef();

    // Common emoji options for groups
    const iconOptions = ['👤', '👥', '👨‍👩‍👧‍👦', '👦', '👧', '🏠', '💻', '📱', '🎮', '📺', '🔒', '⭐'];
    const colorOptions = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'];

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching device groups...');
            const response = await fetch('/api/device-groups');
            console.log('📡 Response status:', response.status, response.statusText);
            
            if (response.ok) {
                const groupsData = await response.json();
                console.log('✅ Groups fetched successfully:', groupsData);
                setGroups([...groupsData].sort((a, b) => a.name.localeCompare(b.name)));
            } else {
                const errorText = await response.text();
                console.error('❌ Error fetching groups: HTTP', response.status, response.statusText);
                console.error('📄 Response body:', errorText);
            }
        } catch (error) {
            console.error('❌ Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = () => {
        setEditingGroup(null);
        setGroupForm({
            name: '',
            description: '',
            color: '#3B82F6',
            icon: '👤'
        });
        setShowGroupModal(true);
        groupModalRef.current?.showModal();
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
        setGroupForm({
            name: group.name,
            description: group.description || '',
            color: group.color,
            icon: group.icon
        });
        setShowGroupModal(true);
        groupModalRef.current?.showModal();
    };

    const handleSaveGroup = async () => {
        try {
            setLoading(true);
            const url = editingGroup ? `/api/device-groups/${editingGroup.id}` : '/api/device-groups';
            const method = editingGroup ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(groupForm),
            });

            if (response.ok) {
                await fetchGroups();
                handleCloseModal();
                onGroupsUpdate?.();
            }
        } catch (error) {
            console.error('Error saving group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!confirm('Are you sure you want to delete this tag? Devices will be unassigned but not deleted.')) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/device-groups/${groupId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchGroups();
                onGroupsUpdate?.();
            }
        } catch (error) {
            console.error('Error deleting group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignDevices = (group) => {
        setEditingGroup(group);
        const groupDeviceIds = devices
            ?.filter(device => device.deviceGroupId === group.id)
            ?.map(device => device.id) || [];
        setSelectedDevices(groupDeviceIds);
        assignModalRef.current?.showModal();
    };

    const handleToggleDeviceSelection = (deviceId) => {
        setSelectedDevices(prev => 
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    const handleSaveDeviceAssignments = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/device-groups/${editingGroup.id}/devices`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ deviceIds: selectedDevices }),
            });

            if (response.ok) {
                assignModalRef.current?.close();
                onGroupsUpdate?.();
            }
        } catch (error) {
            console.error('Error updating device assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGroupAction = async (groupId, action) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/device-groups/${groupId}/${action}`, {
                method: 'POST',
            });

            if (response.ok) {
                onGroupsUpdate?.();
            }
        } catch (error) {
            console.error(`Error performing ${action} on group:`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowGroupModal(false);
        groupModalRef.current?.close();
    };

    // Schedule management handlers
    const handleManageSchedules = async (group) => {
        setEditingGroup(group);
        await fetchGroupSchedules(group.id);
        setShowScheduleModal(true);
        scheduleModalRef.current?.showModal();
    };

    const fetchGroupSchedules = async (groupId) => {
        try {
            const response = await fetch(`/api/device-groups/${groupId}/schedules`);
            if (response.ok) {
                const schedulesData = await response.json();
                setSchedules(schedulesData);
            }
        } catch (error) {
            console.error('Error fetching group schedules:', error);
        }
    };

    const handleCreateSchedule = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/device-groups/${editingGroup.id}/schedules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...scheduleForm,
                    modifiedDaysOfTheWeek: scheduleForm.daysOfWeek
                }),
            });

            if (response.ok) {
                await fetchGroupSchedules(editingGroup.id);
                setScheduleForm({
                    hour: 9,
                    minute: 0,
                    ampm: 'AM',
                    blockAllow: 'block',
                    oneTime: false,
                    date: '',
                    daysOfWeek: [1, 2, 3, 4, 5]
                });
            }
        } catch (error) {
            console.error('Error creating schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSchedule = async (scheduleId) => {
        if (!confirm('Are you sure you want to delete this schedule?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/device-groups/${editingGroup.id}/schedules/${scheduleId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchGroupSchedules(editingGroup.id);
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSchedule = async (scheduleId, currentToggle) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/device-groups/${editingGroup.id}/schedules/${scheduleId}/toggle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ toggleSched: !currentToggle }),
            });

            if (response.ok) {
                await fetchGroupSchedules(editingGroup.id);
            }
        } catch (error) {
            console.error('Error toggling schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseScheduleModal = () => {
        setShowScheduleModal(false);
        scheduleModalRef.current?.close();
    };

    const formatScheduleTime = (hour, minute, ampm) => {
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
    };

    const formatScheduleDays = (days) => {
        if (!days) return 'Daily';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = days.split('').map(d => dayNames[parseInt(d)]);
        return selectedDays.join(', ');
    };

    const toggleGroupExpansion = (groupId) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const getDeviceCount = (groupId) => {
        return devices?.filter(device => device.deviceGroupId === groupId)?.length || 0;
    };

    const getGroupBlockStatus = (groupId) => {
        const groupDevices = devices?.filter(device => device.deviceGroupId === groupId) || [];
        if (groupDevices.length === 0) return false;
        // Return true if ANY device in group is blocked (active: false)
        return groupDevices.some(device => !device.active);
    };

    // Get accent border color for group cards based on status
    const getGroupAccentColor = (groupId) => {
        const deviceCount = getDeviceCount(groupId);
        
        // Grey for empty groups
        if (deviceCount === 0) {
            return '#6B7280'; // gray-500
        }
        
        // Status-based colors for groups with devices
        const isBlocked = getGroupBlockStatus(groupId);
        if (isBlocked) {
            return '#EF4444'; // red-500 - some devices blocked
        } else {
            return '#10B981'; // green-500 - all devices active
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            {/* Tags Section */}
            <div className="mb-1">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-base-content">Tags</h2>
                    {groups.length > 0 && (
                        <button
                            className="btn btn-primary btn-sm gap-1"
                            onClick={handleCreateGroup}
                            disabled={loading}
                        >
                            <HiPlus className="w-4 h-4" /> Add Tag
                        </button>
                    )}
                </div>

                {loading && groups.length === 0 ? (
                    <div className="flex justify-center py-6">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-6">
                        <div className="text-3xl mb-2">🏷️</div>
                        <p className="text-base-content/60 text-sm mb-4">Create tags to organize your devices</p>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleCreateGroup}
                            disabled={loading}
                        >
                            <span className="text-base leading-none">+</span> Create First Tag
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-3 justify-center">
                        {groups.map(group => (
                            <div key={group.id} className="flex flex-col items-center">
                                {/* Tag Pill */}
                                <button
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200 hover:scale-105 focus:outline-none"
                                    style={{
                                        backgroundColor: group.color + '18',
                                        borderColor: expandedGroups.has(group.id) ? group.color : group.color + '50',
                                        boxShadow: expandedGroups.has(group.id) ? `0 0 0 3px ${group.color}30` : 'none'
                                    }}
                                    onClick={() => toggleGroupExpansion(group.id)}
                                >
                                    <span className="text-base">{group.icon}</span>
                                    <span className="text-sm font-semibold text-base-content">{group.name}</span>
                                    <span
                                        className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: group.color + '35', color: group.color }}
                                    >
                                        {getDeviceCount(group.id)}
                                    </span>
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: getGroupAccentColor(group.id) }}
                                        title={getDeviceCount(group.id) === 0 ? 'No devices' : getGroupBlockStatus(group.id) ? 'Some blocked' : 'All active'}
                                    />
                                </button>

                                {/* Expanded Actions Panel */}
                                {expandedGroups.has(group.id) && (
                                    <div className="mt-2 bg-base-200 rounded-xl border border-base-300 p-3 w-52 shadow-lg z-10">
                                        {/* Status Toggle Row */}
                                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-base-300">
                                            <span className="text-xs text-base-content/60">
                                                {getDeviceCount(group.id) === 0
                                                    ? 'No devices'
                                                    : getGroupBlockStatus(group.id)
                                                        ? 'Some blocked'
                                                        : 'All active'}
                                            </span>
                                            <input
                                                type="checkbox"
                                                className={`toggle toggle-xs ${!getGroupBlockStatus(group.id) ? 'toggle-success' : 'toggle-error'}`}
                                                checked={getDeviceCount(group.id) > 0 && !getGroupBlockStatus(group.id)}
                                                disabled={getDeviceCount(group.id) === 0}
                                                onChange={(e) => {
                                                    e.target.checked
                                                        ? handleGroupAction(group.id, 'unblock')
                                                        : handleGroupAction(group.id, 'block');
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <button
                                                className="btn btn-ghost btn-xs w-full justify-start gap-2"
                                                onClick={() => handleAssignDevices(group)}
                                            >
                                                👥 Assign Devices
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-xs w-full justify-start gap-2"
                                                onClick={() => handleEditGroup(group)}
                                            >
                                                ✏️ Edit Tag
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-xs w-full justify-start gap-2"
                                                onClick={() => handleManageSchedules(group)}
                                            >
                                                ⏰ Schedule
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-xs w-full justify-start gap-2 text-error hover:bg-error/10"
                                                onClick={() => handleDeleteGroup(group.id)}
                                            >
                                                🗑️ Delete Tag
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tag Creation/Edit Modal */}
            <dialog className="modal" ref={groupModalRef}>
                <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">
                            {editingGroup ? 'Edit Tag' : 'Create New Tag'}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="label">
                                    <span className="label-text">Tag Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter tag name"
                                    className="input input-bordered w-full"
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text">Description (Optional)</span>
                                </label>
                                <textarea
                                    placeholder="Enter tag description"
                                    className="textarea textarea-bordered w-full"
                                    rows="2"
                                    value={groupForm.description}
                                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text">Icon</span>
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {iconOptions.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            className={`btn btn-sm ${groupForm.icon === icon ? 'btn-primary' : 'btn-ghost'}`}
                                            onClick={() => setGroupForm(prev => ({ ...prev, icon }))}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text">Color</span>
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {colorOptions.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`w-8 h-8 rounded-full border-2 ${
                                                groupForm.color === color ? 'border-base-content' : 'border-base-300'
                                            }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setGroupForm(prev => ({ ...prev, color }))}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleSaveGroup}
                                disabled={!groupForm.name.trim() || loading}
                            >
                                {loading ? 'Saving...' : editingGroup ? 'Update Tag' : 'Create Tag'}
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={handleCloseModal}>close</button>
                    </form>
                </dialog>

                {/* Device Assignment Modal */}
                <dialog className="modal" ref={assignModalRef}>
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">
                            Assign Devices to "{editingGroup?.name}"
                        </h3>
                        
                        <div className="alert alert-info mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <div>
                                <h4 className="font-bold">How to assign devices:</h4>
                                <p className="text-sm">✅ Check the boxes next to devices you want in this group, then click "Save Changes"</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-base-content/60">
                                {selectedDevices.length} of {devices?.length || 0} devices selected
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    className="btn btn-xs btn-outline"
                                    onClick={() => setSelectedDevices(devices?.map(d => d.id) || [])}
                                >
                                    Select All
                                </button>
                                <button 
                                    className="btn btn-xs btn-outline"
                                    onClick={() => setSelectedDevices([])}
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto">
                            {devices?.length === 0 ? (
                                <p className="text-center py-8 text-base-content/60">
                                    No devices available
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {devices?.map(device => {
                                        const isSelected = selectedDevices.includes(device.id);
                                        const isCurrentlyInGroup = device.deviceGroupId === editingGroup?.id;
                                        return (
                                            <div 
                                                key={device.id} 
                                                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-primary/10 border-primary' 
                                                        : 'bg-base-200 border-transparent hover:border-base-300'
                                                }`}
                                                onClick={() => handleToggleDeviceSelection(device.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary"
                                                        checked={isSelected}
                                                        onClick={(event) => event.stopPropagation()}
                                                        onChange={() => handleToggleDeviceSelection(device.id)}
                                                    />
                                                    <div>
                                                        <p className="font-medium">{device.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm text-base-content/60">{device.macAddress}</p>
                                                            {isCurrentlyInGroup && (
                                                                <span className="badge badge-xs badge-primary">In this tag</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`badge ${device.active ? 'badge-success' : 'badge-error'}`}>
                                                    {device.active ? 'Active' : 'Blocked'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="modal-action">
                            <button 
                                className="btn btn-ghost" 
                                onClick={() => assignModalRef.current?.close()}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleSaveDeviceAssignments}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => assignModalRef.current?.close()}>close</button>
                    </form>
                </dialog>

                {/* Schedule Management Modal */}
                <dialog className="modal" ref={scheduleModalRef}>
                    <div className="modal-box w-11/12 max-w-4xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">
                                Manage Schedules for "{editingGroup?.name}"
                            </h3>
                            <form method="dialog">
                                <button 
                                    className="btn btn-sm btn-circle btn-ghost"
                                    onClick={handleCloseScheduleModal}
                                >
                                    ✕
                                </button>
                            </form>
                        </div>

                        {/* Create New Schedule Form */}
                        <div className="bg-base-200 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold mb-4">Create New Schedule</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Time inputs */}
                                <div>
                                    <label className="label">
                                        <span className="label-text">Time</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select 
                                            className="select select-bordered flex-1"
                                            value={scheduleForm.hour}
                                            onChange={(e) => setScheduleForm({...scheduleForm, hour: parseInt(e.target.value)})}
                                        >
                                            {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <select 
                                            className="select select-bordered flex-1"
                                            value={scheduleForm.minute}
                                            onChange={(e) => setScheduleForm({...scheduleForm, minute: parseInt(e.target.value)})}
                                        >
                                            {[0, 15, 30, 45].map(m => (
                                                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <select 
                                            className="select select-bordered"
                                            value={scheduleForm.ampm}
                                            onChange={(e) => setScheduleForm({...scheduleForm, ampm: e.target.value})}
                                        >
                                            <option value="AM">AM</option>
                                            <option value="PM">PM</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Action */}
                                <div>
                                    <label className="label">
                                        <span className="label-text">Action</span>
                                    </label>
                                    <select 
                                        className="select select-bordered w-full"
                                        value={scheduleForm.blockAllow}
                                        onChange={(e) => setScheduleForm({...scheduleForm, blockAllow: e.target.value})}
                                    >
                                        <option value="block">Block Devices</option>
                                        <option value="allow">Allow Devices</option>
                                    </select>
                                </div>

                                {/* Schedule Type */}
                                <div>
                                    <label className="label">
                                        <span className="label-text">Type</span>
                                    </label>
                                    <select 
                                        className="select select-bordered w-full"
                                        value={scheduleForm.oneTime}
                                        onChange={(e) => setScheduleForm({...scheduleForm, oneTime: e.target.value === 'true'})}
                                    >
                                        <option value="false">Recurring</option>
                                        <option value="true">One Time</option>
                                    </select>
                                </div>

                                {/* Date for one-time schedules */}
                                {scheduleForm.oneTime && (
                                    <div>
                                        <label className="label">
                                            <span className="label-text">Date</span>
                                        </label>
                                        <input 
                                            type="date"
                                            className="input input-bordered w-full"
                                            value={scheduleForm.date}
                                            onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                                        />
                                    </div>
                                )}

                                {/* Days of week for recurring schedules */}
                                {!scheduleForm.oneTime && (
                                    <div className="md:col-span-2">
                                        <label className="label">
                                            <span className="label-text">Days of Week</span>
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                                <label key={index} className="cursor-pointer flex items-center gap-1">
                                                    <input 
                                                        type="checkbox"
                                                        className="checkbox checkbox-sm"
                                                        checked={scheduleForm.daysOfWeek.includes(index)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setScheduleForm({
                                                                    ...scheduleForm, 
                                                                    daysOfWeek: [...scheduleForm.daysOfWeek, index].sort()
                                                                });
                                                            } else {
                                                                setScheduleForm({
                                                                    ...scheduleForm, 
                                                                    daysOfWeek: scheduleForm.daysOfWeek.filter(d => d !== index)
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-sm">{day}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end mt-4">
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleCreateSchedule}
                                    disabled={loading || (scheduleForm.oneTime && !scheduleForm.date) || (!scheduleForm.oneTime && scheduleForm.daysOfWeek.length === 0)}
                                >
                                    {loading ? 'Creating...' : 'Create Schedule'}
                                </button>
                            </div>
                        </div>

                        {/* Existing Schedules */}
                        <div>
                            <h4 className="font-semibold mb-4">Existing Schedules ({schedules.length})</h4>
                            {schedules.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No schedules created yet.</p>
                                    <p className="text-sm">Create a schedule above to automatically control this group.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {schedules.map(schedule => (
                                        <div key={schedule.id} className="bg-base-100 rounded-lg p-4 flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className={`badge ${schedule.blockAllow === 'block' ? 'badge-error' : 'badge-success'}`}>
                                                        {schedule.blockAllow === 'block' ? 'Block' : 'Allow'}
                                                    </div>
                                                    <span className="font-medium">
                                                        {formatScheduleTime(schedule.hour, schedule.minute, schedule.ampm)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {schedule.oneTime ? `On ${schedule.date}` : formatScheduleDays(schedule.days)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox"
                                                    className="toggle toggle-sm"
                                                    checked={schedule.toggleSched}
                                                    onChange={() => handleToggleSchedule(schedule.id, schedule.toggleSched)}
                                                />
                                                <button 
                                                    className="btn btn-ghost btn-sm text-error"
                                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-action">
                            <form method="dialog">
                                <button className="btn" onClick={handleCloseScheduleModal}>Close</button>
                            </form>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={handleCloseScheduleModal}>close</button>
                    </form>
                </dialog>
        </div>
    );
}