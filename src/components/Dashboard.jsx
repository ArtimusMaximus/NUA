import { handleCommand1, handleCommand2 } from "../bashserverqueries"

export default function Dashboard()
{






    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mx-auto grid-flow-row grid-rows-4 gap-6">
            <h1 className="text-center mt-6 text-4xl font-bold italic row-start-1 col-span-full flex items-center justify-center">Dashboard</h1>
                <div className="flex flex-col items-center mx-auto p-4 m-6 border border-primary btn btn-circle h-44 w-44" onClick={handleCommand1}>
                    <h2>Task 1</h2>
                    <p>bash command:</p>
                    <p className="italic">ls</p>
                </div>
                <div className="flex flex-col items-center mx-auto p-4 m-6 border border-primary btn btn-circle h-44 w-44" onClick={handleCommand2}>
                    <h2>Task 2</h2>
                    <p>Unifi Command:</p>
                    <p className="italic">Get sites</p>
                </div>
                <div className="flex flex-col items-center mx-auto p-4 m-6 border border-primary btn btn-circle h-44 w-44">
                    <h2>Task 3</h2>
                    <p className="italic">bash command ls</p>
                </div>
                <div className="flex flex-col items-center mx-auto p-4 m-6 border border-primary btn btn-circle h-44 w-44">
                    <h2>Task 4</h2>
                    <p className="italic">bash command ls</p>
                </div>
            </div>
        </>
    )
}