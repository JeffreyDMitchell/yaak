import { DropdownMenuRadio } from './Dropdown';
import { Button } from './Button';
import { Input } from './Input';
import type { FormEvent } from 'react';
import { IconButton } from './IconButton';

interface Props {
  sendRequest: () => void;
  loading: boolean;
  method: string;
  url: string;
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
  className?: string;
}

export function UrlBar({
  className,
  sendRequest,
  loading,
  onMethodChange,
  method,
  onUrlChange,
  url,
}: Props) {
  const handleSendRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendRequest();
  };

  return (
    <form onSubmit={handleSendRequest} className="w-full flex items-center">
      <Input
        hideLabel
        useEditor={{ useTemplating: true, contentType: 'url' }}
        size="sm"
        className="font-mono text-sm"
        name="url"
        label="Enter URL"
        containerClassName={className}
        onChange={onUrlChange}
        defaultValue={url}
        placeholder="Enter a URL..."
        leftSlot={
          <DropdownMenuRadio
            onValueChange={(v) => onMethodChange(v.value)}
            value={method.toUpperCase()}
            items={[
              { label: 'GET', value: 'GET' },
              { label: 'PUT', value: 'PUT' },
              { label: 'POST', value: 'POST' },
              { label: 'PATCH', value: 'PATCH' },
              { label: 'DELETE', value: 'DELETE' },
              { label: 'OPTIONS', value: 'OPTIONS' },
              { label: 'HEAD', value: 'HEAD' },
            ]}
          >
            <Button
              type="button"
              disabled={loading}
              size="sm"
              className="ml-1 mr-2 !px-2 !text-gray-800"
              justify="start"
            >
              {method.toUpperCase()}
            </Button>
          </DropdownMenuRadio>
        }
        rightSlot={
          <IconButton
            type="submit"
            size="sm"
            icon={loading ? 'update' : 'paper-plane'}
            spin={loading}
            disabled={loading}
            className="mx-1 !px-4"
            title="Send Request"
          />
        }
      />
    </form>
  );
}