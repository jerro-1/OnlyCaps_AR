import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Main from "../components/Main";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import Input from "../components/Input";
import supabase from "../utils/supabase";
import { NavLink } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import BgImg from "../components/BgImg";


const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(""); // store user role
  const Navigate = useNavigate();

  // handle input change
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  // handle sign in
  const handleSubmit = async () => {
    try {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (signInError) throw signInError;

      // fetch role after login
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", signInData.user.id)
        .single();


      if (profileError) throw profileError;

      setUserRole(profile.role);
      setSession(signInData.session);

    } catch (error) {
      alert(error.message);
    }
  };

  // listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

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
      }
    );

    // cleanup subscription
    return () => subscription.unsubscribe();
  }, []);


  useEffect(() => {

    if (session && userRole === "admin") {
      console.log("You are an admin"); // ✅ will show when both are ready
    }

    // Redirect if logged in
    if (session) {
      console.log("Redirecting to home"); // ✅ will show when session is set
      Navigate("/");
    }
  }, [session, userRole, Navigate]);


  return (

    <BgImg>
      <Header />
      <Main className="flex justify-center">
        <div className="flex items-center">
          {!session ? (
            <Card>
              <div className="flex justify-center mb-6">
                <NavLink to="/">
                  <img src="/images/LOGO.png" alt="ONLYCaps" className="logo-img-large"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                  <span className="font-heading text-2xl tracking-wider hidden">ONLYCAPS</span>
                </NavLink>
              </div>
              <h1 className="flex items-center text-xl font-bold mb-4">
                <NavLink to="/" title="Home">
                  <FaArrowLeft className="mr-2" />
                </NavLink>
                Sign In
              </h1>
              <Input
                label="Email"
                name="email"
                type="text"
                placeholder="Enter your Email"
                className="w-full mb-3 text-black"
                onChange={handleInputChange}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your Password"
                className="w-full mb-5 text-black"
                onChange={handleInputChange}
              />
              <button
                className="btn btn-primary w-full" style={{ backgroundColor: '#000000', border: 'none', boxShadow: 'none', color: 'white' }}
                onClick={handleSubmit}
              >
                Sign In
              </button>
              <p className="mt-4 text-center">
                don't have an account? <Link to="/Register-Email" className="text-blue-500 hover:underline">sign up</Link>
              </p>
            </Card>
          ) : (
            <div className="text-center">
              <p className="text-lg font-bold mb-4">✓ Logged in successfully!</p>
              <p className="text-gray-600">Role: {userRole || "User"}</p>

            </div>
          )}
        </div>
      </Main>
    </BgImg>

  );

};


export default Login;