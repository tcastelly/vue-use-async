# Xhr helpers to use in VueJS 3 projects

# Navigation

- [Installation](#Installation)
- [Usage](#Usage)
- [Types](#Types)

# Installation
`npm install vue-use-async`

# Usage
## Xhr Class

```javascript
import { Xhr } from 'vue-use-async';

new Xhr().get({ url: '/' });
```

## useXhr
```javascript
import { useXhr } from 'vue-use-async';

export default function () {
  const { get } = useXhr({ token });

  const { 
    data, 
    isPending,
    promise,
  } = get({ url: '/', cacheDuration: 200 });

  // ...
}
```
  E.g; In `setup`, a computed bearer token can be used. Each query has `data` bind to be used
  directly in a template.
  A cache can be specified, therefore during this time another query with same parameters will be 
  directly resolved.
  
## useAsync
Similar to `useXhr` can resolve a function when computed parameters changed. if `condition` is used, the function will wait `true` before being applied.
```javascript
import { useAsync } from 'vue-use-async';

export default function () {
  const func = () => Promise.resolve('ok');

  const { data } = useAsync(func, [params, condition]);

  // ...
}
```
  
## useMutation
Create a mutate function to be called with parameters. 
```javascript
import { useMutate } from 'vue-use-async';
const {
  mutate,
  onEnd,
  onError,
} = useMutation(update);

mutate(p1, p2, p3);

// ...
```
  
## useResult
`useXhr` and `useAsyc` return `data`. By default, it will be null. Thanks to `useResult` it's possible to initialize it.
```javascript
import { useAsync, useResult } from 'vue-use-async';

const { data } = useAsync(getProducts);

const products = useResult(data, []);

// ...
```

## useSpinner
Useful to bind the `isPending` to a spinner icon with a minimum duration.
```javascript
import { useAsync, useSpinner } from 'vue-use-async';

export default function () {
  const func = () => Promise.resolve('ok');

  const { data, isPending } = useAsync(func, [params, condition]);

  const isPendingSpinner = useSpinner(isPending);

  // ...
}
```

### error handler
It's possible to capture rejected promise with [errorCaptured](https://vuejs.org/v2/api/#errorCaptured)

# Types
Typescript and FlowJS are supported.
