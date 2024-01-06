import { Link } from 'react-router-dom';
import { IoReturnUpBackSharp } from "react-icons/io5";

export default function ReturnToPage({ title, link })
{
    return (
        <>
            <div className="m-8 flex flex-row items-center justify-center gap-6">
                <p className="font-semibold italic text-xl">{title}</p>
                <span>
                    <Link to={`${link}`}><IoReturnUpBackSharp className="w-24 h-24 text-slate-500 hover:text-info hover:cursor-pointer" /></Link>
                </span>
            </div>
        </>
    )
}