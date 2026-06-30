"use server";
import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(["pending", "paid"]),
    date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true }); //创建发票时不需要id和date字段，因为它们会由数据库自动生成和设置。我们使用zod的omit方法来创建一个新的模式，排除掉id和date字段，这样在创建发票时就只需要提供customerId、amount和status字段了。
const UpdateInvoice = FormSchema.omit({ id: true, date: true });


export async function createInvoice(formData: FormData) {
   throw new Error("Failed to create invoice. Please check the input and try again.");
   try {
    const { customerId, amount, status } = CreateInvoice.parse({
        ...Object.fromEntries(formData.entries()),
    });
  
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];
  
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) { console.error(error);
    // We'll also log the error to the console for now
   
    throw new Error("Failed to create invoice. Please check the input and try again.");
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
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