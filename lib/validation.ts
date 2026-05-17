import { z } from "zod";

export const signInSchema =
    z.object({
        email: z
            .string()
            .email(),

        password: z
            .string()
            .min(6),
    });

export const signUpSchema =
    z
        .object({
            username:
                z.string().min(3),

            email: z
                .string()
                .email(),

            password:
                z.string().min(6),

            confirmPassword:
                z.string(),
        })
        .refine(
            (data) =>
                data.password ===
                data.confirmPassword,
            {
                message:
                    "Passwords do not match",
                path: [
                    "confirmPassword",
                ],
            }
        );