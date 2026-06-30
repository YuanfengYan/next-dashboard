"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
      invalid_type_error: "Customer ID must be a string",
    }),
    amount: z.coerce.number().gt(0, { message: "Amount must be greater than 0" }),
    status: z.enum(["pending", "paid"],{
      invalid_type_error: "Status must be either 'pending' or 'paid'",
    }),
    date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true }); //创建发票时不需要id和date字段，因为它们会由数据库自动生成和设置。我们使用zod的omit方法来创建一个新的模式，排除掉id和date字段，这样在创建发票时就只需要提供customerId、amount和status字段了。
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(
  _previousState: State,
  formData: FormData,
): Promise<State> {
  const validatedFields = CreateInvoice.safeParse({
    // ...Object.fromEntries(formData.entries()),
     customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'), 
  });

  if (!validatedFields.success) {
    console.log('validatedFields.error.flatten().fieldErrors', validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to create invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    console.error(error);
    return { message: 'Database error: Failed to create invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        ...Object.fromEntries(formData.entries()),
    });
    const amountInCents = amount * 100;
    await sql
    `UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath("/dashboard/invoices");
    // redirect("/dashboard/invoices");
}


export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}