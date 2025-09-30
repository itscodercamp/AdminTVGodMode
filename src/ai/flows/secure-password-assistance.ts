// src/ai/flows/secure-password-assistance.ts
'use server';

/**
 * @fileOverview AI-driven suggestions for strong password creation and reset.
 *
 * - generateStrongPassword - A function that generates a strong password suggestion.
 * - GenerateStrongPasswordInput - The input type for the generateStrongPassword function.
 * - GenerateStrongPasswordOutput - The return type for the generateStrongPassword function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStrongPasswordInputSchema = z.object({
  length: z.number().min(8).default(12).describe('The desired length of the password.'),
  useNumbers: z.boolean().default(true).describe('Whether to include numbers in the password.'),
  useSymbols: z.boolean().default(true).describe('Whether to include symbols in the password.'),
});
export type GenerateStrongPasswordInput = z.infer<typeof GenerateStrongPasswordInputSchema>;

const GenerateStrongPasswordOutputSchema = z.object({
  password: z.string().describe('A strong, randomly generated password.'),
});
export type GenerateStrongPasswordOutput = z.infer<typeof GenerateStrongPasswordOutputSchema>;

export async function generateStrongPassword(input: GenerateStrongPasswordInput): Promise<GenerateStrongPasswordOutput> {
  return generateStrongPasswordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStrongPasswordPrompt',
  input: {schema: GenerateStrongPasswordInputSchema},
  output: {schema: GenerateStrongPasswordOutputSchema},
  prompt: `You are a security expert. Generate a strong password based on the following criteria:\n\nLength: {{{length}}}\nInclude numbers: {{#if useNumbers}}Yes{{else}}No{{/if}}\nInclude symbols: {{#if useSymbols}}Yes{{else}}No{{/if}}\n\nThe password should be random and difficult to guess.  It must conform to these requirements, and be suitable for use in a production system.\n\nEnsure that the generated password meets the specified criteria and is cryptographically secure, suitable for account creation or password reset processes.\n\nOutput the password in the following JSON format: { \