import Login from "./components/Login"
import { BrowserRouter, Outlet } from "react-router-dom"



export default function App() {


  return (
    <>
      <div className="bg-neutral w-full h-full flex items-center justify-center flex-col">
        <Outlet />
      </div>
    </>
  )
}


