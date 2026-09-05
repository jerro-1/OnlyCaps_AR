import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
                <Main className="flex justify-center">
                    <Card>

                        <h1 className="text-xl font-bold mb-4">
                            Enter Verification Code
                        </h1>

                        <input
                            type="text"
                            placeholder="Enter OTP"
                            className="input input-bordered w-full text-black"
                            onChange={(e) => setToken(e.target.value)}
                        />

                        <button
                            className="btn btn-primary rounded-full mt-4 w-full"
                            onClick={handleVerify}
                            disabled={verifying}
                        >
                            {verifying ? "Verifying..." : "Verify Code"}
                        </button>

                    </Card>
                </Main>
            </BgImg>
        </PageWrapper>
    );
};

export default VerifyEmail;
