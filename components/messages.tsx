import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Greeting } from './greeting';
import { memo } from 'react';
import { type Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AssistantMessage } from './AssistantMessage';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  isActive: boolean;
  setIsActive:any;
  append:any;
  setInput:any;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  isActive,
  setIsActive,
  append,
  setInput
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div className="flex flex-col min-w-0 w-full flex-1 pt-4">

      <div
        className={`flex transition-all duration-1000
          ${messages.length === 0
          ? 'items-center justify-center flex-1'
          : 'pb-4 shadow-md shadow-black/20 mt-[-20px]'
        }`}
      >
        <Greeting
          isActive={isActive}
          setIsActive={setIsActive}
          messagesLength={messages.length}
          append={append}
          setInput={setInput}
        />
      </div>

      {messages.length > 0 && (
      <div
        ref={messagesContainerRef}
        className="flex flex-col gap-6 overflow-y-scroll flex-1 !bg-transparent max-h-[50vh] mt-2"
      >
        {messages.map((message, index) => {
          if (message.role === 'assistant') {
            // Find all parts of the message
            const textParts = message.parts.filter(part => part.type === 'text');
            const toolParts = message.parts.filter(part => part.type === 'tool-invocation');

            return (
              <div key={message.id} className="space-y-4">
                {textParts.map((part, partIndex) => (
                  <AssistantMessage setInput={setInput} key={`${message.id}-${partIndex}`} message={part.text} />
                ))}
                {toolParts.map((part, partIndex) => {
                  if (part.type === 'tool-invocation' && part.toolInvocation.state === 'result') {
                    return (
                      <AssistantMessage setInput={setInput} key={`${message.id}-tool-${partIndex}`} message={JSON.stringify(part.toolInvocation.result)} />
                    );
                  }
                  return null;
                })}
              </div>
            );
          }
          return (
            <PreviewMessage
              key={message.id}
              chatId={chatId}
              message={message}
              isLoading={status === 'streaming' && messages.length - 1 === index}
              vote={
              votes
            ? votes.find((vote) => vote.messageId === message.id)
            : undefined
              }
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
            />
          );
        })}

        {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

        <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px] !bg-transparent"
        />
        </div>
      )}
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
