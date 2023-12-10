import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";



export default function Login()
{
    const [spinner, setSpinner] = useState('hidden');
    const [loginInfo, setLoginInfo] = useState({});
    const [err, setErr] = useState('hidden');
    const navigate = useNavigate();
    const server = 'http://localhost:4321'

    const handleChange = e => {
        setLoginInfo({
            ...loginInfo,
            [e.target.name] : e.target.value
        });
    }
    const handleErr = () => {
        setErr('flex')
        setTimeout(() => {
            setErr('hidden')
        }, 5000)
    }

    useEffect(() => {

    }, [])

    const handleLogin = async () => {
        setSpinner("loading loading-spinner");

        const response = await fetch(`${server}/login`, {
            method: 'POST',
            mode: 'cors',
            credentials: "same-origin",
            headers: {
                "Content-Type" : "application/json",

            },
            body: JSON.stringify(loginInfo)
        });

        try {
            if (response.ok) {
                console.log('navigating you...');
                navigate('/dashboard')
            } else {
                handleErr();
                setSpinner("");
            }

        } catch(err) {
            // setErr('flex')
            handleErr();
            setSpinner("");
            console.error(err.code)
        }

    }

    return (
        <>
            <div className="flex flex-col my-auto justify-evenly w-fit">
                <label htmlFor="username">Username: </label>
                <input type="text" name="username" className="input" onChange={handleChange} />
                <label htmlFor="username">Password: </label>
                <input type="text" name="password" className="input" onChange={handleChange} />
                <button className="btn btn-large my-4"  onClick={handleLogin}>Log In <span className={`${spinner}`}></span></button>

                <div className={`${err} items-center justify-center my-6">`}>
                    <div role="alert" className="alert alert-warning">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span>Warning: Invalid login credentials!</span>
                    </div>
                </div>
            </div>
        </>
    )
}