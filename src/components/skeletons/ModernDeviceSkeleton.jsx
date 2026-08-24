export default function ModernDeviceSkeleton({ count = 6 }) {
    const skeletons = Array.from({ length: count }, (_, i) => i);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300">
                        <div className="skeleton h-8 w-12 mb-2"></div>
                        <div className="skeleton h-4 w-20"></div>
                    </div>
                ))}
            </div>

            {/* Search Bar Skeleton */}
            <div className="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="skeleton h-12 flex-1"></div>
                    <div className="flex items-center gap-2">
                        <div className="skeleton h-12 w-32"></div>
                        <div className="skeleton h-12 w-12"></div>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
                    <div className="skeleton h-4 w-32"></div>
                    <div className="flex items-center gap-2">
                        <div className="skeleton h-8 w-20"></div>
                        <div className="skeleton h-8 w-20"></div>
                    </div>
                </div>
            </div>

            {/* Device Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {skeletons.map((_, index) => (
                    <div 
                        key={index} 
                        className="bg-base-100 rounded-xl shadow-lg border border-base-300 overflow-hidden"
                    >
                        {/* Card Header */}
                        <div className="p-6 pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                    {/* Device Icon Skeleton */}
                                    <div className="skeleton w-10 h-10 rounded-lg"></div>
                                    
                                    {/* Device Info Skeleton */}
                                    <div className="flex-1 space-y-2">
                                        <div className="skeleton h-5 w-32"></div>
                                        <div className="skeleton h-4 w-40"></div>
                                    </div>
                                </div>

                                {/* Status Badge Skeleton */}
                                <div className="skeleton h-6 w-20 rounded-full"></div>
                            </div>

                            {/* Quick Actions Row Skeleton */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center space-x-2">
                                    <div className="skeleton w-8 h-4 rounded-full"></div>
                                    <div className="skeleton h-4 w-12"></div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className="skeleton h-6 w-12"></div>
                                    <div className="skeleton h-6 w-6"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}