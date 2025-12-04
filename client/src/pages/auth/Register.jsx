import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerFormSchema,
  registerDefaultValues,
} from "@/lib/validations/register";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

import { useAuth } from "@/context/AuthContext";
import malinLogo from "@/pages/images/MalinLogo.jpg";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const form = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: registerDefaultValues,
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    try {
      const response = await register(values.username, values.email, values.password);
      if (response?.error) {
        form.setError("password", { type: "server", message: response.error });
        return;
      }
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      form.setError("password", {
        type: "server",
        message: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <Link
          to="/"
          aria-label="Home"
          className="inline-block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <img
            src={malinLogo}
            alt="Malin Group"
            className="mx-auto h-12 w-auto md:h-14 cursor-pointer hover:opacity-90 transition-opacity"
          />
        </Link>
      </div>

      <Card className="w-full max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">
          Create your account
        </h1>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="username">Username</FormLabel>
                  <FormControl>
                    <Input
                      id="username"
                      type="text"
                      autoComplete="username"
                      placeholder="yourname"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create account"}
            </Button>
          </form>
        </Form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="underline hover:text-foreground"
          >
            Login
          </button>
        </p>
      </Card>
    </div>
  );
};

export default Register;
