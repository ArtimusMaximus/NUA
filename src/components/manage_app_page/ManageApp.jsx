

export default function ManageApp()
{
    return (
        <>
            <div className="flex items-center justify-center mx-auto">
                <div className="flex flex-row w-full gap-4">
                    <h1>New Rule</h1>
                    <div className="flex flex-col">
                        <p>Category</p>
                        <select className="select select-bordered">
                            {/* <option disabled selected></option> */}
                            <option>App</option>
                            <option>App Category</option>
                        </select>
                    </div>
                    <div></div>

                </div>

            </div>
        </>
    )
}