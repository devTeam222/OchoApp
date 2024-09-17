"use client";

import { loginSchema, LoginValues } from "@/lib/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import LoadingButton from "@/components/LoadingButton";
import { login } from "./actions";

export default function LoginForm() {

    const [error, setError] = useState<string>();

    const [isPending, startTransition] = useTransition();

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        }
    })

    async function onSubmit(values: LoginValues) {
        console.log("Submited");
        
        setError(undefined);
        startTransition(async () => {
            const { error } = await login(values);
            if (error) setError(error)
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
                            <Input placeholder="Votre nom d'utilisateur" {...field} />
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
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                            <PasswordInput placeholder="Votre mot de passe" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <LoadingButton loading={isPending} type="submit" className="w-full">Se connecter</LoadingButton>
        </form>
    </Form>)
};
