# Anthropic React Native Client

The goal of this library is to use [React Native SSE](https://github.com/binaryminds/react-native-sse) instead of polyfills to support calling the Anthropic API directly from React Native with streaming. The package uses the same types and API as the [Anthropic Node SDK](https://github.com/anthropics/anthropic-sdk-typescript) wherever possible.

> [!CAUTION]
> You should never expose any secrets in the bundle of a web or mobile app. The correct usage of this client package is with a backend that proxies the Anthropic call while making sure access is secured. The `baseURL` parameter for this Anthropic client is thus mandatory. If you set the baseURL to https://api.anthropic.com/v1, you are basically exposing your Anthropic API key on the internet! This example in this repo uses [Backmesh](https://backmesh.com).

### Contributions and Feature Requests

If you would like to contribute or request a feature, please join our [Discord](https://discord.com/invite/FfYyJfgUUY) and ask questions in the **#oss** channel or create a pull request or issue.

### Setup

Install the package

```bash
npm i anthropic-react-native
```

And then instantiate the client:

```typescript
import Anthropic from 'anthropic-react-native';

const client = new Anthropic({
  baseURL:
    'https://edge.backmesh.com/v1/proxy/PyHU4LvcdsQ4gm2xeniAFhMyuDl2/yWo35DdTROVMT52N0qs4/',
  // The backmesh proxy uses your auth provider's JWT to authorize access
  apiKey: supabase.auth.session().access_token,
});
```

### Usage

The streaming APIs uses an [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) from [react-native-sse](https://github.com/binaryminds/react-native-sse) under the hood to provide a required typed event callbacks for each of the [Anthropic API Types](https://docs.anthropic.com/en/api/messages-streaming#event-types).

```typescript
client.messages.stream(
  {
    model: 'claude-3-5-sonnet-20240620',
    messages: [{ role: 'user', content: userInput }],
    max_tokens: 1024,
  },
  {
    onError: (error) => {
      console.error('SSE Error:', error); // Handle any errors here
    },
    onMessageStart: () => {
      setUserInput('');
    },
    onContentBlockDelta: (ev: ContentBlockDeltaEvent) => {
      if (ev.delta.type === 'text_delta')
        setText((prevText) => prevText + (ev.delta as TextDelta).text);
    },
    onMessageStop: () => {
      console.log('SSE connection for completion closed.'); // Handle when the connection is opened
    },
  }
);
```

Check the [example](https://github.com/backmesh/anthropic-react-native/blob/main/sample/app/index.tsx) for more details

## Coverage

- [x] [Messages](https://docs.anthropic.com/en/api/messages)

### License

MIT
