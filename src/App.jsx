import Login from "./components/Login"
import { BrowserRouter, Outlet } from "react-router-dom"



export default function App() {


  return (
    <>
      <div className="bg-neutral w-full h-screen">
        <Outlet />
      </div>
    </>
  )
}


