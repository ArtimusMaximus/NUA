export default function GenericPageSkeleton({ rows = 4 }) {
    return (
        <div className="flex flex-col w-full sm:w-3/4 lg:w-1/2 mx-auto px-4 py-8 gap-6">
            {/* Header */}
            <div className="skeleton h-8 w-48 rounded-lg" />

            {/* Card rows */}
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="skeleton h-6 w-40 rounded" />
                        <div className="skeleton h-6 w-12 rounded-full" />
                    </div>
                    <div className="skeleton h-4 w-64 rounded" />
                    <div className="flex gap-2 mt-1">
                        <div className="skeleton h-4 w-16 rounded-full" />
                        <div className="skeleton h-4 w-16 rounded-full" />
                    </div>
                </div>
            ))}

            {/* Action buttons row */}
            <div className="flex gap-4 mt-2">
                <div className="skeleton h-10 w-36 rounded-lg" />
                <div className="skeleton h-10 w-36 rounded-lg" />
            </div>
        </div>
    );
}
