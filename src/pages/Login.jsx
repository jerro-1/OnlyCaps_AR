import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Main from "../components/Main";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import Input from "../components/Input";
import supabase from "../utils/supabase";


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

      console.log(profile.role);
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
    console.log("session:", session);
    console.log("userRole:", userRole);

    if (session && userRole === "admin") {
      console.log("You are an admin"); // ✅ will show when both are ready
    }

    // Redirect if logged in
    if (session) {
      console.log("Redirecting to home"); // ✅ will show when session is set
    }
  }, [session, userRole, Navigate]);


  return (
    <PageWrapper>
      <Header />
      <Main className="flex justify-center">
        <div className="flex items-center">
          {!session ? (
            <Card>
              <h1 className="text-xl font-bold mb-4">Sign In</h1>
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
                className="btn btn-primary rounded-full w-full"
                onClick={handleSubmit}
              >
                Sign In
              </button>
            </Card>
          ) : (
            <div className="text-center">
              <p className="text-lg font-bold mb-4">✓ Logged in successfully!</p>
              <p className="text-gray-600">Role: {userRole || "User"}</p>

            </div>
          )}
        </div>
      </Main>
    </PageWrapper>
  );

};


export default Login;