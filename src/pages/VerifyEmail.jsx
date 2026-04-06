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
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;

    const handleVerify = async () => {
        if (!token) {
            alert("Please enter the code");
            return;
        }

        try {
            const { error } = await supabase.auth.verifyOtp({
                email: email,
                token: token,
                type: "email"
            });

            if (error) throw error;

            alert("Email verified!");

            // 👉 go to register page
            navigate("/register");

        } catch (error) {
            alert(error.message);
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
                        >
                            Verify Code
                        </button>

                    </Card>
                </Main>
            </BgImg>
        </PageWrapper>
    );
};

export default VerifyEmail;