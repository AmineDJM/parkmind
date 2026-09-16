'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from './button';
import { Spinner } from './spinner';

/** A submit button that reflects the enclosing form's pending state. */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <Spinner />}
      {pending ? pendingLabel ?? children : children}
    </Button>
  );
}
