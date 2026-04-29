"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const createPollSchema = z.object({
    question: z.string().min(3, "Question must be at least 3 characters"),
    options: z.array(
        z.object({
            text: z.string().min(1, "Option cannot be empty"),
        })
    ).min(2, "At least 2 options are required"),
});

type CreatePollFormValues = z.infer<typeof createPollSchema>;

interface CreatePollModalProps {
    onSubmit: (data: { question: string; options: string[] }) => Promise<void>;
    onCancel: () => void;
}

export function CreatePollModal({ onSubmit, onCancel }: CreatePollModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<CreatePollFormValues>({
        resolver: zodResolver(createPollSchema),
        defaultValues: {
            question: "",
            options: [{ text: "" }, { text: "" }], // Start with 2 empty options
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options",
    });

    const handleSubmit = async (data: CreatePollFormValues) => {
        setIsLoading(true);
        try {
            await onSubmit({
                question: data.question,
                options: data.options.map((opt) => opt.text),
            });
            form.reset();
        } catch (error) {
            console.error("Error creating poll:", error);
            toast({
                title: "Error",
                description: "Failed to create poll",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="question"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Question</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ask something..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-2">
                        <FormLabel>Options</FormLabel>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <FormField
                                    control={form.control}
                                    name={`options.${index}.text`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input placeholder={`Option ${index + 1}`} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {fields.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        className="text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ text: "" })}
                            className="w-full mt-2"
                        >
                            <Plus size={16} className="mr-2" /> Add Option
                        </Button>
                        {form.formState.errors.options && (
                            <p className="text-sm font-medium text-destructive">
                                {form.formState.errors.options.message || form.formState.errors.options.root?.message}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Poll
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
