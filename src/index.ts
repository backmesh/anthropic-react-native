import EventSource from 'react-native-sse';
import {
  Anthropic as AnthropicSDK,
  ClientOptions as ClientOptionsSDK,
} from '@anthropic-ai/sdk';

// export types from this library
export type onError = (error: any) => void;
export type onContentBlockStart = (message: ContentBlockStartEvent) => void;
export type onContentBlockStop = (message: ContentBlockStopEvent) => void;
export type onContentBlockDelta = (message: ContentBlockDeltaEvent) => void;
export type onMessageStart = (event: MessageStartEvent) => void;
export type onMessageStop = (event: MessageStopEvent) => void;
export type onMessageDelta = (event: MessageDeltaEvent) => void;
export type onEvents = {
  onError?: onError;
  onMessageStop?: onMessageStop;
  onMessageStart?: onMessageStart;
  onMessageDelta?: onMessageDelta;
  onContentBlockStart?: onContentBlockStart;
  onContentBlockStop?: onContentBlockStop;
  onContentBlockDelta?: onContentBlockDelta;
};
export type onMessageData = (data: Message) => void;
export interface ClientOptions extends ClientOptionsSDK {
  apiKey: string;
  baseURL: string;
}
// export top level types from AnthropicSDK
export import MessageCreateParams = AnthropicSDK.MessageCreateParamsNonStreaming;
export import Message = AnthropicSDK.Message;
export import ContentBlock = AnthropicSDK.ContentBlock;
export import ContentBlockDeltaEvent = AnthropicSDK.ContentBlockDeltaEvent;
export import ContentBlockStartEvent = AnthropicSDK.ContentBlockStartEvent;
export import ContentBlockStopEvent = AnthropicSDK.ContentBlockStopEvent;
export import MessageDeltaEvent = AnthropicSDK.MessageDeltaEvent;
export import MessageStartEvent = AnthropicSDK.MessageStartEvent;
export import MessageStopEvent = AnthropicSDK.MessageStopEvent;
export import TextDelta = AnthropicSDK.TextDelta;
export import InputJSONDelta = AnthropicSDK.InputJSONDelta;
export import ToolUseBlock = AnthropicSDK.ToolUseBlock;
export import Tool = AnthropicSDK.Tool;
export import Usage = AnthropicSDK.Usage;

export class Anthropic {
  public apiKey: string;
  public baseURL: string;
  private client: AnthropicSDK;

  constructor(opts: ClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseURL = opts.baseURL;
    // opts.dangerouslyAllowBrowser = true;
    this.client = new AnthropicSDK(opts);
  }

  public messages = {
    create: async (body: MessageCreateParams): Promise<Message> =>
      this.client.messages.create(body),
    stream: (params: MessageCreateParams, callbacks: onEvents): void =>
      this._stream(`${this.baseURL}/messages`, params, callbacks),
  };

  private _stream(url: string, params: MessageCreateParams, cbs: onEvents) {
    const requestBody = { ...params, stream: true };

    const eventSource = new EventSource(url, {
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/streaming.ts
    // https://docs.anthropic.com/en/api/messages-streaming#event-types
    // https://github.com/anthropics/anthropic-sdk-typescript/blob/main/examples/raw-streaming.ts
    const eventHandlers: { [key: string]: (event: any) => void } = {
      content_block_delta: (event) => {
        try {
          const data = JSON.parse(event.data);
          cbs.onContentBlockDelta?.(data);
        } catch (error: any) {
          cbs.onError?.(
            new Error(`JSON Parse on ${event.data} with error ${error.message}`)
          );
          eventSource.close();
        }
      },
      message_stop: (event) => {
        cbs.onMessageStop?.(JSON.parse(event.data));
        eventSource.close();
      },
      message_start: (event) => {
        cbs.onMessageStart?.(JSON.parse(event.data));
      },
      content_block_stop: (event) => {
        cbs.onContentBlockStop?.(JSON.parse(event.data));
      },
      error: (event) => {
        cbs.onError?.(new Error(`EventSource error: ${event.message}`));
        eventSource.close();
      },
    };

    Object.keys(eventHandlers).forEach((eventType) => {
      eventSource.addEventListener(eventType as any, eventHandlers[eventType]);
    });
  }
}

export default Anthropic;
