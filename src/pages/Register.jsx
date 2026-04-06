import { useEffect, useState } from "react";
import Header from "../components/Header";
import Main from "../components/Main";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import Input from "../components/Input";
import supabase from "../utils/supabase";
import { NavLink } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import BgImg from "../components/BgImg";


const Register = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    password: "",
    confirmPassword: "",
  });

  const [session, setSession] = useState(null);

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
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Please verify your email first");
        return;
      }

      // 🔥 SET PASSWORD FOR VERIFIED USER
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (passwordError) throw passwordError;

      // 🔥 INSERT PROFILE
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: user.email,
        });

      if (profileError) throw profileError;

      alert("Registration complete! You can now log in.");


    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <PageWrapper>
      <BgImg>
        <Header />
        <Main className="flex justify-center">
          <div className="flex items-center">
            {!session ? (
              <Card>Please verify your email first.</Card>
            ) : (
              <Card>

                <div className="flex justify-center mb-6">
                  <NavLink to="/">
                    <img
                      src="/images/LOGO.png"
                      alt="ONLYCaps"
                      className="logo-img-large"
                    />
                  </NavLink>
                </div>

                <h1 className="flex items-center text-xl font-bold mb-4">
                  <NavLink to="/register-email">
                    <FaArrowLeft className="mr-2" />
                  </NavLink>
                  Complete Registration
                </h1>

                <Input
                  label="Firstname"
                  name="firstname"
                  type="text"
                  placeholder="Enter your first name"
                  className="w-full text-black"
                  onChange={handleInputChange}
                />

                <Input
                  label="Lastname"
                  name="lastname"
                  type="text"
                  placeholder="Enter your last name"
                  className="w-full text-black"
                  onChange={handleInputChange}
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full text-black"
                  onChange={handleInputChange}
                />

                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="w-full text-black"
                  onChange={handleInputChange}
                />

                <button
                  className="btn btn-primary rounded-full mt-4"
                  onClick={handleSubmit}
                >
                  Finish Registration
                </button>

              </Card>
            )}
          </div>
        </Main>
      </BgImg>
    </PageWrapper>
  );
};

export default Register;