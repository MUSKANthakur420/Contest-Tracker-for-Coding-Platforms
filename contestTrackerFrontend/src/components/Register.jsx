import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { registerUser } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

function Register() {
    const [username, setname] = useState("");
    const [phone, setphone] = useState("");
    const [email, setemail] = useState("");
    const [password, setpassword] = useState("");
    const [leetcode, setleetcode] = useState("");
    const [codeforces, setcodeforces] = useState("");
    const [atcoder, setatcoder] = useState("");
    const [hackerrank, sethackerrank] = useState("");
    const [naukri, setnaukri] = useState("");
    const [gfg, setgfg] = useState("");
    const [img, setimg] = useState(null);
    
    // UI state to track if OTP has been requested
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // 1. Function to handle sending OTP

    // 2. Function to handle final Form Submission (Registration + Verification)
    const handleRegister = async (e) => {
        e.preventDefault();
        
        try {
            // Send everything to the registration action. 
            // Your backend controller should verify the OTP during this registration request.
            await dispatch(registerUser({
                username,
                phone,
                email,
                password,
                leetcode,
                codeforces,
                atcoder,
                gfg,
                hackerrank,
                naukri,
                img
            })).unwrap();
            
            navigate("/DashBoard");
        } catch (err) {
            console.error("Registration failed:", err.message);
        }
    };

    return (
        <main className="max-w-md mx-auto px-6 py-14 font-sans text-[#e6e8ef]">
            <div className="bg-[#131720] border border-[#232838] rounded-2xl px-8 py-9">
                <span className="inline-block font-mono text-xs tracking-widest uppercase text-[#4f8cff] mb-2">
                    create account
                </span>
                <h1 className="text-2xl font-bold text-[#f2f4f8] mb-6">Join ContTrack</h1>

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    <input
                        type='text'
                        placeholder='Enter your name'
                        onChange={(e) => setname(e.target.value)}
                        value={username}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                    
                    {/* Phone Number Input + Send OTP Button Row */}
                    <div className="flex gap-2">
                        <input
                            type='text'
                            placeholder='Enter your phone number'
                            onChange={(e) => setphone(e.target.value)}
                            value={phone}
                            className="flex-1 bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                        />
                    </div>
                    <input
                        type='email'
                        placeholder='Enter your email'
                        onChange={(e) => setemail(e.target.value)}
                        value={email}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                    <input 
                        type='file'
                        accept='image/*'
                        onChange={(e) => setimg(e.target.files[0])}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                    <input
                        type='text'
                        placeholder='Enter your leetcode username'
                        onChange={(e) => setleetcode(e.target.value)}
                        value={leetcode}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                    <input
                        type='text'
                        placeholder='Enter your codeforces username'
                        onChange={(e) => setcodeforces(e.target.value)}
                        value={codeforces}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                    <input
                        type='text'
                        placeholder='Enter your atcoder username'
                        onChange={(e) => setatcoder(e.target.value)}
                        value={atcoder}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                    <input 
                        type='text'
                        placeholder='Enter your gfg username'
                        onChange={(e) => setgfg(e.target.value)}
                        value={gfg}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                         <input
                        type='text'
                        placeholder='Enter your Hacker Rank username'
                        onChange={(e) => sethackerrank(e.target.value)}
                        value={hackerrank}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                         <input
                        type='text'
                        placeholder='Enter your codestudio (naukri.com) username'
                        onChange={(e) => setnaukri(e.target.value)}
                        value={naukri}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                    <input
                        type='password'
                        placeholder='Enter your password'
                        onChange={(e) => setpassword(e.target.value)}
                        value={password}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                   <button
    type="submit"
    className="mt-2 text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
>
    Register Account
</button>
                </form>
            </div>
        </main>
    );
}

export default Register;
