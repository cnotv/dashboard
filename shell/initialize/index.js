// Taken from @nuxt/vue-app/template/index.js
// This file was generated during Nuxt migration

import { createApp } from 'vue';
import { createRouter } from '../config/router.js';
import NuxtChild from '../components/nuxt/nuxt-child.js';
import App from './App.js';
import { setContext, getRouteData, normalizeError } from '../utils/nuxt';
import { createStore } from '../config/store.js';

/* Plugins */
import { loadDirectives } from '@shell/plugins';
import '../plugins/portal-vue.js';
import cookieUniversalNuxt from '../utils/cookie-universal-nuxt.js';
import axios from '../utils/axios.js';
import plugins from '../core/plugins.js';
import pluginsLoader from '../core/plugins-loader.js';
import axiosShell from '../plugins/axios';
import '../plugins/tooltip';
import '../plugins/v-select';
import '../plugins/js-yaml';
import '../plugins/resize';
import '../plugins/shortkey';
import '../plugins/i18n';
import '../plugins/global-formatters';
import '../plugins/trim-whitespace';
// import '../plugins/extend-router';

import * as intNumber from '../plugins/int-number';
import * as positiveIntNumber from '../plugins/positive-int-number.js';
import nuxtClientInit from '../plugins/nuxt-client-init';
import replaceAll from '../plugins/replaceall';
import backButton from '../plugins/back-button';
import plugin from '../plugins/plugin';
import codeMirror from '../plugins/codemirror-loader';
import '../plugins/formatters';
import version from '../plugins/version';
import steveCreateWorker from '../plugins/steve-create-worker';
import { REDIRECTED } from '@shell/config/cookies';
import { UPGRADED, _FLAGGED, _UNFLAG } from '@shell/config/query-params';
const vueApp = createApp({});

// Prevent extensions from overriding existing directives
// Hook into vueApp.directive and keep track of the directive names that have been added
// and prevent an existing directive from being overwritten
const directiveNames = {};
const vueDirective = vueApp.directive;

vueApp.directive = function(name) {
  if (directiveNames[name]) {
    console.log(`Can not override directive: ${ name }`); // eslint-disable-line no-console

    return;
  }

  directiveNames[name] = true;

  vueDirective.apply(Vue, arguments);
};

// Load the directives from the plugins - we do this with a function so we know
// these are initialized here, after the code above which keeps track of them and
// prevents over-writes
loadDirectives();

// Component: <NuxtChild>
vueApp.component(NuxtChild.name, NuxtChild);
vueApp.component('NChild', NuxtChild);

async function extendApp(config = {}) {
  const router = await createRouter(config);
  vueApp.use(router);

  const store = createStore();

  // Add this.$router into store actions/mutations
  store.$router = router;

  // Create Root instance

  // here we inject the router and store to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const app = {
    store,
    router,
    nuxt: {
      err:     null,
      dateErr: null,
      error(err) {
        err = err || null;
        app.context._errored = Boolean(err);
        err = err ? normalizeError(err) : null;
        let nuxt = app.nuxt; // to work with @vue/composition-api, see https://github.com/nuxt/nuxt.js/issues/6517#issuecomment-573280207

        if (this) {
          nuxt = this.nuxt || this.$options.nuxt;
        }
        nuxt.dateErr = Date.now();
        nuxt.err = err;

        return err;
      }
    },
    ...App
  };

  // Make app available into store via this.app
  store.app = app;

  const next = (location) => app.router.push(location);
  // Resolve route
  const route = router.currentRoute.value;

  // Set context to app.context
  await setContext(app, {
    store,
    route,
    next,
    error:   app.nuxt.error.bind(app),
    payload: undefined,
    req:     undefined,
    res:     undefined
  });

  function inject(key, value) {
    if (!key) {
      throw new Error('inject(key, value) has no key provided');
    }
    if (value === undefined) {
      throw new Error(`inject('${ key }', value) has no value provided`);
    }

    key = `$${ key }`;
    // Add into app
    app[key] = value;
    // Add into context
    if (!app.context[key]) {
      app.context[key] = value;
    }

    // Add into store
    store[key] = app[key];

    // Check if plugin not already installed
    const installKey = `__nuxt_${ key }_installed__`;

    window.installedPlugins = window.installedPlugins || {};

    if (window.installedPlugins[installKey]) {
      return;
    }
    window[window.installedPlugins] = true;
    // Call vueApp.use() to install the plugin into vm
    vueApp.use(() => {
      if (!Object.prototype.hasOwnProperty.call(vueApp.config.globalProperties, key)) {
        Object.defineProperty(vueApp.config.globalProperties, key, {
          get() {
            return this.$root.$options[key];
          }
        });
      }
    });
  }

  // Inject runtime config as $config
  inject('config', config);

  // Plugin execution
  [
    cookieUniversalNuxt,
    axios,
    plugins,
    pluginsLoader,
    axiosShell,
    intNumber,
    positiveIntNumber,
    nuxtClientInit,
    replaceAll,
    backButton,
    plugin,
    codeMirror,
    version,
    steveCreateWorker,
  ].forEach(async(pluginFn) => {
    if (typeof pluginFn === 'function') {
      await pluginFn(app.context, inject);
    }
  });

  // Wait for async component to be resolved first
  await new Promise((resolve, reject) => {
    // Ignore 404s rather than blindly replacing URL in browser
    const route = router.currentRoute.value;

    if (!route.matched.length) {
      return resolve();
    }

    router.replace(app.context.route.fullPath, resolve, (err) => {
      // https://github.com/vuejs/vue-router/blob/v3.4.3/src/util/errors.js
      if (!err._isRouter) {
        return reject(err);
      }
      if (err.type !== 2 /* NavigationFailureType.redirected */) {
        return resolve();
      }

      // navigated to a different route in router guard
      const unregister = router.afterEach(async(to, from) => {
        app.context.route = await getRouteData(to);
        app.context.params = to.params || {};
        app.context.query = to.query || {};
        unregister();
        resolve();
      });
    });

    router.afterEach((to) => {
      const upgraded = to.query[UPGRADED] === _FLAGGED;

      if ( upgraded ) {
        router.applyQuery({ [UPGRADED]: _UNFLAG });

        store.dispatch('growl/success', {
          title:   store.getters['i18n/t']('serverUpgrade.title'),
          message: store.getters['i18n/t']('serverUpgrade.message'),
          timeout: 0,
        });
      }
    });
  });

  // This tells Ember not to redirect back to us once you've already been to dashboard once.
  // TODO: Remove this once the ember portion of the app is no longer needed
  if ( !app.context.$cookies.get(REDIRECTED) ) {
    app.context.$cookies.set(REDIRECTED, 'true', {
      path:     '/',
      sameSite: true,
      secure:   true,
    });
  }

  return {
    store,
    app,
    router
  };
}

export { extendApp };
