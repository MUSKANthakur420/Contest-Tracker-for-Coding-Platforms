import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateUser } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../features/auth/authSlice";
function Edit() {
    const dispatch = useDispatch();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [leetcode, setLeetcode] = useState("");
    const [codeforces, setCodeforces] = useState("");
    const [codechef, setCodechef] = useState("");
    const [atcoder, setAtcoder] = useState("");
    const [gfg, setGfg] = useState("");
    const[hackerrank, setHackerrank] = useState("");
    const[naukri, setNaukri] = useState("");
    const [password, setPassword] = useState("");
    const [img, setImg] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(
                    "http://localhost:8000/api/v1/users/me",
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        },
                        credentials: "include",
                    }
                );

                const data = await res.json();
                const user = data.user || data.data?.user || data.data;

                setName(user.username);
                setEmail(user.email);

                setLeetcode(user.codingProfiles?.leetcode || "");
                setCodeforces(user.codingProfiles?.codeforces || "");
                setCodechef(user.codingProfiles?.codechef || "");
                setAtcoder(user.codingProfiles?.atcoder || "");
                setGfg(user.codingProfiles?.gfg || "");
                setHackerrank(user.codingProfiles?.hackerrank || "");
                setNaukri(user.codingProfiles?.naukri || "");

                if (user.image) setPreviewUrl(user.image);
            } catch (err) {
                console.log(err);
                setError("Couldn't load your profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    // Swap the preview to the newly picked file, and clean up the object URL
    // when it's replaced/unmounted so we don't leak memory.
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImg(file);
        setPreviewUrl((old) => {
            if (old && old.startsWith("blob:")) URL.revokeObjectURL(old);
            return URL.createObjectURL(file);
        });
    };

    const handler = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const result = await dispatch(
            updateUser({
                username: name,
                email,
                password,
                leetcode,
                codeforces,
                codechef,
                atcoder,
                gfg,
                hackerrank,
                naukri,
                img,
            })
        );

        setSaving(false);

        if (updateUser.fulfilled.match(result)) {
            alert("Profile Updated Successfully");
            await dispatch(logoutUser);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            navigate("/login");
        } else {
            setError(result.payload || "Something went wrong");
        }
    };

    if (loading) {
        return (
            <main className="max-w-md mx-auto px-6 py-16 text-center font-sans text-[#8a90a6]">
                loading your profile…
            </main>
        );
    }

    return (
        <main className="max-w-md mx-auto px-6 py-14 font-sans text-[#e6e8ef]">
            <div className="bg-[#131720] border border-[#232838] rounded-2xl px-8 py-9">
                <span className="inline-block font-mono text-xs tracking-widest uppercase text-[#4f8cff] mb-2">
                    edit profile
                </span>
                <h1 className="text-2xl font-bold text-[#f2f4f8] mb-6">Update your details</h1>

                {error && (
                    <p className="text-sm text-[#ff5c5c] mb-4">{error}</p>
                )}

                <form onSubmit={handler} className="flex flex-col gap-4">
                    {/* Avatar preview + picker */}
                    <div className="flex items-center gap-4 mb-1">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-[#0b0e14] border border-[#232838] flex-shrink-0">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Profile preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#545b70] text-xs">
                                    no image
                                </div>
                            )}
                        </div>
                        <label className="flex-1">
                            <span className="block text-xs text-[#8a90a6] mb-1.5">
                                Profile picture
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full text-xs text-[#8a90a6] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0b0e14] file:text-[#e6e8ef] file:border file:border-[#232838] hover:file:border-[#4f8cff] file:cursor-pointer cursor-pointer"
                            />
                        </label>
                    </div>

                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />

                    <input
                        type="text"
                        placeholder="Enter your LeetCode username"
                        value={leetcode}
                        onChange={(e) => setLeetcode(e.target.value)}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />

                    <input
                        type="text"
                        placeholder="Enter your Codeforces username"
                        value={codeforces}
                        onChange={(e) => setCodeforces(e.target.value)}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />

                    <input
                        type="text"
                        placeholder="Enter your CodeChef username"
                        value={codechef}
                        onChange={(e) => setCodechef(e.target.value)}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />

                    <input
                        type="text"
                        placeholder="Enter your AtCoder username"
                        value={atcoder}
                        onChange={(e) => setAtcoder(e.target.value)}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />

                    <input
                        type="text"
                        placeholder="Enter your GFG username"
                        value={gfg}
                        onChange={(e) => setGfg(e.target.value)}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />
                     <input
                        type="text"
                        placeholder="Enter your Hacker Rank username"
                        value={hackerrank}
                        onChange={(e) => setHackerrank(e.target.value)}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />

<input
                        type="text"
                        placeholder="Enter your CodeStudio (naukri.com) username"
                        value={naukri}
                        onChange={(e) => setNaukri(e.target.value)}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />

                    <input
                        type="password"
                        placeholder="Enter new password (optional)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-[#0b0e14] border border-[#232838] rounded-lg px-3.5 py-2.5 text-sm text-[#e6e8ef] placeholder:text-[#545b70] outline-none focus:border-[#4f8cff] transition-colors"
                    />

                    <button
                        type="submit"
                        disabled={saving}
                        className="mt-2 text-sm font-semibold text-[#0b0e14] bg-[#4f8cff] px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </form>
            </div>
        </main>
    );
}

export default Edit;