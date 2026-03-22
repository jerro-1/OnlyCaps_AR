import { useEffect } from "react";
import Header from "../components/Header";
import Main from "../components/Main";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import Input from "../components/Input";
import { useState } from "react";
import supabase from "../utils/supabase";

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });

  const handleInputChange = (event) => {
    const inputName = event.target.name;
    const inputValue = event.target.value;
    setFormData({ ...formData, [inputName]: inputValue });
  };

  const handleSubmit = async () => {
    try {
      const { data: signupData, signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signupError) throw signupError;
      console.log(signupData);

      if (signupData) {
        const { data: profileData, profileError } = await supabase
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
        }
      }
    } catch (error) {
      alert(error);
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

      <Main className="flex justify-center">
        <div className="flex items-center">
          {!session ? (
            <Card>
              <h1 className="text-xl font-bold text-black">Sign Up</h1>
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

    </PageWrapper>
  );
};

export default Register;
