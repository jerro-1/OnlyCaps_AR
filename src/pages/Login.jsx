import { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Main from "../components/Main";
import supabase from "../utils/supabase";
import { NavLink } from "react-router-dom";
import BgImg from "../components/BgImg";
import Footer from "../components/Footer";
import { SessionContext } from "../context/SessionContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const session = useContext(SessionContext);
  const [userRole, setUserRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const Navigate = useNavigate();

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (signInError) throw signInError;

      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) throw factorsError;

      // FIX: only ever pick a factor that's actually verified. Picking
      // totp[0] blindly could grab a stray unverified/duplicate factor
      // from an earlier enrollment attempt, which has no matching code
      // in the person's authenticator app -- permanently locking them out.
      const verifiedFactor = factorsData.totp?.find(f => f.status === 'verified');

      if (verifiedFactor) {
        Navigate("/mfa-verify", {
          state: { factorId: verifiedFactor.id },
        });
        return;
      }

      Navigate("/mfa-setup");

    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (session) {
      supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) setUserRole(data.role);
        });
    } else {
      setUserRole("");
    }
  }, [session]);

  return (
    <>
      <BgImg>
        <Header />
        <Main className="flex justify-center items-center min-h-screen px-4">
          {!session ? (
            <div className="w-full max-w-sm bg-[#FAF8F4] rounded-2xl p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
              <div className="flex justify-center mb-8">
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
                Sign in
              </h1>
              <p className="font-body text-sm text-[#6B6558] text-center mb-8">
                Welcome back to OnlyCaps
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-body text-xs text-[#6B6558] mb-2">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@email.com"
                    className="w-full bg-transparent border-0 border-b border-[#D8D2C4] py-2 font-body text-[#14110D] text-sm placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block font-body text-xs text-[#6B6558] mb-2">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-transparent border-0 border-b border-[#D8D2C4] py-2 font-body text-[#14110D] text-sm placeholder:text-[#B8B2A3] focus:outline-none focus:border-[#A9824C] transition-colors"
                    onChange={handleInputChange}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#14110D] text-[#FAF8F4] font-body text-sm font-medium py-3 rounded-full mt-2 hover:bg-[#2A241C] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <p className="mt-7 text-center font-body text-sm text-[#6B6558]">
                Don't have an account?{" "}
                <Link to="/Register-Email" className="text-[#A9824C] font-medium hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          ) : (
            <div className="bg-[#FAF8F4] rounded-2xl px-10 py-9 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
              <p className="font-heading text-lg uppercase tracking-wide text-[#14110D] mb-1">Signed in</p>
              <p className="font-body text-sm text-[#6B6558] capitalize">{userRole || "customer"} account</p>
            </div>
          )}
        </Main>
      </BgImg>
      <Footer />
    </>
  );
};

export default Login;