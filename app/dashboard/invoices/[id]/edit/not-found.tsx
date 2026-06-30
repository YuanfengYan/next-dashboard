export default function NotFound() {
  return (
    <main className="flex h-full flex-col items-center justify-center">
      <h2 className="text-center">Invoice not found!</h2>
      <p className="mt-2 text-center text-sm text-gray-500">
        The invoice you are looking for does not exist.
      </p>
    </main>
  );
}