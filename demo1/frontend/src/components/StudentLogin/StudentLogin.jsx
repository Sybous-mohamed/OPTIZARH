    "use client"

    import * as React from "react"
    import * as z from "zod"
    import { useForm } from "react-hook-form"
    import { zodResolver } from "@hookform/resolvers/zod"
    import { Mail, Lock, EyeOff, ArrowRight } from "lucide-react"

    // Shadcn UI Imports
    import { Button } from "@/components/ui/button"
    import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    } from "@/components/ui/form"
    import { Input } from "@/components/ui/input"
    import { Checkbox } from "@/components/ui/checkbox"

    // 1. Schéma de validation
    const formSchema = z.object({
    email: z.string().email("Email machi valid"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    prenom: z.string().min(2, "Prénom obligatoire"),
    nom: z.string().min(2, "Nom obligatoire"),
    })

    export default function StudentLogin() {
    // 2. Initialisation du form
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
        email: "",
        password: "",
        prenom: "",
        nom: "",
        },
    })

    // 3. Submit Handler
    function onSubmit(data) {
        console.log("Form Submitted:", data)
    }

    return (
        <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-50">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                
                {/* PRÉNOM & NOM */}
                <div className="grid grid-cols-1 gap-5">
                    <FormField
                    control={form.control}
                    name="prenom"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Prénom</FormLabel>
                        <FormControl>
                            <Input className="bg-[#F4F7FF] border-none h-12 px-4" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Nom</FormLabel>
                        <FormControl>
                            <Input className="bg-[#F4F7FF] border-none h-12 px-4" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                {/* ADRESSE EMAIL */}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Adresse Email</FormLabel>
                        <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <FormControl>
                            <Input placeholder="example@gmail.com" className="bg-[#F4F7FF] border-none h-12 pl-10" {...field} />
                        </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                {/* MOT DE PASSE */}
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                        <div className="flex justify-between items-center">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Mot de passe</FormLabel>
                        <a href="#" className="text-[10px] font-semibold text-[#4F46E5] hover:underline">Mot de passe oublié?</a>
                        </div>
                        <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <FormControl>
                            <Input type="password" placeholder="••••••••" className="bg-[#F4F7FF] border-none h-12 pl-10 pr-10" {...field} />
                        </FormControl>
                        <EyeOff className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 cursor-pointer" />
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                {/* CHECKBOX */}
                <div className="flex items-center space-x-2 py-2">
                    <Checkbox id="remember" />
                    <label htmlFor="remember" className="text-sm font-medium text-gray-500">Se souvenir de moi</label>
                </div>

                {/* BUTTON */}
                <Button type="submit" className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                    Se connecter <ArrowRight className="h-4 w-4" />
                </Button>

                </form>
            </Form>
        </div>
    )
    }