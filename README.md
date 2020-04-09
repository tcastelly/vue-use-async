# Xhr helpers to use in back and client (VueJS) projects

# Navigation

- [Installation](#Installation)
- [Usage](#Usage)
- [FlowJS](#FlowJS)

# Installation
`npm install vue-use-async`

# Usage
```javascript
import { Xhr, useXhr, useAsync } from 'vue-use-async';
```
- Xhr Class

  ```javascript
  new Xhr().get({ url: '/' });
  ```

- useXhr, you must install `@vue/composition-api` via `Vue.use()` before using other APIs:
  ```javascript
  const { get } = useXhr({ token });
  const { 
    data, 
    isPending,
    promise,
  } = get({ url: '/', cacheDuration: 200 });
  ```
  E.g; In `setup`, a computed bearer token can be used. Each query has data bind to be used
  directly in a template.
  A cache can be specified, therefore during this time an other query with same parameters will be 
  directly resolved.
  
- useAsync, similar to `useXhr` can resolve a function when computed parameters changed.
  if `condition` is used, the function will wait `true` before being applied.
  ```javascript
  const func = () => Promise.resolve('ok');
  const { data } = useAsync(func, [params, condition]);
  ```

# FlowJS
FlowJS is used as static types. `index.js.flow` import all definitions. 
