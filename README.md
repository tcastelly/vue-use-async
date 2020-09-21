# Xhr helpers to use in client (VueJS) projects

# Navigation

- [Installation](#Installation)
- [Usage](#Usage)
- [FlowJS](#FlowJS)

# Installation
`npm install vue-use-async`

# Usage
- Xhr Class

  ```javascript
  import { Xhr } from 'vue-use-async';
  
  new Xhr().get({ url: '/' });
  ```

- useXhr:
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
  E.g; In `setup`, a computed bearer token can be used. Each query has data bind to be used
  directly in a template.
  A cache can be specified, therefore during this time an other query with same parameters will be 
  directly resolved.
  
- useAsync, similar to `useXhr` can resolve a function when computed parameters changed.
  if `condition` is used, the function will wait `true` before being applied.
  ```javascript
  import { useAsync } from 'vue-use-async';
  
  export default function () {
    const func = () => Promise.resolve('ok');
  
    const { data } = useAsync(func, [params, condition]);
  
    // ...
  }
  ```
  
- error handler, it's possible to capture rejected promise with [errorCaptured](https://vuejs.org/v2/api/#errorCaptured)
  
- useSpinner, useful to bind the `isPending` to a spinner icon. A minimum duration
  ```javascript
  import { useAsync, useSpinner } from 'vue-use-async';
  
  export default function () {
    const func = () => Promise.resolve('ok');
  
    const { data, isPending } = useAsync(func, [params, condition]);
  
    const isPendingSpinner = useSpinner(isPending);
  
    // ...
  }
  ```

# FlowJS
FlowJS is used as static types. `index.js.flow` import all definitions. 
