"use client";

import { signupSchema, SignupValues } from "@/lib/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import { signUp } from "./actions";
import { PasswordInput } from "@/components/PasswordInput";
import LoadingButton from "@/components/LoadingButton";

export default function SignUpForm() {

    const [error, setError] = useState<string>();

    const [isPending, startTransition] = useTransition()

    const form = useForm<SignupValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            username: "",
            password: "",
        }
    })

    async function onSubmit(values: SignupValues) {
        setError(undefined);
        startTransition(async ()=>{
            const {error} = await signUp(values);
            if(error) setError(error)
        })
    }
    return (<Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {error && <p className="text-center text-destructive">{error}</p>}
            <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nom d&apos;utilisateur</FormLabel>
                        <FormControl>
                            <Input placeholder="Votre nom d'utilisateur" {...field}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Adresse email</FormLabel>
                        <FormControl>
                            <Input placeholder="exemple@xyz.com" type="email" {...field}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                            <PasswordInput placeholder="Créer un mot de passe pour votre securité" {...field}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <LoadingButton loading={isPending} type="submit" className="w-full">Créer un compte</LoadingButton>
        </form>
    </Form>)
};
