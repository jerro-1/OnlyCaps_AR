import { useState } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import Header from "../components/Header";
import supabase from "../utils/supabase";
import Card from "../components/Card";
import Main from "../components/Main";
import PageWrapper from "../components/PageWrapper";
import BgImg from "../components/BgImg";

const VerifyEmail = () => {
    const [token, setToken] = useState("");
    const [verifying, setVerifying] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const { firstname, lastname, email, password } = location.state || {};

    const handleVerify = async () => {
        if (!token) {
            alert("Please enter the code");
            return;
        }

        if (!email || !password) {
            alert("Missing registration details -- please start over.");
            navigate("/register-email");
            return;
        }

        setVerifying(true);
        try {
            const { data: { user }, error: verifyError } = await supabase.auth.verifyOtp({
                email: email,
                token: token,
                type: "email"
            });

            if (verifyError) throw verifyError;

            const { error: passwordError } = await supabase.auth.updateUser({
                password: password
            });

            if (passwordError) throw passwordError;

            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: user.id,
                    firstname,
                    lastname,
                    email: user.email,
                    role: "customer",
                });

            if (profileError) throw profileError;

            alert("Account created! Welcome to OnlyCaps.");
            navigate("/");

        } catch (error) {
            alert(error.message);
        } finally {
            setVerifying(false);
        }
    };

    return (
        <PageWrapper>
            <BgImg>
                <Header />
                <Main className="flex justify-center items-center min-h-screen px-4">
                    <Card>
                        <div className="flex justify-center mb-6">
                            <NavLink to="/">
                                <img
                                    src="/images/LOGO.png"
                                    alt="ONLYCaps"
                                    className="h-9"
                                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                />
                                <span className="font-heading text-xl tracking-wider hidden text-[#14110D]">ONLYCAPS</span>
                            </NavLink>
                        </div>

                        <h1 className="font-heading text-2xl uppercase tracking-wide text-[#14110D] mb-1 text-center">
                            Enter verification code
                        </h1>
                        <p className="font-body text-sm text-[#6B6558] text-center mb-8">
                            We sent a code to {email || "your email"}
                        </p>

                        <div className="mb-5">
                            <label className="block font-body text-xs text-[#6B6558] mb-2">Verification code</label>
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                className="w-full bg-transparent border-0 border-b border-[#D8D2C4] py-2 font-body text-[#14110D] text-sm placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#5EC4D6] transition-colors"
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </div>

                        <button
                            className="w-full bg-[#14110D] text-[#FAF8F4] font-body text-sm font-medium py-3 rounded-full mt-2 hover:bg-[#2A241C] transition-colors disabled:opacity-50"
                            onClick={handleVerify}
                            disabled={verifying}
                        >
                            {verifying ? "Verifying..." : "Verify code"}
                        </button>
                    </Card>
                </Main>
            </BgImg>
        </PageWrapper>
    );
};

export default VerifyEmail;
