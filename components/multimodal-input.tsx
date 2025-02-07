'use client';

import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { cn, sanitizeUIMessages } from '@/lib/utils';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Image from 'next/image';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import equal from 'fast-deep-equal';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  selectedModelId = 'gpt-4', // Default model
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  className?: string;
  selectedModelId?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const primaryWallet = wallets?.[0];
  const [showLoginWidget, setShowLoginWidget] = useState(false);

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [adjustHeight]);

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '48px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
  }, [localStorageInput, setInput, adjustHeight]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  useEffect(() => {
    // Only hide login widget if both initialized and authenticated
    if (ready && authenticated && showLoginWidget) {
      console.log('🔓 Auth confirmed, hiding login widget', {
        ready,
        authenticated,
        userId: primaryWallet?.address,
        timestamp: new Date().toISOString()
      });
      setShowLoginWidget(false);
      toast.success('Successfully connected! You can now send messages.');
    }
  }, [ready, authenticated, showLoginWidget, primaryWallet]);

  const submitForm = useCallback(() => {
    // Only check auth if SDK is initialized
    if (!ready) {
      console.log('⏳ SDK not initialized, waiting...', {
        ready,
        authenticated,
        userId: primaryWallet?.address,
        timestamp: new Date().toISOString()
      });
      toast.error('Please wait while we initialize the connection...');
      return;
    }

    console.log('✉️ Submitting message', {
      ready,
      authenticated,
      userId: primaryWallet?.address,
      modelId: selectedModelId,
      timestamp: new Date().toISOString()
    });
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    ready,
    authenticated,
    primaryWallet,
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    selectedModelId,
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  return (
    <div className="relative w-full flex flex-col gap-4">
      {showLoginWidget && !authenticated && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 rounded-md">
          <Button onClick={login} variant="default">
            Connect Wallet to Continue
          </Button>
        </div>
      )}

      <div className={cn('relative flex items-center', className)}>
        <Textarea
          ref={textareaRef}
          tabIndex={0}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          spellCheck={false}
          className="min-h-[48px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submitForm();
            }
          }}
        />

        <div className="absolute right-0 flex items-center px-3 py-2">
          <PureAttachmentsButton
            fileInputRef={fileInputRef}
            isLoading={isLoading}
          />
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            multiple
            onChange={handleFileChange}
          />
          {isLoading ? (
            <PureStopButton stop={stop} setMessages={setMessages} />
          ) : (
            <PureSendButton
              submitForm={submitForm}
              input={input}
              uploadQueue={uploadQueue}
              authenticated={authenticated}
              login={login}
            />
          )}
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2">
          {attachments.map((attachment, i) => (
            <div key={i} className="relative">
              <PreviewAttachment
                attachment={attachment}
                isUploading={false}
              />
              <button
                onClick={() => {
                  setAttachments((current) =>
                    current.filter((_, index) => index !== i),
                  );
                }}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-1 hover:bg-red-600"
                aria-label="Remove attachment"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadQueue.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2">
          {uploadQueue.map((fileName, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm"
            >
              <span className="animate-pulse">{fileName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PureAttachmentsButton({
  fileInputRef,
  isLoading,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  isLoading: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cx('h-8 w-8 p-0', {
        'opacity-50': isLoading,
      })}
      disabled={isLoading}
      onClick={() => fileInputRef.current?.click()}
    >
      <PaperclipIcon />
      <span className="sr-only">Attach files</span>
    </Button>
  );
}

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="size-8 p-0"
      onClick={() => {
        stop();
        setMessages((messages) => sanitizeUIMessages(messages));
      }}
    >
      <StopIcon />
      <span className="sr-only">Stop generating</span>
    </Button>
  );
}

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
  authenticated,
  login,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  authenticated: boolean;
  login: () => void;
}) {
  const handleClick = () => {
    if (!authenticated) {
      login();
      return;
    }
    submitForm();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className={cx('h-8 w-8 p-0', {
        'opacity-50': !input.trim() && uploadQueue.length === 0,
      })}
      disabled={!input.trim() && uploadQueue.length === 0}
      onClick={handleClick}
    >
      <ArrowUpIcon />
      <span className="sr-only">Send message</span>
    </Button>
  );
}

export const MultimodalInput = memo(PureMultimodalInput, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.input === nextProps.input &&
    prevProps.isLoading === nextProps.isLoading &&
    equal(prevProps.attachments, nextProps.attachments) &&
    equal(prevProps.messages, nextProps.messages)
  );
});
