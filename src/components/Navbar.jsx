import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoGear } from "react-icons/go";
import { useEffect, useState } from "react";



export default function Navbar({ title })
{
  const navigate = useNavigate();
  const location = useLocation();


  const handleNav = () => {
    navigate('/sitesettings')
  }



  return (
    <>
        <div className="navbar bg-base-100 grid grid-flow-row grid-cols-3">
          <div><Link className="btn btn-ghost text-xl" to="/">Node Unifi API</Link></div>
          <span className="mx-auto text-3xl font-bold flex justify-center">{title.title}</span>
          <div className="flex justify-end">
            <GoGear
                className="w-6 h-6 ml-4 mr-4 hover:cursor-pointer"
                onClick={handleNav}
                />
            </div>
        </div>
    </>
  )
}