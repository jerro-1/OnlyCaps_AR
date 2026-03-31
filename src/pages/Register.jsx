import { useEffect } from "react";
import Header from "../components/Header";
import Main from "../components/Main";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import Input from "../components/Input";
import { useState } from "react";
import supabase from "../utils/supabase";
import { NavLink } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import BgImg from "../components/BgImg";

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (event) => {
    const inputName = event.target.name;
    const inputValue = event.target.value;
    setFormData({ ...formData, [inputName]: inputValue });
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signupError) throw signupError;
      console.log(signupData);

      if (signupData && signupData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: signupData.user.id,
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email,
          })
          .select();

        if (profileError) throw profileError;

        if (profileData) {
          console.log("profile data", profileData);
          alert("Registration successful! You can now sign in.");
        }
      } else {
        // This shouldn't happen with email confirmation disabled
        alert("Registration failed. Please try again.");
      }
    } catch (error) {
      alert(error.message || error);
    }
  };

  const [session, setSession] = useState(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    // call unsubscribe to remove the callback
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <PageWrapper>
      <BgImg>
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
                  <NavLink to="/login" title="Login">
                    <FaArrowLeft className="mr-2" />
                  </NavLink>
                  Sign up</h1>
                <Input
                  label="Firstname"
                  name="firstname"
                  type="text"
                  placeholder="Enter your name"
                  className="w-full text-black"
                  onChange={handleInputChange}
                />

                <Input
                  label="Lastname"
                  name="lastname"
                  type="text"
                  placeholder="Enter your lastname"
                  className="w-full text-black"
                  onChange={handleInputChange}
                />
                <Input
                  label="Email"
                  name="email"
                  type="text"
                  placeholder="Enter your Email"
                  className="w-full text-black"
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
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your Password"
                  className="w-full mb-5 text-black"
                  onChange={handleInputChange}
                />

                <button
                  className="btn btn-primary rounded-full"
                  onClick={handleSubmit}
                >
                  Signup
                </button>
              </Card>
            ) : (
              <Card>You are already signed in</Card>
            )}
          </div>
        </Main>
      </BgImg>
    </PageWrapper>
  );
};

export default Register;
