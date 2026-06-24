import { ZodError } from 'zod';

export function zodMessage(err: ZodError): string {
  const flat = err.flatten();
  const fieldMsgs = Object.values(flat.fieldErrors).flat() as string[];
  return fieldMsgs[0] ?? flat.formErrors[0] ?? 'Invalid input';
}
