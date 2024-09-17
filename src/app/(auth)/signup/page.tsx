import { Metadata } from "next";
import signupImage from "@/assets/signup-image.jpg";
import Image from "next/image";
import Link from "next/link";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Inscription",
};

export default function Page() {
  return (
    <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] overflow-hidden rounded-2xl bg-card shadow-2xl">
      <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold">Inscription</h1>
          <p className="text-muted-foreground">
            Un endroit où même <span className="italic">vous</span> pouvez
            trouver un ami.
          </p>
        </div>
        <div className="space-y-5">
          <SignUpForm />
          <Link href="/login" className="block text-center hover:underline">
            J&apos;ai déjà un compte ? Se connecter
          </Link>
        </div>
      </div>
      <Image
        src={signupImage}
        alt="signup-image"
        className="hidden w-1/2 object-cover md:block"
      />
    </div>
  );
}
