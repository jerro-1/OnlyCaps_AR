import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";
import Main from "../components/Main";
import Card from "../components/Card";

const MFASetup = () => {
    const [qr, setQr] = useState(null);
    const [factorId, setFactorId] = useState(null);
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const enroll = async () => {
        setLoading(true);
        try {
            // FIX: clean up any stray unverified factors from previous
            // incomplete attempts before creating a new one. Without this,
            // repeated visits to this page during testing (or a customer
            // clicking "Enable" twice, or refreshing mid-setup) silently
            // pile up duplicate factors, which is exactly what caused the
            // "code doesn't work" lockout.
            const { data: existing } = await supabase.auth.mfa.listFactors();
            const stale = existing?.totp?.filter(f => f.status === 'unverified') || [];
            for (const factor of stale) {
                await supabase.auth.mfa.unenroll({ factorId: factor.id });
            }

            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: "totp",
            });

            if (error) throw error;

            setQr(data.totp.qr_code);
            setFactorId(data.id);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const verify = async () => {
        try {
            const { data: challengeData, error: challengeError } =
                await supabase.auth.mfa.challenge({ factorId });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challengeData.id,
                code: otp,
            });

            if (verifyError) throw verifyError;

            navigate("/");
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <Main className="flex justify-center items-center min-h-screen">
            <Card className="w-full max-w-md p-6 text-center">
                <h2 className="text-2xl font-bold mb-2">Set up Authenticator</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Secure your account with Google Authenticator
                </p>

                {!qr && (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-gray-600 text-sm">
                            Click below to generate your QR code
                        </p>
                        <button className="btn" onClick={enroll} disabled={loading}>
                            {loading ? "Preparing..." : "Enable MFA"}
                        </button>
                    </div>
                )}

                {qr && (
                    <div className="flex flex-col items-center gap-5">
                        <p className="text-sm text-gray-600">
                            Scan this QR code using Google Authenticator
                        </p>

                        <div className="bg-white p-4 rounded-lg shadow">
                            <div dangerouslySetInnerHTML={{ __html: qr }} />
                        </div>

                        <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            className="w-full px-4 py-2 border rounded-lg text-center text-black focus:outline-none focus:ring-2 focus:ring-black"
                            onChange={(e) => setOtp(e.target.value)}
                        />

                        <button
                            onClick={verify}
                            className="btn btn-primary w-full rounded-lg"
                            style={{ backgroundColor: "#000", color: "#fff", border: "none" }}
                        >
                            Verify & Continue
                        </button>
                    </div>
                )}
            </Card>
        </Main>
    );
};

export default MFASetup;