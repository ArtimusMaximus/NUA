

export default function NotFound()
{
    return (
        <>
            <div className="flex justify-center h-screen">
                <div className="flex flex-col">
                    <div className="p-4">
                        <h1 className="text-8xl font-bold text-error underline">404</h1>
                    </div>
                    <div className="p-4">
                        <h1 className="text-4xl italic font-bold">Page not found!</h1>
                    </div>
                    <div className="p-4">
                        <h1 className="text-4xl italic font-bold">Please press back in your browser...</h1>
                    </div>
                </div>
            </div>
        </>
    );
}