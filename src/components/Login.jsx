import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';

/**
 * Login screen shown when optional authentication is enabled
 * (NUA_AUTH_ENABLED=true). Submits credentials to /login; the server sets an
 * HttpOnly session cookie which is automatically sent on subsequent fetches.
 */
export default function Login({ onLogin })
{
    const [spinner, setSpinner] = useState('');
    const [loginInfo, setLoginInfo] = useState({});
    const [err, setErr] = useState('hidden');
    const navigate = useNavigate();

    const handleChange = e => {
        setLoginInfo({
            ...loginInfo,
            [e.target.name] : e.target.value
        });
    }
    const handleErr = () => {
        setErr('flex');
        setTimeout(() => {
            setErr('hidden')
        }, 5000)
    }

    const handleLogin = async () => {
        setSpinner("loading loading-spinner");

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    "Content-Type" : "application/json",
                },
                body: JSON.stringify(loginInfo)
            });

            if (response.ok) {
                onLogin?.();
                navigate('/');
            } else {
                handleErr();
                setSpinner("");
            }
        } catch (err) {
            handleErr();
            setSpinner("");
            console.error(err)
        }
    }

    return (
        <>
            <div className="flex flex-col my-auto justify-center w-fit h-screen">
                <label htmlFor="username">Username: </label>
                <input type="text" name="username" className="input" onChange={handleChange} />
                <label htmlFor="password">Password: </label>
                <input type="password" name="password" className="input" onChange={handleChange} />
                <button className="btn btn-large my-4" onClick={handleLogin}>Log In <span className={`${spinner}`}></span></button>
                <div className={`${err} items-center justify-center my-6`}>
                    <div role="alert" className="alert alert-warning">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span>Warning: Invalid login credentials!</span>
                    </div>
                </div>
            </div>
        </>
    )
}

Login.propTypes = {
  onLogin: PropTypes.func,
};
