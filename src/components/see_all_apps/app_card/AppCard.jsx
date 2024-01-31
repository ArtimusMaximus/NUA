import { Link } from "react-router-dom"



export default function AppCard({ props })
{
    return (
        <>
            <div className="card w-80 min-h-[204px] bg-base-100 shadow-xl hover:bg-base-200">
                <div className="card-body">
                    <h2 className="card-title">{props?.name}</h2>
                    <p>
                    More Info on&nbsp;
                        <a className="underline text-info italic" href={`https://www.google.com/search?q=${props?.name}`} target="_blank" rel="noreferrer">{props?.name}</a>
                    ...
                    </p>
                    <div className="card-actions justify-end">
                        <Link to={`/trafficrules/${props.id}`}><button className="btn btn-primary">Manage this App.</button></Link>
                    </div>
                </div>
            </div>
        </>
    )
}