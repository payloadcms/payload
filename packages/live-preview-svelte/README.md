# Payload Live Preview - Svelte

Svelte live preview using `@payloadcms/live-preview` package and Svelte `writable` and `readable` store.

The `useLivePreview` returns a readable subscribe and loading, which is also a readable.

## Simple Example without loading or $derived

With this example, we a auto-subscribing to the response and then use `$article` in the body to access the data.
In many cases you will want to use a $derived rune to alter the data, such as converting RichText.

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
	import { useLivePreview } from '$lib/live-preview-store';
  import { readable } from 'svelte/store';
  import { PUBLIC_PAYLOAD_URL } from '$env/static/public';

	let { data }: PageProps = $props();

  let article = seLivePreview(data, {
      serverURL: PUBLIC_PAYLOAD_URL,
    });
</script>

<article>
	<h1>{$article.title}</h1>
	<div>{@html $article.content}</div>
</article>

```

## Example without loading with $derived

In this example we check to see if it's livePreview and then conditionally load useLivePreview.
We also use $derived to alter the content field.

```svelte

<script lang="ts">
  import type { PageProps } from './$types';
  import { page } from '$app/state';
	import { useLivePreview } from '$lib/live-preview-store';
	import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';
  import { readable } from 'svelte/store';
  import { PUBLIC_PAYLOAD_URL } from '$env/static/public';

  const url = page.url;
  const isLivePreview = url.searchParams.get('livePreview') === 'true';

	let { data }: PageProps = $props();

  let payloadDocStore = readable(data);

	if (isLivePreview) {
		payloadDocStore = useLivePreview(data, {
      serverURL: PUBLIC_PAYLOAD_URL,
    });
	}

	const article: typeof data = $derived.by<typeof data>(() => {
		const doc = $payloadDocStore;
		return {
      ...doc,
			content: convertLexicalToHTML({ data: doc.content }),
		};
	});
</script>

<article>
	<h1>{article.title}</h1>
	<div>{@html article.content}</div>
</article>

```

## Example with loading and $derived

Loading is in there mainly to replicate the other useLivePreview packages,
however, in my tests, it's not really needed, as the data loads instantly.

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  import { page } from '$app/state';
	import { useLivePreview } from '$lib/live-preview-store';
	import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';
  import { readable } from 'svelte/store';
  import { PUBLIC_PAYLOAD_URL } from '$env/static/public';

  const url = page.url;
  const isLivePreview = url.searchParams.get('livePreview') === 'true';

	let { data }: PageProps = $props();

  let payloadDocStore = readable(data);
  let loading = readable(false);

	if (isLivePreview) {
		const livePreviewStore = useLivePreview(data, {
      serverURL: PUBLIC_PAYLOAD_URL,
    });

    payloadDocStore = livePreviewStore;
    loading = livePreviewStore.loading;
	}

	const article: typeof data = $derived.by<typeof data>(() => {
		const doc = $payloadDocStore;
		return {
      ...doc,
			content: convertLexicalToHTML({ data: doc.content }),
		};
	});
</script>

<article>
  {#if $loading}
    <div>Loading...</div>
  {/if}
	<h1>{article.title}</h1>
	<div>{@html article.content}</div>
</article>
```
