import { Link } from "react-router-dom"



export default function AppCard({ props, cat })
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
                    <p>Category: {cat}</p>
                    <p>Category: {props?.cat}</p>
                    <div className="card-actions justify-end">
                        {/* <Link to={`/manageapp/${cat}/${props.id}`}><button className="btn btn-primary btn-circle text-2xl font-bold">+</button></Link> */}
                        <input type="checkbox" className="checkbox checkbox-primary" />
                    </div>
                </div>
            </div>
        </>
    )
}